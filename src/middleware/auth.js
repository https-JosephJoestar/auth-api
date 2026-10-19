import jwt from 'jsonwebtoken';

// Revisa el header "Authorization: Bearer <token>".
// Si el token es válido guarda el id del usuario en req.userId.
export function requireAuth(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Falta el token de acceso' });
    }

    try {
      const payload = jwt.verify(token, secret);
      req.userId = payload.sub;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}
