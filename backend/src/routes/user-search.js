const express = require('express');
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

// BUG-17: Ahora filtra directamente por campos del usuario (name + address)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { name, lat, lng, radius } = req.query;

    const filter = {};

    // Filtro por nombre (regex parcial, case-insensitive)
    if (name && name.trim()) {
      filter.name = { $regex: name.trim(), $options: 'i' };
    }

    // BUG-17 fix: Filtro por radio usando la dirección de domicilio del usuario
    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const range = parseFloat(radius) / 111000; // metros → grados aprox.

      filter['address.latitude']  = { $gte: latNum - range, $lte: latNum + range };
      filter['address.longitude'] = { $gte: lngNum - range, $lte: lngNum + range };
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).select('-password');

    const rows = users.map((u, i) => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm text-gray-500">${i + 1}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
              ${escapeHtml(u.name.charAt(0).toUpperCase())}
            </div>
            <a href="/userinfo/${escapeHtml(String(u._id))}" class="text-sm font-medium text-gray-900 hover:text-blue-600">
              ${escapeHtml(u.name)}
            </a>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(u.email)}</td>
        <td class="px-6 py-4 text-xs text-gray-400 font-mono">${u._id}</td>
        <td class="px-6 py-4 text-sm text-gray-500">
          ${u.address?.latitude != null
            ? `📍 ${u.address.latitude.toFixed(5)}, ${u.address.longitude.toFixed(5)}`
            : '<span class="text-gray-300">Sin domicilio</span>'}
        </td>
        <td class="px-6 py-4 text-sm text-gray-500">
          ${new Date(u.createdAt).toLocaleString('es-MX')}
        </td>
      </tr>
    `).join('');

    const content = `
<div class="px-8 py-6">
  <h1 class="text-2xl font-bold text-gray-900">Buscar Ciudadanos</h1>
  <p class="text-sm text-gray-500 mb-4">Filtra por nombre o por radio de ubicación de domicilio</p>

  <div id="map" class="w-full h-72 rounded-xl mb-6 border"></div>

  <form method="GET" class="bg-white p-5 rounded-xl shadow-sm border mb-6 grid grid-cols-4 gap-4">
    <input id="name" type="text" name="name"
      placeholder="Nombre del ciudadano"
      value="${escapeHtml(name || '')}"
      class="border p-2 rounded col-span-2" />

    <input type="number" name="radius"
      placeholder="Radio (metros)"
      value="${escapeHtml(radius || '')}"
      class="border p-2 rounded" />

    <input id="lat" type="hidden" name="lat" value="${escapeHtml(lat || '')}" />
    <input id="lng" type="hidden" name="lng" value="${escapeHtml(lng || '')}" />

    <div class="col-span-4 flex gap-2 items-center">
      <button class="bg-green-600 text-white px-4 py-2 rounded">Buscar</button>
      <a href="/user-search" class="bg-gray-300 px-4 py-2 rounded">Limpiar</a>
      ${lat && lng ? `<span class="text-sm text-gray-500">📍 Centro: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}</span>` : '<span class="text-sm text-gray-400">Haz click en el mapa para buscar por radio</span>'}
    </div>
  </form>

  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    <table class="w-full text-left">
      <thead>
        <tr class="bg-gray-50 text-xs text-gray-500 uppercase">
          <th class="px-6 py-3">#</th>
          <th class="px-6 py-3">Nombre</th>
          <th class="px-6 py-3">Correo</th>
          <th class="px-6 py-3">ID</th>
          <th class="px-6 py-3">Domicilio</th>
          <th class="px-6 py-3">Registrado</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        ${users.length ? rows : `<tr><td colspan="6" class="text-center py-10 text-gray-400">No hay resultados</td></tr>`}
      </tbody>
    </table>
  </div>
</div>

<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([18.4861, -69.9312], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OSM' }).addTo(map);

  let marker;
  map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
  });

  // Si ya hay coords seleccionadas, mostrar el marcador
  const existingLat = ${lat ? `"${lat}"` : 'null'};
  const existingLng = ${lng ? `"${lng}"` : 'null'};
  if (existingLat && existingLng) {
    marker = L.marker([parseFloat(existingLat), parseFloat(existingLng)]).addTo(map);
    map.setView([parseFloat(existingLat), parseFloat(existingLng)], 14);
  }
</script>
`;

    res.send(layout({ title: 'Buscar Ciudadanos', active: 'search', content }));
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
