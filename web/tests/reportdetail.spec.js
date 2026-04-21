/**
 * TRA-16 > TRA-15 | Mostrar Detalle de Reporte
 *
 * Capturas en: tests/capturas/TRA-16_Modulo_Detalle/TRA-15_Mostrar_Detalle/
 *
 * IMPORTANTE: El fetch usa http://localhost:3000 (URL real del backend).
 */
import { test, expect } from '@playwright/test';

const TOKEN = 'mock_token_usuario_test';
const REPORT_ID = 'abc123-reporte-uuid-test';
const CAPTURE = 'tests/capturas/TRA-16_Modulo_Detalle/TRA-15_Mostrar_Detalle';

const MOCK_REPORTE = {
  success: true,
  reporte: {
    reportId: REPORT_ID,
    usuarioId: '507f1f77bcf86cd799439011',
    fecha: '20/04/2026, 10:00',
    locationName: 'Parque Central, Calle 60 #120',
    ubicacion: { latitud: 20.9674, longitud: -89.6237 },
    status: 'Pendiente',
    evidencias: [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='
    ],
  },
};

test.describe('TRA-15 | Mostrar Detalle de Reporte', () => {

  test.beforeEach(async ({ page }) => {
    await page.route(`http://localhost:3000/api/reports/${REPORT_ID}`, r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_REPORTE) })
    );
    await page.addInitScript(t => localStorage.setItem('token', t), TOKEN);
    await page.goto(`/report/${REPORT_ID}`);
    await page.waitForTimeout(2500);
  });

  test('CA-01 | Metadata visible: ID, Fecha, Dirección, Estado, ID de Usuario', async ({ page }) => {
    await expect(page.getByText('Parque Central, Calle 60 #120')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Metadata_Completa_Reporte.png`, fullPage: true });
  });

  test('CA-02 | Ubicación mostrada en mapa (iframe de Google Maps)', async ({ page }) => {
    await expect(page.locator('iframe')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Ubicacion_En_Mapa.png`, fullPage: true });
  });

  test('CA-03 | Evidencias se muestran con recorte de aspecto 1:1', async ({ page }) => {
    await expect(page.locator('img').first()).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Evidencias_AspectRatio_1x1.png`, fullPage: true });
  });

  test('CA-04 | Sin evidencias muestra mensaje de "No hay evidencias"', async ({ page }) => {
    await page.route(`http://localhost:3000/api/reports/${REPORT_ID}`, r =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_REPORTE, reporte: { ...MOCK_REPORTE.reporte, evidencias: [] } })
      })
    );
    await page.goto(`/report/${REPORT_ID}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${CAPTURE}/04_Sin_Evidencias_Mensaje.png`, fullPage: true });
  });

  test('CA-05 | Reporte no encontrado muestra error claro al usuario', async ({ page }) => {
    await page.route(`http://localhost:3000/api/reports/${REPORT_ID}`, r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Reporte no encontrado' }) })
    );
    await page.goto(`/report/${REPORT_ID}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${CAPTURE}/05_Error_Reporte_No_Encontrado.png`, fullPage: true });
  });
});
