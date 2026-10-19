import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateRegister, validatePassword } from '../validators.js';
import { requireAuth } from '../middleware/auth.js';
import { isBlocked, registerFailedAttempt, resetAttempts } from '../middleware/loginLimiter.js';

const SALT_ROUNDS = 10;

export function authRouter(db, { jwtSecret, jwtExpiresIn }) {
  const router = Router();

  function createToken(userId) {
    return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
  }

  // Nunca se devuelve el hash de la contraseña al cliente
  function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at };
  }

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    const errors = validateRegister(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    const passwordHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    const result = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, passwordHash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ user: publicUser(user), token: createToken(user.id) });
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    if (isBlocked(email)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;

    // Mismo mensaje si el email no existe o la contraseña está mal,
    // así no se puede averiguar qué emails están registrados.
    if (!passwordOk) {
      registerFailedAttempt(email);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    resetAttempts(email);
    res.json({ user: publicUser(user), token: createToken(user.id) });
  });

  // GET /api/auth/me  (ruta protegida)
  router.get('/me', requireAuth(jwtSecret), (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: publicUser(user) });
  });

  // PUT /api/auth/password  (ruta protegida)
  router.put('/password', requireAuth(jwtSecret), async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    if (!user || !currentPassword || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    res.json({ message: 'Contraseña actualizada' });
  });

  return router;
}
