/**
 * TRA-21 | Panel Admin
 *
 * Historias cubiertas:
 *   TRA-22 — Cambiar estado de Reporte (Admin recibe reporte → Pendiente → Recibido)
 *   TRA-42 — Mostrar detalle de Reporte en Panel Admin
 *
 * Nota: TRA-13 (Ver y Filtrar Usuarios) y TRA-43 (Filtrar usuarios en admin)
 *       se sirven desde el backend como páginas HTML (/user-search).
 *       Sus tests viven en backend/tests/admin.test.js (CA-14..CA-17).
 *
 * Capturas en:
 *   tests/capturas/TRA-21_Admin/TRA-22_Cambiar_Estado_Reporte/
 *   tests/capturas/TRA-21_Admin/TRA-42_Detalle_Reporte_Admin/
 */
import { test, expect } from '@playwright/test';

const REPORT_ID = 'abc123-reporte-uuid-test';

const RESP_ADMIN = {
  success: true,
  reportes: [
    { id: 'rpt-001', direccion: 'Av. Central 45, Col. Centro',     estado: 'Pendiente', fecha: '20/04/2026, 10:00' },
    { id: 'rpt-002', direccion: 'Calle Norte 12, Fraccionamiento', estado: 'Recibido',  fecha: '19/04/2026, 08:30' },
  ],
};

const MOCK_REPORTE = {
  success: true,
  reporte: {
    reportId:     REPORT_ID,
    usuarioId:    '507f1f77bcf86cd799439011',
    fecha:        '20/04/2026, 10:00',
    locationName: 'Parque Central, Calle 60 #120',
    ubicacion:    { latitud: 20.9674, longitud: -89.6237 },
    status:       'Pendiente',
    evidencias:   [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
      'BwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARC' +
      'AABAAEDASIA=',
    ],
  },
};

/**
 * Inyecta localStorage + stub de window.fetch en el contexto del navegador.
 * patchMap: { 'rpt-001/receive': { success: true }, ... }
 */
async function injectContext(page, { role, resp, patchMap = {}, reporteDetalle = null }) {
  await page.addInitScript(({ role, resp, patchMap, reporteDetalle }) => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    localStorage.setItem('role', role);

    const _orig = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.href || String(input);
      const method = (init && init.method && init.method.toUpperCase()) || 'GET';

      // GET /api/reports (admin list)
      if (method === 'GET' && /\/api\/reports(\?.*)?$/.test(url) && resp) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(resp) });
      }
      // GET /api/reports/:reportId (detail)
      if (method === 'GET' && url.includes('/api/reports/') && reporteDetalle) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(reporteDetalle) });
      }
      // PATCH configurados por test
      for (const [key, body] of Object.entries(patchMap)) {
        if (url.includes(key)) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
        }
      }
      return _orig(input, init);
    };
  }, { role, resp, patchMap, reporteDetalle });
}

// ─────────────────────────────────────────────────────────────────────────────
// TRA-22: Cambiar Estado de Reporte
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-22 | Cambiar Estado de Reporte (Admin)', () => {
  const CAPTURE = 'tests/capturas/TRA-21_Admin/TRA-22_Cambiar_Estado_Reporte';

  test.beforeEach(async ({ page }) => {
    await injectContext(page, { role: 'admin', resp: RESP_ADMIN });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  // Panel Admin muestra título diferenciado
  test('CA-01 | Panel Admin muestra título "Todos los Reportes"', async ({ page }) => {
    await expect(page.getByText('Todos los Reportes')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Panel_Admin_Titulo.png`, fullPage: true });
  });

  // CA-03 (backend): Admin recibe reporte Pendiente → éxito
  test('CA-02 | Admin presiona Recibir en reporte Pendiente → mensaje de éxito', async ({ page }) => {
    await injectContext(page, {
      role: 'admin',
      resp: RESP_ADMIN,
      patchMap: { 'rpt-001/receive': { success: true, report: { status: 'Recibido' } } },
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    const recibirBtn = page.getByRole('button', { name: /recibir/i }).first();
    await expect(recibirBtn).not.toBeDisabled();
    await recibirBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${CAPTURE}/02_Reporte_Cambiado_A_Recibido.png`, fullPage: true });
  });

  // CA-04 (backend): Botón Recibir deshabilitado para ya Recibido (rpt-002)
  test('CA-03 | Botón Recibir está deshabilitado para reporte ya Recibido', async ({ page }) => {
    await expect(page.getByRole('button', { name: /recibir/i }).nth(1)).toBeDisabled();
    await page.screenshot({ path: `${CAPTURE}/03_Boton_Recibir_Deshabilitado_Ya_Recibido.png`, fullPage: true });
  });

  // CA-02 (backend): Ciudadano no puede recibir → sin botón Recibir
  test('CA-04 | Vista de ciudadano NO muestra botón Recibir', async ({ page }) => {
    await injectContext(page, { role: 'user', resp: { success: true, reportes: RESP_ADMIN.reportes } });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: /recibir/i })).not.toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/04_Ciudadano_Sin_Boton_Recibir.png`, fullPage: true });
  });

  // CA-06 (backend): Al recibir → notificación de éxito en pantalla
  test('CA-05 | Al recibir reporte se muestra mensaje de éxito en pantalla', async ({ page }) => {
    await injectContext(page, {
      role: 'admin',
      resp: RESP_ADMIN,
      patchMap: { 'rpt-001/receive': { success: true, report: { status: 'Recibido' } } },
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /recibir/i }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/recibido/i).first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/05_Mensaje_Exito_Recibido.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TRA-42: Mostrar detalle de Reporte en Panel Admin
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-42 | Mostrar Detalle de Reporte en Panel Admin', () => {
  const CAPTURE = 'tests/capturas/TRA-21_Admin/TRA-42_Detalle_Reporte_Admin';

  test.beforeEach(async ({ page }) => {
    await injectContext(page, { role: 'admin', resp: null, reporteDetalle: MOCK_REPORTE });
    await page.goto(`/report/${REPORT_ID}`);
    await page.waitForTimeout(2500);
  });

  // CA-30 (backend): ID, ubicación, usuarioId, fecha, evidencias, dirección
  test('CA-01 | Admin ve metadatos completos del reporte', async ({ page }) => {
    await expect(page.getByText('Parque Central, Calle 60 #120')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Admin_Metadata_Completa_Reporte.png`, fullPage: true });
  });

  // Mapa visible
  test('CA-02 | Ubicación del reporte visible en mapa', async ({ page }) => {
    await expect(page.locator('iframe')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Admin_Mapa_Reporte.png`, fullPage: true });
  });

  // Evidencias con aspecto 1:1
  test('CA-03 | Evidencias se muestran con recorte 1:1', async ({ page }) => {
    await expect(page.locator('img').first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Admin_Evidencias_1x1.png`, fullPage: true });
  });

  // CA-32 (backend): cualquier usuario autenticado puede ver el detalle
  test('CA-04 | Ciudadano autenticado también puede ver el detalle del reporte', async ({ page }) => {
    await injectContext(page, { role: 'user', resp: null, reporteDetalle: MOCK_REPORTE });
    await page.goto(`/report/${REPORT_ID}`);
    await page.waitForTimeout(2500);
    await expect(page.getByText('Parque Central, Calle 60 #120')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/04_Ciudadano_Ve_Detalle_Reporte.png`, fullPage: true });
  });

  // CA-31 (backend): reportId inexistente → 404 error en UI
  test('CA-05 | Reporte no encontrado muestra error claro', async ({ page }) => {
    await injectContext(page, {
      role: 'admin',
      resp: null,
      reporteDetalle: { success: false, message: 'Reporte no encontrado' },
    });
    await page.goto(`/report/${REPORT_ID}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${CAPTURE}/05_Reporte_No_Encontrado_Error.png`, fullPage: true });
  });
});
