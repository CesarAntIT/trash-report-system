/**
 * TRA-21 > TRA-9 | Estadísticas de Reporte (Admin)
 *
 * Historia cubierta:
 *   TRA-9 — Como Administrador, quiero ver estadísticas e indicadores de reportes
 *
 * Capturas en: tests/capturas/TRA-21_Admin/TRA-9_Estadisticas_Reporte/
 */
import { test, expect } from '@playwright/test';

const CAPTURE = 'tests/capturas/TRA-21_Admin/TRA-9_Estadisticas_Reporte';

const TEST_TOKEN = 'mock_token_admin';

const RESUMEN_OK = {
  success: true,
  mes: 'abril 2026',
  resumen: { total: 5, Pendiente: 2, Recibido: 2, Completado: 1, Cancelado: 0 },
};

const DISTRIBUCION_OK = {
  success: true,
  distribucion: [
    { estado: 'Pendiente',  cantidad: 2, porcentaje: 40 },
    { estado: 'Recibido',   cantidad: 2, porcentaje: 40 },
    { estado: 'Completado', cantidad: 1, porcentaje: 20 },
  ],
};

const TOP_DIRS_OK = {
  success: true,
  top_direcciones: [
    { direccion: 'Parque Central', total_reportes: 3 },
    { direccion: 'Calle 5 Norte',  total_reportes: 1 },
  ],
};

async function mockMetricsAPIs(page, { resumen = RESUMEN_OK, distribucion = DISTRIBUCION_OK, topDirs = TOP_DIRS_OK } = {}) {
  await page.route('**/api/reports/metricas/resumen',         r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(resumen) }));
  await page.route('**/api/reports/metricas/distribucion',    r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(distribucion) }));
  await page.route('**/api/reports/metricas/top-direcciones', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(topDirs) }));
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(token => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', 'admin');
  }, TEST_TOKEN);
});

// ═══════════════════════════════════════════════════════════════════════════
// Tarjetas de resumen
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TRA-9 | /metrics — Tarjetas de Resumen', () => {

  test('CA-01 | Título de la página es visible', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Métricas de Reportes')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Titulo_Pagina_Metricas.png`, fullPage: true });
  });

  test('CA-02 | Tarjeta Total del Mes muestra el valor correcto', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Total del Mes')).toBeVisible();
    await expect(page.getByText('5', { exact: true }).first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Tarjeta_Total_Mes.png`, fullPage: true });
  });

  test('CA-03 | Tarjeta Pendientes muestra el valor correcto', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Pendientes')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Tarjeta_Pendientes.png`, fullPage: true });
  });

  test('CA-04 | Tarjeta Recibidos muestra el valor correcto', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Recibidos')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/04_Tarjeta_Recibidos.png`, fullPage: true });
  });

  test('CA-05 | Tarjeta Completados es visible', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Completados')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/05_Tarjeta_Completados.png`, fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Distribución y Top Direcciones
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TRA-9 | /metrics — Distribución y Top Direcciones', () => {

  test('CA-06 | Sección Distribución por Estado es visible con barras', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Distribución por Estado')).toBeVisible();
    await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/06_Distribucion_Por_Estado.png`, fullPage: true });
  });

  test('CA-07 | Sección Top Direcciones muestra la primera dirección', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Top Direcciones con más Reportes')).toBeVisible();
    await expect(page.getByText('Parque Central')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/07_Top_Direcciones.png`, fullPage: true });
  });

  test('CA-08 | Top Direcciones muestra cantidad de reportes', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('3 reportes')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/08_Top_Direcciones_Cantidad.png`, fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Botón Refrescar y estados especiales
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TRA-9 | /metrics — Refrescar y estados especiales', () => {

  test('CA-09 | Botón Refrescar es visible y no está deshabilitado', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    const btn = page.getByRole('button', { name: /refrescar/i });
    await expect(btn).toBeVisible();
    await expect(btn).not.toBeDisabled();
    await page.screenshot({ path: `${CAPTURE}/09_Boton_Refrescar_Visible.png`, fullPage: true });
  });

  test('CA-10 | Sin reportes → secciones muestran "Sin datos"', async ({ page }) => {
    await mockMetricsAPIs(page, {
      resumen:      { success: true, mes: 'abril 2026', resumen: { total: 0, Pendiente: 0, Recibido: 0, Completado: 0, Cancelado: 0 } },
      distribucion: { success: true, distribucion: [] },
      topDirs:      { success: true, top_direcciones: [] },
    });
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Sin datos este mes')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/10_Sin_Datos_Este_Mes.png`, fullPage: true });
  });

  test('CA-11 | API devuelve 403 → mensaje de acceso denegado', async ({ page }) => {
    await page.route('**/api/reports/metricas/resumen',         r => r.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Acceso denegado' }) }));
    await page.route('**/api/reports/metricas/distribucion',    r => r.fulfill({ status: 403, contentType: 'application/json', body: '{}' }));
    await page.route('**/api/reports/metricas/top-direcciones', r => r.fulfill({ status: 403, contentType: 'application/json', body: '{}' }));
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByText(/acceso denegado/i)).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/11_Error_Acceso_Denegado.png`, fullPage: true });
  });

  test('CA-12 | Sidebar tiene enlace al Dashboard', async ({ page }) => {
    await mockMetricsAPIs(page);
    await page.goto('/metrics');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/12_Sidebar_Enlace_Dashboard.png`, fullPage: true });
  });
});
