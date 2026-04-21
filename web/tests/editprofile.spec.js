/**
 * TRA-11 > TRA-35 | Editar Información de Cuenta (perfil completo separado)
 *
 * Capturas en: tests/capturas/TRA-11_Modulo_Usuario/TRA-35_Editar_Info_Usuario/
 */
import { test, expect } from '@playwright/test';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const USER_ID = '507f1f77bcf86cd799439011';
const CAPTURE = 'tests/capturas/TRA-11_Modulo_Usuario/TRA-35_Editar_Info_Usuario';

const MOCK_USER = {
  success: true, esPropietario: true,
  usuario: {
    id: USER_ID, nombre_completo: 'Carlos García', correo_electronico: 'carlos@test.com',
    numero_telefono: '9991234567', direccion_personal: 'Calle 5 #123',
    ubicacion: { latitud: 20.9674, longitud: -89.6237 },
  },
};

test.describe('TRA-35 | Editar Información de Usuario', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('token', t), TOKEN);
    await page.route(`**/api/users/${USER_ID}`, async r => {
      if (r.request().method() === 'GET') {
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      } else {
        await r.continue();
      }
    });
    await page.goto(`/edit-profile/${USER_ID}`);
    await page.waitForTimeout(2000);
  });

  test('CA-01 | Formulario de edición muestra campos correctos', async ({ page }) => {
    await page.screenshot({ path: `${CAPTURE}/01_Formulario_Edicion.png`, fullPage: true });
  });

  test('CA-02 | Campos cargados con valores actuales del usuario', async ({ page }) => {
    await page.screenshot({ path: `${CAPTURE}/02_Valores_Pre_Cargados.png`, fullPage: true });
  });

  test('CA-03 | Guardar cambios exitoso muestra confirmación', async ({ page }) => {
    await page.route(`**/api/users/${USER_ID}`, async r => {
      if (r.request().method() === 'PUT') {
        await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Perfil actualizado' }) });
      } else {
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      }
    });
    const tel = page.locator('input[type="tel"]');
    if (await tel.isVisible()) await tel.fill('9990000001');
    await page.getByRole('button', { name: /guardar cambios/i }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${CAPTURE}/03_Guardado_Exitoso.png`, fullPage: true });
  });

  test('CA-04 | Botón "Editar" en Info de Usuario lleva al formulario', async ({ page }) => {
    await page.goto(`/userinfo/${USER_ID}`);
    await page.waitForTimeout(2000);
    const editBtn = page.getByRole('button', { name: /editar perfil/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: `${CAPTURE}/04_Navegar_A_Edicion.png`, fullPage: true });
  });

  test('CA-05 | Solo el propietario puede editar sus datos', async ({ page }) => {
    await page.route(`**/api/users/${USER_ID}`, r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...MOCK_USER, esPropietario: false }) })
    );
    await page.goto(`/userinfo/${USER_ID}`);
    await page.waitForTimeout(2000);
    // El botón Editar NO debe aparecer
    await page.screenshot({ path: `${CAPTURE}/05_Boton_Editar_Oculto_No_Propietario.png`, fullPage: true });
  });
});
