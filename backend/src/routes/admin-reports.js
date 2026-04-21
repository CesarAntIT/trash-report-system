const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const layout = require('../views/layout');

const router = express.Router();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// BUG-10: Middleware que verifica sesión + rol admin para todas las rutas
async function adminOnly(req, res, next) {
  authMiddleware(req, res, async () => {
    const usuario = await User.findById(req.userId);
    if (!usuario || !usuario.isAdmin) {
      return res.status(403).send('<h2>Acceso denegado. Solo administradores.</h2>');
    }
    next();
  });
}

// GET /admin/reports — lista de todos los reportes (BUG-08: excluye Cancelado)
router.get('/', adminOnly, async (req, res) => {
  try {
    // BUG-08: filtrar Cancelados
    const reports = await Report.find({ status: { $ne: 'Cancelado' } }).sort({ createdAt: -1 });

    const rows = reports.map((r, i) => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-4 py-3 text-sm text-gray-500">${i + 1}</td>

        <td class="px-4 py-3 font-mono text-xs text-gray-700 max-w-[120px] truncate">
          ${escapeHtml(r.reportId)}
        </td>

        <td class="px-4 py-3 text-sm">
          <span class="px-2 py-1 rounded text-xs font-medium
            ${r.status === 'Pendiente'  ? 'bg-yellow-100 text-yellow-700' :
              r.status === 'Recibido'   ? 'bg-blue-100 text-blue-700' :
              r.status === 'Completado' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'}">
            ${escapeHtml(r.status)}
          </span>
        </td>

        <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
          ${escapeHtml(r.locationName)}
        </td>

        <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          ${new Date(r.createdAt).toLocaleString('es-MX')}
        </td>

        <!-- BUG-09: Botones Recibir e Información -->
        <td class="px-4 py-3">
          <div class="flex gap-2">
            ${r.status === 'Pendiente' ? `
              <button
                onclick="recibirReporte('${r._id}', this)"
                class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                ✔ Recibir
              </button>
            ` : `
              <span class="text-xs text-gray-400 italic">—</span>
            `}
            <a href="/admin/reports/${escapeHtml(r.reportId)}"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              ℹ Info
            </a>
          </div>
        </td>
      </tr>
    `).join('');

    const content = `
<div class="px-8 py-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Todos los Reportes</h1>
      <p class="text-sm text-gray-500 mt-1">Reportes activos (excluye cancelados)</p>
    </div>
    <button onclick="location.reload()"
      class="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm">
      🔄 Refrescar
    </button>
  </div>

  <div id="toast" class="hidden fixed top-4 right-4 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold z-50"></div>

  <div class="bg-white border rounded-xl overflow-x-auto">
    <table class="w-full text-left">
      <thead class="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">ID</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3">Dirección</th>
          <th class="px-4 py-3">Fecha</th>
          <th class="px-4 py-3">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        ${rows || `<tr><td colspan="6" class="text-center py-10 text-gray-400">No hay reportes activos</td></tr>`}
      </tbody>
    </table>
  </div>
</div>

<script>
async function recibirReporte(id, btn) {
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const token = localStorage.getItem('admin_token') || '';
    const res = await fetch('/api/reports/' + id + '/receive', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    btn.closest('tr').querySelector('td:nth-child(3) span').textContent = 'Recibido';
    btn.closest('tr').querySelector('td:nth-child(3) span').className = 'px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700';
    btn.remove();
    showToast('✔ Reporte marcado como Recibido');
  } catch (e) {
    btn.disabled = false;
    btn.textContent = '✔ Recibir';
    showToast('Error: ' + e.message, true);
  }
}

function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'fixed top-4 right-4 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold z-50 ' + (error ? 'bg-red-600' : 'bg-green-600');
  setTimeout(() => { t.className = 'hidden'; }, 3000);
}
</script>
`;

    res.send(layout({ title: 'Reportes', active: 'reports', content }));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET /admin/reports/:reportId — detalle del reporte
router.get('/:reportId', adminOnly, async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return res.status(404).send('<h2>Reporte no encontrado</h2>');

    const evidencias = (report.evidencias || []).map(img => `
      <div class="w-32 h-32 overflow-hidden rounded-lg border">
        <img src="${escapeHtml(img)}" class="w-full h-full object-cover" />
      </div>
    `).join('');

    const content = `
<div class="px-8 py-6 max-w-3xl">
  <a href="/admin/reports" class="text-sm text-blue-600 hover:underline mb-4 block">← Volver a Reportes</a>

  <h1 class="text-2xl font-bold text-gray-900 mb-6">Detalle del Reporte</h1>

  <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
    <div class="grid grid-cols-2 gap-4">
      <div><p class="text-xs text-gray-400 uppercase font-semibold mb-1">ID de Reporte</p>
        <p class="font-mono text-sm text-gray-700">${escapeHtml(report.reportId)}</p></div>
      <div><p class="text-xs text-gray-400 uppercase font-semibold mb-1">Estado</p>
        <span class="px-2 py-1 rounded text-xs font-bold ${report.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : report.status === 'Recibido' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
          ${escapeHtml(report.status)}</span></div>
      <div><p class="text-xs text-gray-400 uppercase font-semibold mb-1">ID de Ciudadano</p>
        <p class="font-mono text-xs text-gray-600">${escapeHtml(String(report.user))}</p></div>
      <div><p class="text-xs text-gray-400 uppercase font-semibold mb-1">Fecha</p>
        <p class="text-sm text-gray-700">${escapeHtml(report.fecha)}</p></div>
      <div class="col-span-2"><p class="text-xs text-gray-400 uppercase font-semibold mb-1">Dirección</p>
        <p class="text-sm text-gray-700">${escapeHtml(report.locationName)}</p></div>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
    <h3 class="font-semibold text-gray-700 mb-3">Ubicación en Mapa</h3>
    <div class="h-72 rounded-xl overflow-hidden border">
      <iframe width="100%" height="100%" style="border:0"
        src="https://maps.google.com/maps?q=${report.latitude},${report.longitude}&z=16&output=embed">
      </iframe>
    </div>
  </div>

  ${report.evidencias?.length ? `
  <div class="bg-white rounded-xl shadow-sm border p-6">
    <h3 class="font-semibold text-gray-700 mb-3">Evidencias (${report.evidencias.length})</h3>
    <div class="flex flex-wrap gap-3">${evidencias}</div>
  </div>` : ''}
</div>
`;
    res.send(layout({ title: 'Detalle Reporte', active: 'reports', content }));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
