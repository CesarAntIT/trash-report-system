/**
 * PRUEBAS: Registro e Inicio de Sesión
 *
 * Historias cubiertas:
 *   TRA-Registro  — Como un Usuario, quiero registrarme
 *   TRA-Login     — Como un Usuario, quiero Iniciar Sesión
 *
 * Correr: npx jest tests/auth.test.js --forceExit
 */
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { setupDb, teardownDb, clearCollections, createUser } = require('./helpers');

const app = require('../server');
const User = require('../src/models/User');

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearCollections);

// ═══════════════════════════════════════════════════════════════════════════
// TRA-REGISTRO: POST /api/auth/register
// ═══════════════════════════════════════════════════════════════════════════

describe('REGISTRO | POST /api/auth/register', () => {

  // ── Campos requeridos del formulario ──────────────────────────────────────

  test('CA-R01 | Nombre Completo requerido → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nuevo@test.com', password: 'pass123', confirmPassword: 'pass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/nombre/i);
  });

  test('CA-R02 | Email requerido → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Juan', password: 'pass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/correo/i);
  });

  test('CA-R03 | Email con formato inválido → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Juan', email: 'no-es-email', password: 'pass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/correo/i);
  });

  test('CA-R04 | Contraseña requerida → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Juan', email: 'juan@test.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/contraseña/i);
  });

  test('CA-R05 | Contraseña menor a 6 caracteres → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Juan', email: 'juan@test.com', password: 'abc',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 caracteres/i);
  });

  test('CA-R06 | Nombre solo espacios en blanco → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '   ', email: 'juan@test.com', password: 'pass123',
    });
    expect(res.status).toBe(400);
  });

  // ── Teléfono y ubicación son opcionales ──────────────────────────────────

  test('CA-R07 | Teléfono es opcional — registro sin teléfono funciona', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Juan', email: 'juan@test.com', password: 'pass123',
    });
    expect(res.status).toBe(201);
  });

  test('CA-R08 | Ubicación de domicilio es opcional', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Juan', email: 'juan2@test.com', password: 'pass123',
      address: { latitude: 20.9674, longitude: -89.6237 },
    });
    expect(res.status).toBe(201);
    const saved = await User.findOne({ email: 'juan2@test.com' });
    expect(saved.address.latitude).toBeCloseTo(20.9674);
  });

  // ── Email duplicado ──────────────────────────────────────────────────────

  test('CA-R09 | Email ya registrado → 400', async () => {
    await createUser({ email: 'duplicado@test.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Otro', email: 'duplicado@test.com', password: 'pass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/registrado/i);
  });

  // ── Happy path: registro exitoso e inicio automático ─────────────────────

  test('CA-R10 | Registro exitoso → 201 con token JWT', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Maria', email: 'maria@test.com', password: 'pass123',
      phone: '9991234567',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');         // sesión automática
    expect(res.body.user.name).toBe('Maria');
  });

  test('CA-R11 | Token devuelto es un JWT válido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Pedro', email: 'pedro@test.com', password: 'pass123',
    });
    const jwt = require('jsonwebtoken');
    expect(() => jwt.verify(res.body.token, process.env.JWT_SECRET)).not.toThrow();
  });

  test('CA-R12 | Contraseña se guarda hasheada (no en texto plano)', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Ana', email: 'ana@test.com', password: 'pass123',
    });
    const user = await User.findOne({ email: 'ana@test.com' });
    expect(user.password).not.toBe('pass123');
    expect(await bcrypt.compare('pass123', user.password)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-LOGIN: POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════

describe('LOGIN | POST /api/auth/login', () => {

  let testUser;
  beforeEach(async () => {
    testUser = await createUser({ email: 'login@test.com' });
  });

  // ── Campos requeridos ────────────────────────────────────────────────────

  test('CA-L01 | Campos vacíos → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('CA-L02 | Solo espacios en blanco en email → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '   ', password: 'pass123' });
    expect(res.status).toBe(400);
  });

  test('CA-L03 | Solo espacios en blanco en contraseña → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: '   ' });
    expect(res.status).toBe(400);
  });

  test('CA-L04 | Email no registrado → 401 con mensaje claro', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com', password: 'pass123',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no está registrado/i);
  });

  test('CA-L05 | Contraseña incorrecta → 401 con mensaje claro', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/contraseña incorrecta/i);
  });

  // ── Happy path ───────────────────────────────────────────────────────────

  test('CA-L06 | Login exitoso → token JWT devuelto', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'login@test.com');
  });

  test('CA-L07 | Token es JWT verificable', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com', password: 'password123',
    });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('userId');
  });

  test('CA-L08 | Respuesta incluye datos del usuario (sin contraseña)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com', password: 'password123',
    });
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).toHaveProperty('name');
  });
});
