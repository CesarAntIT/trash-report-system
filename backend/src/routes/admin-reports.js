const express = require('express');
const Report = require('../models/Report');
const layout = require('../views/layout');

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
      <tr class="hover:bg-gray-50 transition">

        <td class="px-6 py-4 text-sm text-gray-500">${i + 1}</td>

        <td class="px-6 py-4 font-mono text-xs text-gray-700">
          ${r.reportId}
        </td>

        <td class="px-6 py-4 text-sm">
          <span class="px-2 py-1 rounded text-xs font-medium
            ${r.status === 'Recibido' ? 'bg-yellow-100 text-yellow-700' :
              r.status === 'Completado' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'}">
            ${r.status}
          </span>
        </td>

        <!-- 📍 DIRECCIÓN -->
        <td class="px-6 py-4 text-sm text-gray-700 max-w-xs">
          ${escapeHtml(r.locationName)}
        </td>

        <!-- 📅 FECHA -->
        <td class="px-6 py-4 text-sm text-gray-500">
          ${new Date(r.createdAt).toLocaleString('es-MX')}
        </td>

        <!-- 🧾 COORDENADAS -->
        <td class="px-6 py-4 text-xs text-gray-400 font-mono">
          ${r.latitude}, ${r.longitude}
        </td>

        <!-- 📸 EVIDENCIA -->
        <td class="px-6 py-4">
          <div class="flex gap-2 flex-wrap">

            ${
              r.evidencias?.length
                ? r.evidencias.map(img => `
                    <a href="${img}" target="_blank">
                      <img
                        src="${img}"
                        class="w-16 h-16 object-cover rounded border hover:scale-105 transition"
                      />
                    </a>
                  `).join('')
                : `<span class="text-gray-400 text-sm">Sin evidencia</span>`
            }

          </div>
        </td>

      </tr>
    `).join('');

    const content = `
<div class="px-8 py-6">

  <h1 class="text-2xl font-bold text-gray-900">Reportes</h1>
  <p class="text-sm text-gray-500 mb-6">
    Reportes con ubicación y evidencia
  </p>

  <div class="bg-white border rounded-xl overflow-x-auto">

    <table class="w-full text-left">

      <thead class="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th class="px-6 py-3">#</th>
          <th class="px-6 py-3">ID</th>
          <th class="px-6 py-3">Estado</th>
          <th class="px-6 py-3">Dirección</th>
          <th class="px-6 py-3">Fecha</th>
          <th class="px-6 py-3">Coordenadas</th>
          <th class="px-6 py-3">Evidencia</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-50">
        ${rows || `
          <tr>
            <td colspan="7" class="text-center py-10 text-gray-400">
              No hay reportes
            </td>
          </tr>
        `}
      </tbody>

    </table>

  </div>

</div>
`;

    res.send(
      layout({
        title: 'Reportes',
        active: 'reports',
        content
      })
    );

  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;