import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/capturas',

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'off',                   // Desactivado, usaremos manuales organizadas
    video: 'off',
    headless: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/reporte-html', open: 'never' }],
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
