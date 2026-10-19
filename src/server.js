import { createApp } from './app.js';
import { createDb } from './db.js';

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Falta la variable de entorno JWT_SECRET (mira .env.example)');
  process.exit(1);
}

const db = createDb(process.env.DB_FILE || 'data.db');
const app = createApp(db, {
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
