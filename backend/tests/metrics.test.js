/**
 * PRUEBAS: Métricas e Indicadores para Administrador
 *
 * Historia cubierta:
 *   TRA-Metricas — Como Administrador, Quiero ver indicadores visuales y métricas
 *
 * Correr: npx jest tests/metrics.test.js --forceExit
 */
const request = require('supertest');
const {
  setupDb, teardownDb, clearCollections,
  makeToken, createUser, createReport,
} = require('./helpers');

const app = require('../server');

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearCollections);

let admin, adminToken, citizen, citizenToken;

beforeEach(async () => {
  admin        = await createUser({ email: 'admin@test.com',   isAdmin: true });
  adminToken   = makeToken(admin._id);
  citizen      = await createUser({ email: 'citizen@test.com', isAdmin: false });
  citizenToken = makeToken(citizen._id);
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reports/metricas/resumen
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-METRICAS | GET /api/reports/metricas/resumen', () => {

  test('CA-01 | Sin token → 401', async () => {
    const res = await request(app).get('/api/reports/metricas/resumen');
    expect(res.status).toBe(401);
  });

  test('CA-02 | Ciudadano (no admin) → 403', async () => {
    const res = await request(app).get('/api/reports/metricas/resumen')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/administrador/i);
  });

  test('CA-03 | Admin → 200 con resumen numérico del mes', async () => {
    await createReport(citizen._id, { status: 'Pendiente' });
    await createReport(citizen._id, { status: 'Pendiente' });
    await createReport(citizen._id, { status: 'Recibido'  });

    const res = await request(app).get('/api/reports/metricas/resumen')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resumen.total).toBe(3);
    expect(res.body.resumen.Pendiente).toBe(2);
    expect(res.body.resumen.Recibido).toBe(1);
  });

  test('CA-04 | Respuesta incluye el mes en texto', async () => {
    const res = await request(app).get('/api/reports/metricas/resumen')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body).toHaveProperty('mes');
    expect(typeof res.body.mes).toBe('string');
  });

  test('CA-05 | Sin reportes → todos los contadores en 0', async () => {
    const res = await request(app).get('/api/reports/metricas/resumen')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.resumen.total).toBe(0);
    expect(res.body.resumen.Pendiente).toBe(0);
    expect(res.body.resumen.Recibido).toBe(0);
    expect(res.body.resumen.Completado).toBe(0);
    expect(res.body.resumen.Cancelado).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reports/metricas/distribucion
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-METRICAS | GET /api/reports/metricas/distribucion', () => {

  test('CA-06 | Sin token → 401', async () => {
    const res = await request(app).get('/api/reports/metricas/distribucion');
    expect(res.status).toBe(401);
  });

  test('CA-07 | Ciudadano → 403', async () => {
    const res = await request(app).get('/api/reports/metricas/distribucion')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  test('CA-08 | Distribución incluye estado, cantidad y porcentaje', async () => {
    await createReport(citizen._id, { status: 'Pendiente' });
    await createReport(citizen._id, { status: 'Recibido'  });

    const res = await request(app).get('/api/reports/metricas/distribucion')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.distribucion.forEach(d => {
      expect(d).toHaveProperty('estado');
      expect(d).toHaveProperty('cantidad');
      expect(d).toHaveProperty('porcentaje');
    });
  });

  test('CA-09 | Porcentajes suman 100 (± 0.5 por redondeo)', async () => {
    await createReport(citizen._id, { status: 'Pendiente' });
    await createReport(citizen._id, { status: 'Pendiente' });
    await createReport(citizen._id, { status: 'Recibido'  });

    const res = await request(app).get('/api/reports/metricas/distribucion')
      .set('Authorization', `Bearer ${adminToken}`);
    const total = res.body.distribucion.reduce((sum, d) => sum + d.porcentaje, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  test('CA-10 | Distribución vacía si no hay reportes este mes', async () => {
    const res = await request(app).get('/api/reports/metricas/distribucion')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.distribucion).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reports/metricas/top-direcciones
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-METRICAS | GET /api/reports/metricas/top-direcciones', () => {

  test('CA-11 | Sin token → 401', async () => {
    const res = await request(app).get('/api/reports/metricas/top-direcciones');
    expect(res.status).toBe(401);
  });

  test('CA-12 | Ciudadano → 403', async () => {
    const res = await request(app).get('/api/reports/metricas/top-direcciones')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  test('CA-13 | Devuelve top de direcciones con más reportes', async () => {
    await createReport(citizen._id, { locationName: 'Parque Central' });
    await createReport(citizen._id, { locationName: 'Parque Central' });
    await createReport(citizen._id, { locationName: 'Parque Central' });
    await createReport(citizen._id, { locationName: 'Calle 5 Norte'  });

    const res = await request(app).get('/api/reports/metricas/top-direcciones')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.top_direcciones[0].direccion).toBe('Parque Central');
    expect(res.body.top_direcciones[0].total_reportes).toBe(3);
  });

  test('CA-14 | Orden descendente por cantidad de reportes', async () => {
    await createReport(citizen._id, { locationName: 'A' });
    await createReport(citizen._id, { locationName: 'B' });
    await createReport(citizen._id, { locationName: 'B' });

    const res = await request(app).get('/api/reports/metricas/top-direcciones')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.top_direcciones[0].total_reportes)
      .toBeGreaterThanOrEqual(res.body.top_direcciones[1]?.total_reportes ?? 0);
  });

  test('CA-15 | Parámetro ?limite limita la cantidad de resultados', async () => {
    for (let i = 0; i < 8; i++) {
      await createReport(citizen._id, { locationName: `Lugar ${i}` });
    }
    const res = await request(app).get('/api/reports/metricas/top-direcciones?limite=3')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.top_direcciones.length).toBeLessThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reports/UbicacionesDelMes — Puntos en el mapa del mes
// ═══════════════════════════════════════════════════════════════════════════

describe('TRA-METRICAS | GET /api/reports/UbicacionesDelMes', () => {

  test('CA-16 | Sin token → 401', async () => {
    const res = await request(app).get('/api/reports/UbicacionesDelMes');
    expect(res.status).toBe(401);
  });

  test('CA-17 | Devuelve punteros del mes con lat, lng y reportId', async () => {
    await createReport(citizen._id, { latitude: 20.9674, longitude: -89.6237 });

    const res = await request(app).get('/api/reports/UbicacionesDelMes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.punteros[0]).toHaveProperty('reportId');
    expect(res.body.punteros[0]).toHaveProperty('latitud');
    expect(res.body.punteros[0]).toHaveProperty('longitud');
  });

  test('CA-18 | Incluye posición inicial del mapa', async () => {
    const res = await request(app).get('/api/reports/UbicacionesDelMes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body).toHaveProperty('posicion_inicial');
    expect(res.body.posicion_inicial).toHaveProperty('latitud');
    expect(res.body.posicion_inicial).toHaveProperty('longitud');
  });

  test('CA-19 | Ciudadano con domicilio → posición inicial es su domicilio', async () => {
    const citizen2 = await createUser({
      email: 'geocitizen@test.com',
      address: { latitude: 18.4861, longitude: -69.9312 },
    });
    const t = makeToken(citizen2._id);

    const res = await request(app).get('/api/reports/UbicacionesDelMes')
      .set('Authorization', `Bearer ${t}`);
    expect(res.body.posicion_inicial.latitud).toBeCloseTo(18.4861);
    expect(res.body.posicion_inicial.fuente).toBe('usuario');
  });
});
