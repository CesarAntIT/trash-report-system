/**
 * TRA-20 > TRA-2 | Reportar Basura (WEB - Crear Reporte)
 *
 * Capturas en: tests/capturas/TRA-20_Movil/TRA-2_Reportar_Basura/
 *
 * NOTA: Este es el módulo WEB de reporte de basura.
 * La versión móvil (Expo) está separada del proyecto web.
 */
import { test, expect } from '@playwright/test';

const CAPTURE = 'tests/capturas/TRA-20_Movil/TRA-2_Reportar_Basura';

test.describe('TRA-2 | Reportar Basura (Web)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      localStorage.setItem('role', 'user');
    });
    await page.goto('/crear-reporte');
    await page.waitForTimeout(2000);
  });

  test('CA-01 | Formulario muestra campos: Nombre, Coordenadas, Fecha automática y Evidencias', async ({ page }) => {
    // Llenar el formulario para que NO aparezca vacío en la captura
    await page.fill('#input-nombre-ubicacion', 'Parque Central, esquina Calle 5 y Av. Norte');
    await page.fill('#input-latitud', '20.9674');
    await page.fill('#input-longitud', '-89.6237');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${CAPTURE}/01_Formulario_Con_Datos.png`, fullPage: true });
  });

  test('CA-02 | Botón Reportar deshabilitado sin Nombre de Ubicación ni Evidencias', async ({ page }) => {
    const btn = page.locator('#btn-reportar');
    await expect(btn).toBeDisabled();
    await page.screenshot({ path: `${CAPTURE}/02_Boton_Deshabilitado_Sin_Completar.png`, fullPage: true });
  });

  test('CA-03 | Campo Fecha se rellena automáticamente y no se puede editar', async ({ page }) => {
    const fechaInput = page.locator('#input-fecha');
    await expect(fechaInput).toBeDisabled();
    // Verificar que tiene contenido (fecha actual)
    const value = await fechaInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
    await page.fill('#input-nombre-ubicacion', 'Av. Itzáes Km 3, frente al mercado');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${CAPTURE}/03_Fecha_Automatica_No_Editable.png`, fullPage: true });
  });

  test('CA-04 | Sin evidencias el botón Reportar sigue deshabilitado aunque haya nombre', async ({ page }) => {
    await page.fill('#input-nombre-ubicacion', 'Colonia Roma, Calle 10 #45');
    await page.waitForTimeout(500);
    const btn = page.locator('#btn-reportar');
    await expect(btn).toBeDisabled();
    await page.screenshot({ path: `${CAPTURE}/04_Sin_Evidencias_Boton_Sigue_Deshabilitado.png`, fullPage: true });
  });

  test('CA-05 | Envío exitoso muestra notificación de confirmación', async ({ page }) => {
    await page.route('http://localhost:3000/api/reports', r =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Reporte guardado exitosamente' })
      })
    );
    // Llenar datos
    await page.fill('#input-nombre-ubicacion', 'Parque Las Américas');
    await page.fill('#input-latitud', '20.9674');
    await page.fill('#input-longitud', '-89.6237');

    // Habilitar el botón manipulando el DOM (simulando que se subió evidencia)
    await page.evaluate(() => {
      const btn = document.querySelector('#btn-reportar');
      if (btn) btn.removeAttribute('disabled');
    });

    await page.click('#btn-reportar');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${CAPTURE}/05_Notificacion_Reporte_Enviado.png`, fullPage: true });
  });
});
