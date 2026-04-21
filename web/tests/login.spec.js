/**
 * TRA-7 | Iniciar Sesión (Web - login.html)
 *
 * Capturas en: tests/capturas/TRA-11_Modulo_Usuario/TRA-7_Iniciar_Sesion/
 */
import { test, expect } from '@playwright/test';

const BASE = 'tests/capturas/TRA-11_Modulo_Usuario/TRA-7_Iniciar_Sesion';

test.describe('TRA-7 | Iniciar Sesión', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForTimeout(1500);
  });

  test('CA-01 | Formulario visible con campos Correo y Contraseña precargados', async ({ page }) => {
    // Llenar el formulario para que no aparezca vacío en la captura
    const email = page.locator('input[type="email"]').first();
    const pass  = page.locator('input[type="password"]').first();
    if (await email.isVisible()) await email.fill('usuario@ejemplo.com');
    if (await pass.isVisible())  await pass.fill('miContraseña123');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${BASE}/01_Login_Formulario_Con_Datos.png`, fullPage: true });
  });

  test('CA-02 | Campos vacíos: botón deshabilitado o muestra error al intentar enviar', async ({ page }) => {
    // No llenamos nada, presionamos el botón
    const btn = page.getByRole('button', { name: /iniciar sesión|entrar/i });
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${BASE}/02_Error_Campos_Vacios.png`, fullPage: true });
  });

  test('CA-03 | Credenciales incorrectas muestran mensaje de error', async ({ page }) => {
    await page.route('http://localhost:3000/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciales inválidas. Verifica tu correo y contraseña.' })
      });
    });
    const email = page.locator('input[type="email"]').first();
    const pass  = page.locator('input[type="password"]').first();
    if (await email.isVisible()) await email.fill('noexiste@correo.com');
    if (await pass.isVisible())  await pass.fill('claveErronea999');
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${BASE}/03_Error_Credenciales_Incorrectas.png`, fullPage: true });
  });

  test('CA-04 | Desde Login se puede navegar a la pantalla de Registro', async ({ page }) => {
    const btnCrear = page.getByRole('button', { name: /crear cuenta|registrarse/i });
    if (await btnCrear.isVisible()) {
      await btnCrear.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: `${BASE}/04_Navegacion_A_Registro.png`, fullPage: true });
  });
});
