# auth-api

API REST para registro e inicio de sesión de usuarios. La hice para entender bien cómo funciona la autenticación por detrás (hash de contraseñas, tokens JWT y rutas protegidas) en vez de usar una librería que lo haga todo.

## Qué hace

- Registro con validación de nombre, email y contraseña
- Login que devuelve un token JWT
- Rutas protegidas con middleware (`/me`, cambiar contraseña)
- Contraseñas guardadas con **bcrypt**, nunca en texto plano
- Bloqueo de 15 minutos después de 5 intentos fallidos de login
- Mismo mensaje de error si el email no existe o la contraseña está mal (para no revelar qué emails están registrados)

## Tecnologías

Node.js 22+ · Express · SQLite (`node:sqlite`) · bcryptjs · jsonwebtoken · node:test + supertest

## Cómo correrlo

```bash
npm install
cp .env.example .env   # y cambia JWT_SECRET
npm run dev
```

Tests:

```bash
npm test
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Crea una cuenta |
| POST | `/api/auth/login` | No | Devuelve un token |
| GET | `/api/auth/me` | Sí | Datos del usuario logueado |
| PUT | `/api/auth/password` | Sí | Cambia la contraseña |
| GET | `/api/health` | No | Comprueba que el servidor está vivo |

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@example.com","password":"clave1234"}'

curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <token>"
```

## Estructura

```
src/
  app.js              # configuración de express
  server.js           # arranque del servidor
  db.js               # conexión a SQLite y creación de tablas
  validators.js       # validación de datos de entrada
  middleware/
    auth.js           # verifica el JWT
    loginLimiter.js   # bloqueo por intentos fallidos
  routes/
    auth.js           # endpoints de autenticación
tests/
  auth.test.js
```

## Cosas que mejoraría

- Refresh tokens para no tener que volver a loguearse cada hora
- Guardar los intentos fallidos en Redis en vez de en memoria
- Recuperar contraseña por email
- Roles de usuario (admin / normal)
