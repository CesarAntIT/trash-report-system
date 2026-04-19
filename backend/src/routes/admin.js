const express = require('express');
const User = require('../models/User');
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
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    const rows = users.map((u, i) => `
      <tr class="hover:bg-gray-50">
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
        <td class="px-6 py-4 text-xs text-gray-400 font-mono">${u._id}</td>
        <td class="px-6 py-4 text-sm text-gray-500">
          ${new Date(u.createdAt).toLocaleString('es-MX')}
        </td>
      </tr>
    `).join('');

    const content = `
<div class="px-8 py-6">

  <h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>
  <p class="text-sm text-gray-500 mb-6">Usuarios registrados</p>

  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    <table class="w-full text-left">
      <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
        <tr>
          <th class="px-6 py-3">#</th>
          <th class="px-6 py-3">Nombre</th>
          <th class="px-6 py-3">Correo</th>
          <th class="px-6 py-3">ID</th>
          <th class="px-6 py-3">Fecha</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        ${rows}
      </tbody>
    </table>
  </div>

</div>
`;

    res.send(layout({
      title: 'Usuarios',
      active: 'users',
      content
    }));

  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;