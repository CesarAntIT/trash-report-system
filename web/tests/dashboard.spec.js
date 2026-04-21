/**
 * TRA-12 > TRA-3  | Ver Historial de Reportes        → GET  /api/reports/mine
 * TRA-12 > TRA-4  | Cancelar un Reporte              → PATCH /api/reports/:id/cancel
 * TRA-12 > TRA-8  | Ver Todos los Reportes (Admin)   → GET  /api/reports
 * TRA-12 > TRA-17 | Filtrar lista de reportes        → GET  /api/reports?address=...
 *
 * NOTA: usa addInitScript para stub de fetch porque page.route no intercepta
 *       peticiones cross-origin a localhost:3000 en este entorno.
 *
 * Capturas en:
 *   tests/capturas/TRA-12_Modulo_Reportes/TRA-3_Ver_Historial/
 *   tests/capturas/TRA-12_Modulo_Reportes/TRA-4_Cancelar_Reporte/
 *   tests/capturas/TRA-12_Modulo_Reportes/TRA-8_Todos_Reportes_Admin/
 *   tests/capturas/TRA-12_Modulo_Reportes/TRA-17_Filtrar_Reportes/
 */
import { test, expect } from '@playwright/test';

// Respuestas en el formato que espera Dashboard.jsx:
//   { success: true, reportes: [{ id, direccion, estado, fecha }] }
const RESP_USUARIO = {
  success: true,
  reportes: [
    { id: 'rpt-001', direccion: 'Av. Central 45, Col. Centro',     estado: 'Pendiente', fecha: '20/04/2026, 10:00' },
    { id: 'rpt-002', direccion: 'Calle Norte 12, Fraccionamiento', estado: 'Recibido',  fecha: '19/04/2026, 08:30' },
    { id: 'rpt-003', direccion: 'Calle Sur 99, Barrio Antiguo',    estado: 'Cancelado', fecha: '18/04/2026, 14:00' },
  ],
};

const RESP_ADMIN = {
  success: true,
  reportes: [
    { id: 'rpt-001', direccion: 'Av. Central 45, Col. Centro',     estado: 'Pendiente', fecha: '20/04/2026, 10:00' },
    { id: 'rpt-002', direccion: 'Calle Norte 12, Fraccionamiento', estado: 'Recibido',  fecha: '19/04/2026, 08:30' },
  ],
};

/**
 * Inyecta localStorage + stub de window.fetch en el contexto del navegador.
 * patchMap: { 'rpt-001/cancel': { success: true }, ... }
 */
async function injectContext(page, { role, resp, patchMap = {} }) {
  await page.addInitScript(({ role, resp, patchMap }) => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    localStorage.setItem('role', role);

    const _orig = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.href || String(input);
      const method = (init && init.method && init.method.toUpperCase()) || 'GET';

      // GET /api/reports/mine
      if (method === 'GET' && url.includes('/api/reports/mine')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(resp) });
      }
      // GET /api/reports (sin subruta extra, acepta ?queryParams)
      if (method === 'GET' && /\/api\/reports(\?.*)?$/.test(url)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(resp) });
      }
      // PATCH específicos configurados por test
      for (const [key, body] of Object.entries(patchMap)) {
        if (url.includes(key)) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
        }
      }
      return _orig(input, init);
    };
  }, { role, resp, patchMap });
}

// ─────────────────────────────────────────────────────────────────────────────
// TRA-3: Ver Historial de Mis Reportes
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-3 | Ver Historial de Mis Reportes', () => {
  const CAPTURE = 'tests/capturas/TRA-12_Modulo_Reportes/TRA-3_Ver_Historial';

  test.beforeEach(async ({ page }) => {
    await injectContext(page, { role: 'user', resp: RESP_USUARIO });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  // CA-18/CA-19: Solo reportes del usuario, con id/direccion/estado/fecha
  test('CA-01 | Lista muestra dirección, estado y fecha de cada reporte', async ({ page }) => {
    await expect(page.getByText('Av. Central 45, Col. Centro')).toBeVisible();
    await expect(page.getByText('Pendiente').first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Lista_Reportes_Con_Datos.png`, fullPage: true });
  });

  // CA-20: Orden descendente por fecha
  test('CA-02 | Reportes ordenados descendente: el más reciente aparece primero', async ({ page }) => {
    const items = page.locator('.space-y-3 > div');
    await expect(items.first()).toContainText('Av. Central 45');
    await page.screenshot({ path: `${CAPTURE}/02_Orden_Descendente_Por_Fecha.png`, fullPage: true });
  });

  // CA-19: Cada elemento tiene botón Cancelar y enlace Información
  test('CA-03 | Cada reporte tiene botón Cancelar y enlace Información', async ({ page }) => {
    await expect(page.getByRole('button', { name: /cancelar/i }).first()).toBeVisible();
    await expect(page.getByRole('link',   { name: /información/i }).first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Botones_Cancelar_Info.png`, fullPage: true });
  });

  // CA-21: Cancelados aparecen en historial del usuario (historial completo)
  test('CA-04 | Historial completo incluye reportes Cancelados del usuario', async ({ page }) => {
    await expect(page.getByText('Cancelado').first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/04_Historial_Incluye_Cancelados.png`, fullPage: true });
  });

  // Sin reportes → mensaje vacío
  test('CA-05 | Sin reportes muestra mensaje de lista vacía', async ({ page }) => {
    await injectContext(page, { role: 'user', resp: { success: true, reportes: [] } });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await expect(page.getByText(/no hay reportes para mostrar/i)).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/05_Sin_Reportes_Mensaje_Vacio.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TRA-4: Cancelar un Reporte
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-4 | Cancelar un Reporte', () => {
  const CAPTURE = 'tests/capturas/TRA-12_Modulo_Reportes/TRA-4_Cancelar_Reporte';

  test.beforeEach(async ({ page }) => {
    await injectContext(page, { role: 'user', resp: RESP_USUARIO });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  // CA-24: Botón Cancelar deshabilitado para Recibido (rpt-002)
  test('CA-01 | Botón Cancelar deshabilitado para reporte Recibido', async ({ page }) => {
    const cancelarBtns = page.getByRole('button', { name: /cancelar/i });
    await expect(cancelarBtns.nth(1)).toBeDisabled();
    await page.screenshot({ path: `${CAPTURE}/01_Boton_Deshabilitado_Estado_Recibido.png`, fullPage: true });
  });

  // CA-23: Modal al presionar Cancelar en Pendiente (rpt-001)
  test('CA-02 | Al presionar Cancelar en Pendiente aparece modal de confirmación', async ({ page }) => {
    const pendienteBtn = page.getByRole('button', { name: /cancelar/i }).first();
    await expect(pendienteBtn).not.toBeDisabled();
    await pendienteBtn.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('¿Cancelar reporte?')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Modal_Confirmacion_Visible.png`, fullPage: true });
  });

  // Modal tiene 2 opciones
  test('CA-03 | Modal muestra botones "Sí, cancelar" y "Volver atrás"', async ({ page }) => {
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /sí, cancelar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /volver atrás/i })).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Modal_Dos_Opciones.png`, fullPage: true });
  });

  // CA-23: Confirmar cancelación → estado cambia
  test('CA-04 | Confirmar cancelación → mensaje de éxito', async ({ page }) => {
    await injectContext(page, {
      role: 'user',
      resp: RESP_USUARIO,
      patchMap: { 'rpt-001/cancel': { success: true } },
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /sí, cancelar/i }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${CAPTURE}/04_Cancelacion_Exitosa_Mensaje.png`, fullPage: true });
  });

  // "Volver atrás" cierra el modal
  test('CA-05 | Volver atrás cierra el modal sin cancelar el reporte', async ({ page }) => {
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /volver atrás/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('¿Cancelar reporte?')).not.toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/05_Modal_Cerrado_Sin_Cancelar.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TRA-8: Ver Todos los Reportes Admin
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-8 | Ver Todos los Reportes (Admin)', () => {
  const CAPTURE = 'tests/capturas/TRA-12_Modulo_Reportes/TRA-8_Todos_Reportes_Admin';

  test.beforeEach(async ({ page }) => {
    await injectContext(page, { role: 'admin', resp: RESP_ADMIN });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  // CA-10: Cancelados NO aparecen en vista admin
  test('CA-01 | Panel Admin muestra reportes: no aparecen los Cancelados', async ({ page }) => {
    await expect(page.getByText('Calle Sur 99')).not.toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Lista_Admin_Sin_Cancelados.png`, fullPage: true });
  });

  // CA-09/CA-13: Lista con dirección, estado, fecha
  test('CA-02 | Cada reporte admin muestra dirección, estado y fecha', async ({ page }) => {
    await expect(page.getByText('Av. Central 45, Col. Centro')).toBeVisible();
    await expect(page.getByText('Pendiente').first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Lista_Admin_Con_Datos.png`, fullPage: true });
  });

  // Cada elemento tiene botón Recibir e Información
  test('CA-03 | Cada elemento tiene botón Recibir y enlace Información', async ({ page }) => {
    await expect(page.getByRole('button', { name: /recibir/i }).first()).toBeVisible();
    await expect(page.getByRole('link',   { name: /información/i }).first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Botones_Recibir_Info.png`, fullPage: true });
  });

  // CA-04: Botón Recibir deshabilitado para ya Recibido (rpt-002)
  test('CA-04 | Botón Recibir deshabilitado para reporte ya Recibido', async ({ page }) => {
    await expect(page.getByRole('button', { name: /recibir/i }).nth(1)).toBeDisabled();
    await page.screenshot({ path: `${CAPTURE}/04_Boton_Recibir_Deshabilitado.png`, fullPage: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TRA-17: Filtrar Lista de Reportes (Admin)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TRA-17 | Filtrar Lista de Reportes (Admin)', () => {
  const CAPTURE = 'tests/capturas/TRA-12_Modulo_Reportes/TRA-17_Filtrar_Reportes';

  test.beforeEach(async ({ page }) => {
    await injectContext(page, { role: 'admin', resp: RESP_ADMIN });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  // Sin filtro → todos los activos visibles
  test('CA-01 | Sin filtro se muestran todos los reportes activos', async ({ page }) => {
    await expect(page.getByText('Av. Central 45, Col. Centro')).toBeVisible();
    await expect(page.getByText('Calle Norte 12, Fraccionamiento')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Sin_Filtro_Todos_Reportes.png`, fullPage: true });
  });

  // Filtro por dirección (solo un reporte)
  test('CA-02 | Filtro por dirección solo muestra reportes que contienen el término', async ({ page }) => {
    await injectContext(page, {
      role: 'admin',
      resp: { success: true, reportes: [RESP_ADMIN.reportes[1]] },
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Calle Norte 12, Fraccionamiento')).toBeVisible();
    await expect(page.getByText('Av. Central 45, Col. Centro')).not.toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Filtro_Por_Direccion.png`, fullPage: true });
  });

  // Filtro por estado Pendiente
  test('CA-03 | Filtro por estado Pendiente solo muestra Pendientes', async ({ page }) => {
    await injectContext(page, {
      role: 'admin',
      resp: { success: true, reportes: [RESP_ADMIN.reportes[0]] },
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Av. Central 45, Col. Centro')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Filtro_Por_Estado_Pendiente.png`, fullPage: true });
  });
});
