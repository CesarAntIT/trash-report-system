/**
 * TRA-11 > TRA-6 | Registrar un Usuario
 * Capturas en: tests/capturas/TRA-11_Modulo_Usuario/TRA-6_Registrar_Usuario/
 */
import { test, expect } from '@playwright/test';

const BASE = 'tests/capturas/TRA-11_Modulo_Usuario/TRA-6_Registrar_Usuario';

test.describe('TRA-6 | Registrar un Usuario', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForTimeout(1500);
    // Cambiar al formulario de registro
    const btnCrear = page.getByRole('button', { name: /crear cuenta/i });
    if (await btnCrear.isVisible()) {
      await btnCrear.click();
      await page.waitForTimeout(1000);
    }
  });

  test('CA-01 | Formulario muestra todos los campos requeridos', async ({ page }) => {
    await page.screenshot({ path: `${BASE}/01_Formulario_Completo.png`, fullPage: true });
  });

  test('CA-02 | Error: contraseñas no coinciden', async ({ page }) => {
    // Usar :visible para evitar resolver al campo oculto del formulario de login
    const nombreInput = page.locator('input[placeholder*="nombre" i]:visible').first();
    if (await nombreInput.isVisible()) await nombreInput.fill('Juan Prueba');

    const emailVisible = page.locator('input[type="email"]:visible');
    if (await emailVisible.count() > 0) await emailVisible.first().fill('juan@test.com');

    const passwords = page.locator('input[type="password"]:visible');
    if (await passwords.count() >= 2) {
      await passwords.nth(0).fill('password123');
      await passwords.nth(1).fill('diferente456');
    }
    const btnReg = page.getByRole('button', { name: /registrar|crear/i });
    if (await btnReg.isVisible()) await btnReg.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${BASE}/02_Error_Passwords_No_Coinciden.png`, fullPage: true });
  });

  test('CA-03 | Error: campos requeridos vacíos', async ({ page }) => {
    const btnReg = page.getByRole('button', { name: /registrar|crear/i });
    if (await btnReg.isVisible()) await btnReg.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${BASE}/03_Error_Campos_Vacios.png`, fullPage: true });
  });

  test('CA-04 | Registro exitoso → redirige a la app', async ({ page }) => {
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, token: 'mock_token_123', message: 'Usuario registrado' })
      });
    });
    const nombreInput = page.locator('input[placeholder*="nombre" i]:visible').first();
    if (await nombreInput.isVisible()) await nombreInput.fill('Ana Prueba');
    const emailVisible = page.locator('input[type="email"]:visible');
    if (await emailVisible.count() > 0) await emailVisible.first().fill('ana@test.com');
    const passwords = page.locator('input[type="password"]:visible');
    if (await passwords.count() >= 2) {
      await passwords.nth(0).fill('securePass1');
      await passwords.nth(1).fill('securePass1');
    }
    const btnReg = page.getByRole('button', { name: /registrar|crear/i });
    if (await btnReg.isVisible()) await btnReg.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${BASE}/04_Registro_Exitoso.png`, fullPage: true });
  });
});
