import express from 'express';
import { authRouter } from './routes/auth.js';

// Separo la creación de la app del arranque del servidor
// para poder probarla con supertest sin abrir un puerto.
export function createApp(db, config) {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter(db, config));

  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejador de errores: JSON mal formado o cualquier error no controlado
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}
