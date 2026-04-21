/**
 * PRUEBAS: Reportar Basura · Historial · Cancelar Reporte
 *
 * Historias cubiertas:
 *   TRA-2  — Reportar Basura (ciudadano)
 *   TRA-5  — Historial de Mis Reportes
 *   TRA-6  — Cancelar Reporte
 *
 * Correr: npx jest tests/reports.test.js --forceExit
 */
const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupDb, teardownDb, clearCollections,
  makeToken, createUser, createReport, VALID_REPORT_BODY,
} = require('./helpers');

const app = require('../server');
const Report = require('../src/models/Report');
const Notification = require('../src/models/Notifications');

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearCollections);

let user, token, otherUser, otherToken;

beforeEach(async () => {
  user      = await createUser({ email: 'ciudadano@test.com' });
  token     = makeToken(user._id);
  otherUser = await createUser({ email: 'otro@test.com' });
  otherToken = makeToken(otherUser._id);
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-2: POST /api/reports — Reportar Basura
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-2 | POST /api/reports — Reportar Basura', () => {

  // ── Requiere sesión activa ────────────────────────────────────────────────

  test('CA-01 | Sin token → 401', async () => {
    const res = await request(app).post('/api/reports').send(VALID_REPORT_BODY);
    expect(res.status).toBe(401);
  });

  test('CA-02 | Token inválido → 401', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', 'Bearer token_falso')
      .send(VALID_REPORT_BODY);
    expect(res.status).toBe(401);
  });

  // ── Campos requeridos ────────────────────────────────────────────────────

  test('CA-03 | Sin nombre de ubicación → 400', async () => {
    const { locationName, ...body } = VALID_REPORT_BODY;
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/dirección/i);
  });

  test('CA-04 | Sin latitud → 400', async () => {
    const { latitude, ...body } = VALID_REPORT_BODY;
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/latitud/i);
  });

  test('CA-05 | Sin longitud → 400', async () => {
    const { longitude, ...body } = VALID_REPORT_BODY;
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/longitud/i);
  });

  // ── Mínimo 1 evidencia ───────────────────────────────────────────────────

  test('CA-06 | Sin evidencias → 400', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_REPORT_BODY, evidencias: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/evidencia/i);
  });

  test('CA-07 | Evidencia string vacío → 400', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_REPORT_BODY, evidencias: [''] });
    expect(res.status).toBe(400);
  });

  // ── Fecha automática ─────────────────────────────────────────────────────

  test('CA-08 | Sin fecha en body → backend asigna fecha automáticamente', async () => {
    const { fecha, ...body } = VALID_REPORT_BODY;
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(201);
    expect(res.body.report.fecha).toBeTruthy();
  });

  test('CA-09 | Campo fecha no puede ser editado: se usa la del body si viene', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_REPORT_BODY, fecha: '01/01/2026, 12:00' });
    expect(res.status).toBe(201);
    expect(res.body.report.fecha).toBe('01/01/2026, 12:00');
  });

  // ── Estado inicial Pendiente (BUG-06 corregido) ───────────────────────────

  test('CA-10 | Reporte creado con status inicial "Pendiente" (no Recibido)', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(VALID_REPORT_BODY);
    expect(res.status).toBe(201);
    expect(res.body.report.status).toBe('Pendiente');
  });

  // ── UUID generado ────────────────────────────────────────────────────────

  test('CA-11 | Reporte tiene reportId UUID v4 generado automáticamente', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(VALID_REPORT_BODY);
    expect(res.status).toBe(201);
    expect(res.body.report.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  // ── Notificaciones al crear ───────────────────────────────────────────────

  test('CA-12 | Al crear reporte se generan 2 notificaciones para el usuario', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(VALID_REPORT_BODY);
    const notifs = await Notification.find({ user: user._id });
    expect(notifs.length).toBe(2);
  });

  test('CA-13 | Notificación 1: confirmación de envío del reporte', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(VALID_REPORT_BODY);
    const notifs = await Notification.find({ user: user._id });
    expect(notifs.some(n => n.message.includes('enviado'))).toBe(true);
  });

  test('CA-14 | Notificación 2: confirmación de guardado en servidor', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(VALID_REPORT_BODY);
    const notifs = await Notification.find({ user: user._id });
    expect(notifs.some(n => n.message.includes('guardado'))).toBe(true);
  });

  // ── Asociado al usuario ───────────────────────────────────────────────────

  test('CA-15 | Reporte guardado asociado al usuario del token', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`).send(VALID_REPORT_BODY);
    const saved = await Report.findOne({ locationName: 'Parque Central' });
    expect(saved.user.toString()).toBe(user._id.toString());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-5: GET /api/reports/mine — Historial de Mis Reportes
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-5 | GET /api/reports/mine — Historial de Mis Reportes', () => {

  test('CA-16 | Sin token → 401', async () => {
    const res = await request(app).get('/api/reports/mine');
    expect(res.status).toBe(401);
  });

  test('CA-17 | Usuario sin reportes → lista vacía', async () => {
    const res = await request(app).get('/api/reports/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('CA-18 | Solo devuelve reportes del usuario autenticado', async () => {
    await createReport(user._id, { locationName: 'Mi Lugar' });
    await createReport(otherUser._id, { locationName: 'Otro Lugar' });

    const res = await request(app).get('/api/reports/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].locationName).toBe('Mi Lugar');
  });

  test('CA-19 | Elementos tienen ID, dirección, estado y fecha', async () => {
    await createReport(user._id);
    const res = await request(app).get('/api/reports/mine')
      .set('Authorization', `Bearer ${token}`);
    const r = res.body[0];
    expect(r).toHaveProperty('reportId');
    expect(r).toHaveProperty('locationName');
    expect(r).toHaveProperty('status');
    expect(r).toHaveProperty('fecha');
  });

  test('CA-20 | Reportes ordenados descendente por fecha de creación', async () => {
    const r1 = await createReport(user._id, { locationName: 'Primero' });
    await new Promise(r => setTimeout(r, 10));
    const r2 = await createReport(user._id, { locationName: 'Segundo' });

    const res = await request(app).get('/api/reports/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body[0]._id).toBe(r2._id.toString());
    expect(res.body[1]._id).toBe(r1._id.toString());
  });

  test('CA-21 | Se muestran reportes Cancelados del usuario (historial completo)', async () => {
    await createReport(user._id, { status: 'Cancelado' });
    await createReport(user._id, { status: 'Pendiente' });

    const res = await request(app).get('/api/reports/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-6: PATCH /api/reports/:id/cancel — Cancelar Reporte
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-6 | PATCH /api/reports/:id/cancel — Cancelar Reporte', () => {

  test('CA-22 | Sin token → 401', async () => {
    const report = await createReport(user._id);
    const res = await request(app).patch(`/api/reports/${report._id}/cancel`);
    expect(res.status).toBe(401);
  });

  // ── Solo se puede cancelar si está Pendiente (BUG-04 corregido) ──────────

  test('CA-23 | Cancelar reporte en estado Pendiente → 200, status Cancelado', async () => {
    const report = await createReport(user._id, { status: 'Pendiente' });
    const res = await request(app).patch(`/api/reports/${report._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('Cancelado');
  });

  test('CA-24 | Cancelar reporte Recibido → 400 (no permitido)', async () => {
    const report = await createReport(user._id, { status: 'Recibido' });
    const res = await request(app).patch(`/api/reports/${report._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('CA-25 | Cancelar reporte ya Cancelado → 400', async () => {
    const report = await createReport(user._id, { status: 'Cancelado' });
    const res = await request(app).patch(`/api/reports/${report._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ya está cancelado/i);
  });

  test('CA-26 | Cancelar reporte Completado → 400', async () => {
    const report = await createReport(user._id, { status: 'Completado' });
    const res = await request(app).patch(`/api/reports/${report._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/completado/i);
  });

  test('CA-27 | Cancelar reporte de otro usuario → 404', async () => {
    const report = await createReport(otherUser._id);
    const res = await request(app).patch(`/api/reports/${report._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('CA-28 | ID inexistente → 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).patch(`/api/reports/${fakeId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRA-Detalle: GET /api/reports/:reportId — Detalle de Reporte
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-DETALLE | GET /api/reports/:reportId — Detalle de Reporte', () => {

  test('CA-29 | Sin token → 401', async () => {
    const report = await createReport(user._id);
    const res = await request(app).get(`/api/reports/${report.reportId}`);
    expect(res.status).toBe(401);
  });

  test('CA-30 | Devuelve ID, ubicación, usuarioId, fecha, evidencias, dirección', async () => {
    const report = await createReport(user._id);
    const res = await request(app).get(`/api/reports/${report.reportId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.reporte).toMatchObject({
      reportId:     report.reportId,
      usuarioId:    expect.anything(),
      locationName: 'Parque Central',
      fecha:        expect.any(String),
      status:       expect.any(String),
    });
    expect(res.body.reporte.ubicacion).toHaveProperty('latitud');
    expect(res.body.reporte.ubicacion).toHaveProperty('longitud');
    expect(res.body.reporte.evidencias).toBeInstanceOf(Array);
  });

  test('CA-31 | reportId inexistente → 404', async () => {
    const res = await request(app).get('/api/reports/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('CA-32 | Cualquier usuario autenticado puede ver el detalle', async () => {
    const report = await createReport(user._id);
    const res = await request(app).get(`/api/reports/${report.reportId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(200);
  });
});
