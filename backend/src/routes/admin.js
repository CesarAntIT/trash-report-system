const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    const rows = users.map((u, i) => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm text-gray-500">${i + 1}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
              ${u.name.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm font-medium text-gray-900">${escapeHtml(u.name)}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(u.email)}</td>
        <td class="px-6 py-4 text-sm text-gray-400 font-mono text-xs">${u._id}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${new Date(u.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — Trash Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">

  <!-- Sidebar -->
  <div class="flex h-screen overflow-hidden">
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div class="px-6 py-5 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🗑️</span>
          <span class="text-lg font-bold text-gray-800">TrashReport</span>
        </div>
        <p class="text-xs text-gray-400 mt-1">Panel de Administración</p>
      </div>
      <nav class="flex-1 px-4 py-4 space-y-1">
        <a href="/admin" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-green-50 text-green-700 font-medium text-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          Usuarios
        </a>
        <a href="/api/docs" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium text-sm transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          API Docs (Swagger)
        </a>
      </nav>
      <div class="px-4 py-4 border-t border-gray-100">
        <p class="text-xs text-gray-400">MongoDB: <span class="text-green-500 font-medium">● Conectado</span></p>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-auto bg-gray-50">
      <div class="px-8 py-6">

        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p class="text-sm text-gray-500 mt-1">Usuarios registrados en la base de datos</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total usuarios</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">${users.length}</p>
          </div>
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Último registro</p>
            <p class="text-sm font-semibold text-gray-700 mt-1">
              ${users.length > 0
                ? new Date(users[0].createdAt).toLocaleDateString('es-MX', { dateStyle: 'medium' })
                : '—'}
            </p>
          </div>
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Base de datos</p>
            <p class="text-sm font-semibold text-green-600 mt-1">trash-report</p>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Colección: <span class="text-green-600">users</span></h2>
            <button onclick="location.reload()" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
                  <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                ${rows.length > 0 ? rows : `
                  <tr>
                    <td colspan="5" class="px-6 py-16 text-center">
                      <div class="flex flex-col items-center gap-2 text-gray-400">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p class="text-sm font-medium">No hay usuarios registrados aún</p>
                      </div>
                    </td>
                  </tr>
                `}
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
    res.status(500).send(`<pre>Error: ${err.message}</pre>`);
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
