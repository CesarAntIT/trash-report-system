/**
 * PRUEBAS: Notificaciones
 *
 * Historia cubierta:
 *   TRA-Notificaciones — Como Usuario, quiero recibir notificaciones
 *
 * Correr: npx jest tests/notifications.test.js --forceExit
 */
const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupDb, teardownDb, clearCollections,
  makeToken, createUser, createReport, VALID_REPORT_BODY,
} = require('./helpers');

const app = require('../server');
const Notification = require('../src/models/Notifications');

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearCollections);

let user, token, admin, adminToken;

beforeEach(async () => {
  user       = await createUser({ email: 'user@test.com' });
  token      = makeToken(user._id);
  admin      = await createUser({ email: 'admin@test.com', isAdmin: true });
  adminToken = makeToken(admin._id);
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/notifications — Obtener notificaciones
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-NOTIF | GET /api/notifications — Obtener notificaciones', () => {

  test('CA-01 | Sin token → 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  test('CA-02 | Sin notificaciones → lista vacía', async () => {
    const res = await request(app).get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('CA-03 | Solo devuelve notificaciones del usuario autenticado', async () => {
    await Notification.create({ user: user._id,  message: 'Para ti'       });
    await Notification.create({ user: admin._id, message: 'Para el admin' });

    const res = await request(app).get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].message).toBe('Para ti');
  });

  test('CA-04 | Notificaciones ordenadas descendentemente por fecha', async () => {
    await Notification.create({ user: user._id, message: 'Primero' });
    await new Promise(r => setTimeout(r, 10));
    await Notification.create({ user: user._id, message: 'Segundo' });

    const res = await request(app).get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body[0].message).toBe('Segundo');
    expect(res.body[1].message).toBe('Primero');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications/:id/read — Marcar como leída (desaparece al tocar)
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-NOTIF | PATCH /api/notifications/:id/read — Marcar como leída', () => {

  test('CA-05 | Sin token → 401', async () => {
    const notif = await Notification.create({ user: user._id, message: 'Test' });
    const res = await request(app).patch(`/api/notifications/${notif._id}/read`);
    expect(res.status).toBe(401);
  });

  test('CA-06 | Marcar notificación propia como leída → read = true', async () => {
    const notif = await Notification.create({ user: user._id, message: 'Test', read: false });
    const res = await request(app).patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  test('CA-07 | Marcar notificación de otro usuario → 404 (no la encuentra)', async () => {
    const notif = await Notification.create({ user: admin._id, message: 'Admin notif' });
    const res = await request(app).patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('CA-08 | Notificación marcada queda con read = true en BD', async () => {
    const notif = await Notification.create({ user: user._id, message: 'Test', read: false });
    await request(app).patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);
    const updated = await Notification.findById(notif._id);
    expect(updated.read).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integración: notificaciones generadas por eventos
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-NOTIF | Notificaciones generadas automáticamente por eventos', () => {

  test('CA-09 | Crear reporte → notificación de envío generada', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_REPORT_BODY);
    const notifs = await Notification.find({ user: user._id });
    expect(notifs.some(n => n.message.includes('enviado'))).toBe(true);
  });

  test('CA-10 | Crear reporte → notificación de guardado en servidor generada', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_REPORT_BODY);
    const notifs = await Notification.find({ user: user._id });
    expect(notifs.some(n => n.message.includes('guardado'))).toBe(true);
  });

  test('CA-11 | Admin recibe reporte → notificación de "Recibido" al ciudadano', async () => {
    const citizen = await createUser({ email: 'citizen2@test.com' });
    const report  = await createReport(citizen._id, { status: 'Pendiente' });

    await request(app).patch(`/api/reports/${report._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`);

    const notifs = await Notification.find({ user: citizen._id });
    expect(notifs.some(n => n.message.includes('recibido'))).toBe(true);
  });

  test('CA-12 | Notificaciones nuevas tienen read = false por defecto', async () => {
    await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_REPORT_BODY);
    const notifs = await Notification.find({ user: user._id });
    expect(notifs.every(n => n.read === false)).toBe(true);
  });
});
