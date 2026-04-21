/**
 * PRUEBAS: Panel de Administrador — Ver Reportes · Recibir · Filtrar Ciudadanos
 *
 * Historias cubiertas:
 *   TRA-8  — Ver Todos los Reportes (Admin)
 *   TRA-12 — Filtrar Ciudadanos por nombre/ubicación
 *
 * Correr: npx jest tests/admin.test.js --forceExit
 */
const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupDb, teardownDb, clearCollections,
  makeToken, createUser, createReport,
} = require('./helpers');

const app = require('../server');
const Report = require('../src/models/Report');
const Notification = require('../src/models/Notifications');

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearCollections);

let admin, adminToken, citizen, citizenToken;

beforeEach(async () => {
  admin       = await createUser({ email: 'admin@test.com', isAdmin: true });
  adminToken  = makeToken(admin._id);
  citizen     = await createUser({ email: 'citizen@test.com' });
  citizenToken = makeToken(citizen._id);
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-8: PATCH /api/reports/:id/receive — Botón "Recibir"
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-8 | PATCH /api/reports/:id/receive — Recibir Reporte (Admin)', () => {

  test('CA-01 | Sin token → 401', async () => {
    const report = await createReport(citizen._id);
    const res = await request(app).patch(`/api/reports/${report._id}/receive`);
    expect(res.status).toBe(401);
  });

  test('CA-02 | Ciudadano (no admin) intenta recibir → 403', async () => {
    const report = await createReport(citizen._id, { status: 'Pendiente' });
    const res = await request(app).patch(`/api/reports/${report._id}/receive`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/administrador/i);
  });

  test('CA-03 | Admin recibe reporte Pendiente → status cambia a Recibido', async () => {
    const report = await createReport(citizen._id, { status: 'Pendiente' });
    const res = await request(app).patch(`/api/reports/${report._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('Recibido');
  });

  test('CA-04 | Recibir reporte ya Recibido → 400', async () => {
    const report = await createReport(citizen._id, { status: 'Recibido' });
    const res = await request(app).patch(`/api/reports/${report._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Pendientes/i);
  });

  test('CA-05 | Recibir reporte Cancelado → 400', async () => {
    const report = await createReport(citizen._id, { status: 'Cancelado' });
    const res = await request(app).patch(`/api/reports/${report._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  test('CA-06 | Al recibir reporte → notificación al ciudadano creador', async () => {
    const report = await createReport(citizen._id, { status: 'Pendiente' });
    await request(app).patch(`/api/reports/${report._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`);
    const notifs = await Notification.find({ user: citizen._id });
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs.some(n => n.message.includes('recibido'))).toBe(true);
  });

  test('CA-07 | ID inexistente → 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).patch(`/api/reports/${fakeId}/receive`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-8: GET /api/reports — Lista Admin (no Cancelados)
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-8 | GET /api/reports — Lista de Todos los Reportes (Admin, BUG-08)', () => {

  test('CA-08 | Sin token → 401', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(401);
  });

  test('CA-09 | Devuelve array de reportes a usuario autenticado', async () => {
    await createReport(citizen._id, { status: 'Pendiente' });
    const res = await request(app).get('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('CA-10 | Reportes Cancelados NO aparecen en la lista admin', async () => {
    await createReport(citizen._id, { status: 'Cancelado',  locationName: 'Cancelado' });
    await createReport(citizen._id, { status: 'Pendiente',  locationName: 'Pendiente' });
    await createReport(citizen._id, { status: 'Recibido',   locationName: 'Recibido'  });

    const res = await request(app).get('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    const cancelados = res.body.filter(r => r.status === 'Cancelado');
    expect(cancelados).toHaveLength(0);
    expect(res.body).toHaveLength(2);
  });

  test('CA-11 | Filtro por status funciona (query ?status=Pendiente)', async () => {
    await createReport(citizen._id, { status: 'Pendiente' });
    await createReport(citizen._id, { status: 'Recibido'  });

    const res = await request(app).get('/api/reports?status=Pendiente')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.every(r => r.status === 'Pendiente')).toBe(true);
  });

  test('CA-12 | Filtro por dirección funciona (query ?address=Parque)', async () => {
    await createReport(citizen._id, { locationName: 'Parque Central' });
    await createReport(citizen._id, { locationName: 'Calle 5 Norte'  });

    const res = await request(app).get('/api/reports?address=Parque')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.every(r => r.locationName.includes('Parque'))).toBe(true);
  });

  test('CA-13 | Cada elemento tiene ID, dirección, estado y fecha', async () => {
    await createReport(citizen._id);
    const res = await request(app).get('/api/reports?status=Pendiente')
      .set('Authorization', `Bearer ${adminToken}`);
    const r = res.body[0];
    expect(r).toHaveProperty('reportId');
    expect(r).toHaveProperty('locationName');
    expect(r).toHaveProperty('status');
    expect(r).toHaveProperty('fecha');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-12: GET /user-search — Filtrar Ciudadanos
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-12 | GET /user-search — Filtrar Ciudadanos por nombre/ubicación', () => {

  beforeEach(async () => {
    await createUser({ name: 'Carlos García',  email: 'carlos@test.com',  address: { latitude: 20.97,  longitude: -89.62 } });
    await createUser({ name: 'María López',    email: 'maria@test.com',   address: { latitude: 20.98,  longitude: -89.63 } });
    await createUser({ name: 'Pedro Martínez', email: 'pedro@test.com',   address: { latitude: 18.48,  longitude: -69.93 } });
  });

  test('CA-14 | Sin filtros → devuelve HTML con todos los usuarios', async () => {
    const res = await request(app).get('/user-search')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Carlos García');
    expect(res.text).toContain('María López');
  });

  test('CA-15 | Filtro por nombre parcial (case-insensitive)', async () => {
    const res = await request(app).get('/user-search?name=carlos')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.text).toContain('Carlos García');
    expect(res.text).not.toContain('Pedro Martínez');
  });

  test('CA-16 | Filtro por radio filtra por domicilio del usuario (BUG-17)', async () => {
    // Radio en torno a 20.97, -89.62 → debe incluir Carlos y María, no Pedro
    const res = await request(app).get('/user-search?lat=20.975&lng=-89.625&radius=10000')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.text).toContain('Carlos García');
    expect(res.text).not.toContain('Pedro Martínez');
  });

  test('CA-17 | Nombre y radio combinados → intersección de filtros', async () => {
    const res = await request(app).get('/user-search?name=mar&lat=20.975&lng=-89.625&radius=10000')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.text).toContain('María López');
    expect(res.text).not.toContain('Carlos García');
  });
});
