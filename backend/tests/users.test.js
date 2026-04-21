/**
 * PRUEBAS: Información de Usuario · Editar Perfil · Seleccionar Ubicación
 *
 * Historias cubiertas:
 *   TRA-VerPerfil  — Ver información de usuario (ciudadano y admin)
 *   TRA-EditPerfil — Editar información de cuenta
 *   TRA-Ubicacion  — Seleccionar ubicación personal
 *
 * Correr: npx jest tests/users.test.js --forceExit
 */
const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupDb, teardownDb, clearCollections,
  makeToken, createUser,
} = require('./helpers');

const app = require('../server');
const User = require('../src/models/User');

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearCollections);

let user, token, admin, adminToken, other, otherToken;

beforeEach(async () => {
  user       = await createUser({ email: 'ciudadano@test.com', phone: '9991234567', address: { latitude: 20.9674, longitude: -89.6237, text: 'Calle 5 #123' } });
  token      = makeToken(user._id);
  admin      = await createUser({ email: 'admin@test.com', isAdmin: true });
  adminToken = makeToken(admin._id);
  other      = await createUser({ email: 'otro@test.com' });
  otherToken = makeToken(other._id);
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-VerPerfil: GET /api/users/:id
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-PERFIL | GET /api/users/:id — Ver Información de Usuario', () => {

  test('CA-01 | Sin token → 401', async () => {
    const res = await request(app).get(`/api/users/${user._id}`);
    expect(res.status).toBe(401);
  });

  test('CA-02 | Usuario inexistente → 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('CA-03 | Respuesta incluye ID de Usuario', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.id).toBeDefined();
  });

  test('CA-04 | Respuesta incluye Nombre Completo', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.usuario.nombre_completo).toBe('Test User');
  });

  test('CA-05 | Respuesta incluye Número de Teléfono', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.usuario.numero_telefono).toBe('9991234567');
  });

  test('CA-06 | Respuesta incluye Correo Electrónico', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.usuario.correo_electronico).toBe('ciudadano@test.com');
  });

  test('CA-07 | Respuesta incluye Dirección Personal como texto', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(typeof res.body.usuario.direccion_personal).toBe('string');
    expect(res.body.usuario.direccion_personal).toBe('Calle 5 #123');
  });

  test('CA-08 | Respuesta incluye coordenadas de ubicación', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.usuario.ubicacion).toMatchObject({
      latitud:  expect.any(Number),
      longitud: expect.any(Number),
    });
  });

  test('CA-09 | Contraseña NO incluida en la respuesta', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.usuario).not.toHaveProperty('password');
    expect(JSON.stringify(res.body)).not.toMatch('password');
  });

  test('CA-10 | esPropietario = true cuando el token es del mismo usuario', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.esPropietario).toBe(true);
  });

  test('CA-11 | esPropietario = false cuando es otro usuario', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.body.esPropietario).toBe(false);
  });

  test('CA-12 | Admin también puede ver la información de cualquier usuario', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.correo_electronico).toBe('ciudadano@test.com');
  });

  test('CA-13 | Usuario sin ubicación → ubicacion = null', async () => {
    const sinUbicacion = await createUser({ email: 'sinubicacion@test.com' });
    const t = makeToken(sinUbicacion._id);
    const res = await request(app).get(`/api/users/${sinUbicacion._id}`)
      .set('Authorization', `Bearer ${t}`);
    expect(res.body.usuario.ubicacion).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-EditPerfil: PUT /api/users/:id
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-EDITPERFIL | PUT /api/users/:id — Editar Información de Cuenta', () => {

  test('CA-14 | Sin token → 401', async () => {
    const res = await request(app).put(`/api/users/${user._id}`).send({ phone: '111' });
    expect(res.status).toBe(401);
  });

  test('CA-15 | Otro usuario intenta editar → 403', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ phone: '9990000000' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/solo puedes editar/i);
  });

  test('CA-16 | Actualizar teléfono exitosamente', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '9990000001' });
    expect(res.status).toBe(200);
    const updated = await User.findById(user._id);
    expect(updated.phone).toBe('9990000001');
  });

  test('CA-17 | Actualizar correo electrónico exitosamente', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nuevo@test.com' });
    expect(res.status).toBe(200);
    const updated = await User.findById(user._id);
    expect(updated.email).toBe('nuevo@test.com');
  });

  test('CA-18 | Correo duplicado al editar → 400', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'otro@test.com' }); // ya existe
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/en uso/i);
  });

  test('CA-19 | Actualizar dirección personal (texto)', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ address: { text: 'Calle Nueva #456' } });
    expect(res.status).toBe(200);
    const updated = await User.findById(user._id);
    expect(updated.address.text).toBe('Calle Nueva #456');
  });

  test('CA-20 | Actualizar ubicación con coordenadas', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ address: { latitude: 18.4861, longitude: -69.9312 } });
    expect(res.status).toBe(200);
    const updated = await User.findById(user._id);
    expect(updated.address.latitude).toBeCloseTo(18.4861);
    expect(updated.address.longitude).toBeCloseTo(-69.9312);
  });

  test('CA-21 | Campos en blanco no modifican datos existentes', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '', email: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no se enviaron campos/i);
  });

  test('CA-22 | Email inválido en edición → 400', async () => {
    const res = await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'no-es-email' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/correo/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-Ubicacion: validaciones de selección de ubicación
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-UBICACION | Seleccionar y guardar ubicación personal', () => {

  test('CA-23 | Ubicación guardada con latitud y longitud en registro', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Geo User', email: 'geo@test.com', password: 'pass123',
      address: { latitude: 20.5, longitude: -87.3 },
    });
    expect(res.status).toBe(201);
    const saved = await User.findOne({ email: 'geo@test.com' });
    expect(saved.address.latitude).toBeCloseTo(20.5);
    expect(saved.address.longitude).toBeCloseTo(-87.3);
  });

  test('CA-24 | Ubicación editada via PUT actualiza correctamente', async () => {
    await request(app).put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ address: { latitude: 19.4326, longitude: -99.1332 } });
    const updated = await User.findById(user._id);
    expect(updated.address.latitude).toBeCloseTo(19.4326);
    expect(updated.address.longitude).toBeCloseTo(-99.1332);
  });

  test('CA-25 | Latitud y longitud se incluyen en respuesta GET /api/users/:id', async () => {
    const res = await request(app).get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.usuario.ubicacion.latitud).toBeDefined();
    expect(res.body.usuario.ubicacion.longitud).toBeDefined();
  });
});
