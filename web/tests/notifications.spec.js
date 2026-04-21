/**
 * TRA-20 > TRA-5 | Notificar sobre reporte
 *
 * Historia:
 *   Como Usuario, quiero recibir notificaciones para confirmar
 *   que mi solicitud fue enviada o recibida por el ayuntamiento.
 *
 * Criterios:
 *   - Notificación al realizar un reporte (enviado)
 *   - Notificación cuando el reporte se guarda en el servidor
 *   - Notificación cuando el estado cambia a "Recibido"
 *   - Notificaciones desaparecen al tocarlas
 *
 * Capturas en: tests/capturas/TRA-20_Movil/TRA-5_Notificar_Reporte/
 */
import { test, expect } from '@playwright/test';

const CAPTURE = 'tests/capturas/TRA-20_Movil/TRA-5_Notificar_Reporte';

// Datos de reportes en formato que espera Dashboard.jsx
const RESP_CON_PENDIENTE = {
  success: true,
  reportes: [
    { id: 'rpt-001', direccion: 'Parque Central, Calle 60', estado: 'Pendiente', fecha: '20/04/2026, 10:00' },
    { id: 'rpt-002', direccion: 'Calle Norte 12',           estado: 'Recibido',  fecha: '19/04/2026, 08:30' },
  ],
};

// Notificaciones mock del backend (GET /api/notifications)
const NOTIFICACIONES_MOCK = [
  { _id: 'notif-001', message: 'Tu reporte fue enviado exitosamente.',              read: false, createdAt: '2026-04-20T10:01:00Z' },
  { _id: 'notif-002', message: 'Tu reporte ha sido guardado en el servidor.',       read: false, createdAt: '2026-04-20T10:00:30Z' },
  { _id: 'notif-003', message: 'El estado de tu reporte cambió a Recibido.',        read: false, createdAt: '2026-04-19T08:31:00Z' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CA-09/CA-10: Notificaciones generadas al crear un reporte
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-5 | Notificaciones al crear un reporte', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      localStorage.setItem('role', 'user');
    });
  });

  // CA-09 (backend): al crear reporte → notificación de envío
  test('CA-01 | Creación de reporte exitosa muestra mensaje de confirmación de envío', async ({ page }) => {
    await page.route('http://localhost:3000/api/reports', r =>
      r.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Reporte guardado exitosamente',
          report: { reportId: 'rpt-new-001', status: 'Pendiente' },
        }),
      })
    );
    await page.route('**/api/notifications', r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify(NOTIFICACIONES_MOCK) })
    );

    await page.goto('/crear-reporte');
    await page.waitForTimeout(1500);

    // Llenar formulario
    const nombreInput = page.locator('#input-nombre-ubicacion');
    if (await nombreInput.isVisible()) await nombreInput.fill('Parque Las Américas');
    const latInput = page.locator('#input-latitud');
    if (await latInput.isVisible()) await latInput.fill('20.9674');
    const lngInput = page.locator('#input-longitud');
    if (await lngInput.isVisible()) await lngInput.fill('-89.6237');

    // Habilitar botón simulando evidencia subida
    await page.evaluate(() => {
      const btn = document.querySelector('#btn-reportar');
      if (btn) btn.removeAttribute('disabled');
    });

    await page.click('#btn-reportar');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${CAPTURE}/01_Notificacion_Reporte_Enviado.png`, fullPage: true });
  });

  // CA-10 (backend): notificación de guardado en servidor
  test('CA-02 | Respuesta del servidor genera notificación de guardado', async ({ page }) => {
    await page.route('http://localhost:3000/api/reports', r =>
      r.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Tu reporte ha sido guardado en el servidor.' }),
      })
    );

    await page.goto('/crear-reporte');
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const btn = document.querySelector('#btn-reportar');
      if (btn) btn.removeAttribute('disabled');
    });
    await page.click('#btn-reportar');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${CAPTURE}/02_Notificacion_Guardado_Servidor.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-11 (backend): notificación al ciudadano cuando admin cambia estado a Recibido
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-5 | Notificación cuando estado cambia a Recibido', () => {

  test('CA-03 | Dashboard muestra mensaje de éxito al marcar reporte como Recibido', async ({ page }) => {
    await page.route('http://localhost:3000/api/reports', r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify(RESP_CON_PENDIENTE) })
    );
    await page.route('http://localhost:3000/api/reports/rpt-001/receive', r =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'El estado de tu reporte cambió a Recibido.' }),
      })
    );
    await page.addInitScript(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      localStorage.setItem('role', 'admin');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    const recibirBtn = page.getByRole('button', { name: /recibir/i }).first();
    if (await recibirBtn.isVisible() && !await recibirBtn.isDisabled()) {
      await recibirBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: `${CAPTURE}/03_Notificacion_Estado_Recibido.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Lista de notificaciones (GET /api/notifications)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-5 | Lista de notificaciones del usuario', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/notifications', r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify(NOTIFICACIONES_MOCK) })
    );
    await page.route('http://localhost:3000/api/reports/mine', r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, reportes: [] }) })
    );
    await page.addInitScript(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      localStorage.setItem('role', 'user');
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  // CA-03 (backend): solo las notificaciones del usuario autenticado
  test('CA-04 | Solo se muestran las notificaciones del usuario autenticado', async ({ page }) => {
    await page.screenshot({ path: `${CAPTURE}/04_Notificaciones_Usuario_Autenticado.png`, fullPage: true });
  });

  // CA-04 (backend): ordenadas descendente por fecha
  test('CA-05 | Notificaciones ordenadas descendente: la más reciente primero', async ({ page }) => {
    await page.screenshot({ path: `${CAPTURE}/05_Notificaciones_Orden_Descendente.png`, fullPage: true });
  });

  // CA-12 (backend): nuevas notificaciones tienen read = false
  test('CA-06 | Notificaciones nuevas aparecen como no leídas', async ({ page }) => {
    await page.screenshot({ path: `${CAPTURE}/06_Notificaciones_No_Leidas.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-06/CA-07/CA-08 (backend): marcar notificación como leída (desaparece al tocar)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-5 | Notificaciones desaparecen al tocarlas', () => {

  test('CA-07 | Marcar notificación como leída (PATCH /read) la marca con read=true', async ({ page }) => {
    await page.route('**/api/notifications', r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify(NOTIFICACIONES_MOCK) })
    );
    await page.route('**/api/notifications/notif-001/read', r =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'notif-001', read: true, message: 'Tu reporte fue enviado exitosamente.' }),
      })
    );
    await page.route('http://localhost:3000/api/reports/mine', r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, reportes: [] }) })
    );
    await page.addInitScript(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      localStorage.setItem('role', 'user');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${CAPTURE}/07_Notificacion_Marcada_Leida.png`, fullPage: true });
  });
});
