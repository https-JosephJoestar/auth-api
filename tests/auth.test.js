import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

const config = { jwtSecret: 'secreto-de-prueba', jwtExpiresIn: '1h' };
let app;

const usuario = { name: 'Ana Pérez', email: 'ana@example.com', password: 'clave1234' };

beforeEach(() => {
  app = createApp(createDb(':memory:'), config);
});

async function registrar(datos = usuario) {
  return request(app).post('/api/auth/register').send(datos);
}

test('registra un usuario nuevo y devuelve un token', async () => {
  const res = await registrar();

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'ana@example.com');
  assert.equal(res.body.user.password_hash, undefined);
});

test('no deja registrar dos veces el mismo email', async () => {
  await registrar();
  const res = await registrar({ ...usuario, email: 'ANA@example.com' });

  assert.equal(res.status, 409);
});

test('rechaza datos de registro inválidos', async () => {
  const res = await registrar({ name: 'A', email: 'no-es-email', password: '123' });

  assert.equal(res.status, 400);
  assert.equal(res.body.errors.length, 3);
});

test('inicia sesión con las credenciales correctas', async () => {
  await registrar();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: usuario.email, password: usuario.password });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test('rechaza una contraseña incorrecta', async () => {
  await registrar();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: usuario.email, password: 'otraclave99' });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Credenciales incorrectas');
});

test('bloquea el login después de 5 intentos fallidos', async () => {
  const datos = { ...usuario, email: 'bloqueo@example.com' };
  await registrar(datos);

  for (let i = 0; i < 5; i++) {
    await request(app).post('/api/auth/login').send({ email: datos.email, password: 'mal12345' });
  }
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: datos.email, password: datos.password });

  assert.equal(res.status, 429);
});

test('/me necesita token', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('/me devuelve el usuario con un token válido', async () => {
  const { body } = await registrar();
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Ana Pérez');
});

test('cambia la contraseña y permite entrar con la nueva', async () => {
  const { body } = await registrar();

  const cambio = await request(app)
    .put('/api/auth/password')
    .set('Authorization', `Bearer ${body.token}`)
    .send({ currentPassword: usuario.password, newPassword: 'nuevaClave2025' });
  assert.equal(cambio.status, 200);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: usuario.email, password: 'nuevaClave2025' });
  assert.equal(login.status, 200);
});
