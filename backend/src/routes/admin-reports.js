const express = require('express');
const Report = require('../models/Report');

const router = express.Router();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });

    const rows = reports.map((r, i) => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm text-gray-500">${i + 1}</td>

        <td class="px-6 py-4 text-sm font-mono text-gray-700">
          ${r.reportId}
        </td>

        <td class="px-6 py-4 text-sm">
          <span class="px-2 py-1 rounded-full text-xs font-medium
            ${r.status === 'Recibido' ? 'bg-yellow-100 text-yellow-700' :
              r.status === 'Completado' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'}">
            ${r.status}
          </span>
        </td>

        <td class="px-6 py-4 text-sm text-gray-600">
          ${escapeHtml(r.locationName)}
        </td>

        <td class="px-6 py-4 text-sm text-gray-500">
          ${new Date(r.createdAt).toLocaleString('es-MX')}
        </td>

        <td class="px-6 py-4 text-sm text-gray-600 font-mono">
          ${r.latitude}, ${r.longitude}
        </td>

        <td class="px-6 py-4 text-sm">
          ${r.evidencias?.length
            ? r.evidencias.map(e => `
                <div class="flex gap-2 flex-wrap">
                  <img 
                    src="${e}" 
                    class="w-20 h-20 object-cover rounded-lg border hover:scale-105 transition cursor-pointer"/>
                </div>
              `).join('')
            : '—'
          }
        </td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — Reportes</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>

<body class="bg-gray-100 min-h-screen">

<div class="flex h-screen overflow-hidden">

  <!-- SIDEBAR (IGUAL QUE USERS) -->
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
    <div class="px-6 py-5 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🗑️</span>
        <span class="text-lg font-bold text-gray-800">TrashReport</span>
      </div>
      <p class="text-xs text-gray-400 mt-1">Panel de Administración</p>
    </div>

    <nav class="flex-1 px-4 py-4 space-y-1">

      <!-- USUARIOS -->
      <a href="/admin"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium text-sm">
        
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>

        Usuarios
      </a>

      <!-- REPORTES (ACTIVO) -->
      <a href="/admin/reports"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-green-50 text-green-700 font-medium text-sm">
        
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>

        Reportes
      </a>

      <!-- SWAGGER -->
      <a href="/api/docs"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium text-sm">
        
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>

        API Docs (Swagger)
      </a>

    </nav>

    <div class="px-4 py-4 border-t border-gray-100">
      <p class="text-xs text-gray-400">
        MongoDB: <span class="text-green-500 font-medium">● Conectado</span>
      </p>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="flex-1 overflow-auto bg-gray-50">

    <div class="px-8 py-6">

      <!-- HEADER -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Reportes</h1>
        <p class="text-sm text-gray-500 mt-1">Reportes enviados por los usuarios</p>
      </div>

      <!-- STATS -->
      <div class="grid grid-cols-3 gap-4 mb-6">

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-xs font-medium text-gray-500 uppercase">Total reportes</p>
          <p class="text-3xl font-bold mt-1">${reports.length}</p>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-xs font-medium text-gray-500 uppercase">Último reporte</p>
          <p class="text-sm font-semibold mt-1">
            ${reports.length
              ? new Date(reports[0].createdAt).toLocaleDateString('es-MX')
              : '—'}
          </p>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-xs font-medium text-gray-500 uppercase">Base de datos</p>
          <p class="text-sm font-semibold text-green-600 mt-1">trash-report</p>
        </div>

      </div>

      <!-- TABLE -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        <div class="px-6 py-4 border-b border-gray-100 flex justify-between">
          <h2 class="text-sm font-semibold text-gray-700">
            Colección: <span class="text-green-600">reports</span>
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">

            <thead>
              <tr class="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th class="px-6 py-3">#</th>
                <th class="px-6 py-3">ID Reporte</th>
                <th class="px-6 py-3">Estado</th>
                <th class="px-6 py-3">Dirección</th>
                <th class="px-6 py-3">Fecha</th>
                <th class="px-6 py-3">Coordenadas</th>
                <th class="px-6 py-3">Evidencia</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-50">
              ${rows}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  </main>
</div>

</body>
</html>`;

    res.send(html);

  } catch (err) {
    res.status(500).send(`<pre>${err.message}</pre>`);
  }
});

module.exports = router;