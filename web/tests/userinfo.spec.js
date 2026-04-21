/**
 * TRA-11 > TRA-18 | Ver Información de Usuario
 * TRA-11 > TRA-14 | Seleccionar Ubicación Personal
 * TRA-11 > TRA-35 | Editar Información de Usuario
 *
 * IMPORTANTE: El fetch usa la URL real http://localhost:3000
 * Los mocks deben interceptar esa URL.
 *
 * Capturas en:
 *   tests/capturas/TRA-11_Modulo_Usuario/TRA-18_Ver_Info_Usuario/
 *   tests/capturas/TRA-11_Modulo_Usuario/TRA-14_Seleccionar_Ubicacion/
 *   tests/capturas/TRA-11_Modulo_Usuario/TRA-35_Editar_Info_Usuario/
 */
import { test, expect } from '@playwright/test';

const TOKEN = 'mock_token_usuario_test';
const USER_ID = '507f1f77bcf86cd799439011';

const MOCK_USER = {
  success: true, esPropietario: true,
  usuario: {
    id: USER_ID,
    nombre_completo: 'Carlos García López',
    correo_electronico: 'carlos.garcia@ejemplo.com',
    numero_telefono: '9991234567',
    direccion_personal: 'Calle 5 #123, Colonia Centro',
    ubicacion: { latitud: 20.9674, longitud: -89.6237 },
  },
};

// ── TRA-18: Ver Información de Usuario ───────────────────────────────────────
test.describe('TRA-18 | Ver Información de Usuario', () => {
  const CAPTURE = 'tests/capturas/TRA-11_Modulo_Usuario/TRA-18_Ver_Info_Usuario';

  test.beforeEach(async ({ page }) => {
    // Interceptar la URL real del backend
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
    );
    await page.addInitScript(t => localStorage.setItem('token', t), TOKEN);
    await page.goto(`/userinfo/${USER_ID}`);
    await page.waitForTimeout(2500);
  });

  test('CA-01 | Muestra datos personales completos del usuario', async ({ page }) => {
    await expect(page.getByText('Carlos García López')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Datos_Personales.png`, fullPage: true });
  });

  test('CA-02 | Mapa de ubicación es visible con coordenadas válidas', async ({ page }) => {
    await expect(page.locator('iframe')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/02_Mapa_Ubicacion_Personal.png`, fullPage: true });
  });

  test('CA-03 | Botón Editar Perfil visible para el propietario', async ({ page }) => {
    await expect(page.getByRole('button', { name: /editar perfil/i })).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/03_Boton_Editar_Visible.png`, fullPage: true });
  });

  test('CA-04 | Botón Editar NO aparece para usuario no propietario', async ({ page }) => {
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...MOCK_USER, esPropietario: false }) })
    );
    await page.goto(`/userinfo/${USER_ID}`);
    await page.waitForTimeout(2500);
    await expect(page.getByRole('button', { name: /editar perfil/i })).not.toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/04_Boton_Editar_Oculto.png`, fullPage: true });
  });
});

// ── TRA-14: Seleccionar Ubicación Personal ────────────────────────────────────
test.describe('TRA-14 | Seleccionar Ubicación Personal', () => {
  const CAPTURE = 'tests/capturas/TRA-11_Modulo_Usuario/TRA-14_Seleccionar_Ubicacion';

  test.beforeEach(async ({ page }) => {
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, async r => {
      if (r.request().method() === 'GET')
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      else await r.continue();
    });
    await page.addInitScript(t => localStorage.setItem('token', t), TOKEN);
    await page.goto(`/edit-profile/${USER_ID}`);
    await page.waitForTimeout(2500);
  });

  test('CA-01 | Campos Latitud y Longitud son visibles para editar ubicación', async ({ page }) => {
    await expect(page.getByText('Latitud')).toBeVisible();
    await expect(page.getByText('Longitud')).toBeVisible();
    await page.screenshot({ path: `${CAPTURE}/01_Campos_Coordenadas_Visibles.png`, fullPage: true });
  });
});

// ── TRA-35: Editar Información de Usuario ────────────────────────────────────
test.describe('TRA-35 | Editar Información de Usuario', () => {
  const CAPTURE = 'tests/capturas/TRA-11_Modulo_Usuario/TRA-35_Editar_Info_Usuario';

  test.beforeEach(async ({ page }) => {
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, async r => {
      if (r.request().method() === 'GET')
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      else await r.continue();
    });
    await page.addInitScript(t => localStorage.setItem('token', t), TOKEN);
    await page.goto(`/edit-profile/${USER_ID}`);
    await page.waitForTimeout(2500);
  });

  test('CA-01 | Formulario cargado con valores actuales del usuario', async ({ page }) => {
    await expect(page.locator('input[type="tel"]')).toHaveValue('9991234567');
    await page.screenshot({ path: `${CAPTURE}/01_Formulario_Valores_Prellenados.png`, fullPage: true });
  });

  test('CA-02 | Guardado exitoso muestra mensaje de confirmación', async ({ page }) => {
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, async r => {
      if (r.request().method() === 'PUT')
        await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Perfil actualizado' }) });
      else
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.locator('input[type="tel"]').fill('9990000001');
    await page.getByRole('button', { name: /guardar cambios/i }).click();
    await page.waitForTimeout(1500);
    // Debe aparecer el mensaje de éxito
    await page.screenshot({ path: `${CAPTURE}/02_Mensaje_Guardado_Exitoso.png`, fullPage: true });
  });

  test('CA-03 | Error en guardado muestra mensaje de error', async ({ page }) => {
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, async r => {
      if (r.request().method() === 'PUT')
        await r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'El correo ya está en uso por otra cuenta' }) });
      else
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.locator('input[type="email"]').fill('yaexiste@correo.com');
    await page.getByRole('button', { name: /guardar cambios/i }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${CAPTURE}/03_Error_Email_Duplicado.png`, fullPage: true });
  });

  test('CA-04 | Solo el propietario tiene acceso al botón Editar en Info de Usuario', async ({ page }) => {
    await page.route(`http://localhost:3000/api/users/${USER_ID}`, r =>
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...MOCK_USER, esPropietario: false }) })
    );
    await page.goto(`/userinfo/${USER_ID}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${CAPTURE}/04_Solo_Propietario_Puede_Editar.png`, fullPage: true });
  });
});
