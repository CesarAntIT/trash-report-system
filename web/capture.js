import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // set token
  const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  await page.addInitScript(token => {
    localStorage.setItem('token', token);
  }, TEST_TOKEN);

  const USER_ID = '507f1f77bcf86cd799439011';
  
  const USUARIO_MOCK = {
    success: true,
    esPropietario: true,
    usuario: {
      id: USER_ID,
      nombre_completo: 'Carlos García',
      correo_electronico: 'carlos@test.com',
      numero_telefono: '9991234567',
      direccion_personal: 'Calle 5 #123',
      ubicacion: { latitud: 20.9674, longitud: -89.6237 },
    },
  };

  // Mock API route
  await page.route(`**/api/users/${USER_ID}`, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(USUARIO_MOCK) });
    } else {
      await route.continue();
    }
  });

  // Navigate to edit profile page
  await page.goto(`http://localhost:5173/edit-profile/${USER_ID}`);
  await page.waitForTimeout(1000); // Wait for render

  // Simulate invalid state (empty phone number)
  const phoneInput = page.locator('input[type="tel"]');
  await phoneInput.clear();
  await phoneInput.blur();
  await page.getByRole('button', { name: /guardar cambios/i }).click();
  await page.waitForTimeout(500); // Let visual errors appear if any

  console.log('Sacando foto del estado invalido...');
  await page.screenshot({ path: 'tests/capturas/1_estado_invalido.png', fullPage: true });

  // Add validation visual class or message manually if not present, but user expects form natively
  // Actually html5 validation tooltips might not be captured by screenshot, but empty fields with red borders etc might be.
  
  // Simulate valid state
  await phoneInput.fill('9991234567');
  console.log('Sacando foto del estado corregido...');
  await page.screenshot({ path: 'tests/capturas/2_estado_corregido.png', fullPage: true });

  await browser.close();
  console.log('¡Listo! Capturas generadas.');
})();
