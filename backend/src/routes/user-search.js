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
    const { name, lat, lng, radius } = req.query;

    const filter = {};

    // 📍 FILTRO POR RADIO (SIN CAMBIAR SCHEMA)
    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const range = parseFloat(radius) / 111000;

      filter.latitude = {
        $gte: latNum - range,
        $lte: latNum + range,
      };

      filter.longitude = {
        $gte: lngNum - range,
        $lte: lngNum + range,
      };
    }

    const reports = await Report.find(filter)
      .populate('user')
      .sort({ createdAt: -1 });

    const usersMap = new Map();

    for (const r of reports) {
      if (!r.user) continue;

      if (name && !r.user.name.toLowerCase().includes(name.toLowerCase())) {
        continue;
      }

      usersMap.set(r.user._id.toString(), r.user);
    }

    const users = Array.from(usersMap.values());

    const rows = users.map((u, i) => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm text-gray-500">${i + 1}</td>

        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
              ${u.name.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm font-medium text-gray-900">
              ${escapeHtml(u.name)}
            </span>
          </div>
        </td>

        <td class="px-6 py-4 text-sm text-gray-600">
          ${escapeHtml(u.email)}
        </td>

        <td class="px-6 py-4 text-xs text-gray-400 font-mono">
          ${u._id}
        </td>

        <td class="px-6 py-4 text-sm text-gray-500">
          ${new Date(u.createdAt).toLocaleString('es-MX')}
        </td>
      </tr>
    `).join('');

    const content = `
<div class="px-8 py-6">

  <h1 class="text-2xl font-bold text-gray-900">Buscar Usuarios con Mapa</h1>
  <p class="text-sm text-gray-500 mb-4">
    Haz click en el mapa para seleccionar ubicación
  </p>

  <!-- 🗺️ MAPA -->
  <div id="map" class="w-full h-72 rounded-xl mb-6 border"></div>

  <!-- FILTROS -->
  <form method="GET" class="bg-white p-5 rounded-xl shadow-sm border mb-6 grid grid-cols-4 gap-4">

    <input id="name" type="text" name="name"
      placeholder="Nombre"
      value="${name || ''}"
      class="border p-2 rounded" />

    <input id="lat" type="text" name="lat"
      placeholder="Latitud"
      value="${lat || ''}"
      class="border p-2 rounded" />

    <input id="lng" type="text" name="lng"
      placeholder="Longitud"
      value="${lng || ''}"
      class="border p-2 rounded" />

    <input type="number" name="radius"
      placeholder="Radio (metros)"
      value="${radius || ''}"
      class="border p-2 rounded" />

    <div class="col-span-4 flex gap-2">
      <button class="bg-green-600 text-white px-4 py-2 rounded">
        Buscar
      </button>

      <a href="/user-search"
        class="bg-gray-300 px-4 py-2 rounded">
        Limpiar
      </a>
    </div>

  </form>

  <!-- TABLA -->
  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">

    <table class="w-full text-left">

      <thead>
        <tr class="bg-gray-50 text-xs text-gray-500 uppercase">
          <th class="px-6 py-3">#</th>
          <th class="px-6 py-3">Nombre</th>
          <th class="px-6 py-3">Correo</th>
          <th class="px-6 py-3">ID</th>
          <th class="px-6 py-3">Registrado</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-50">
        ${users.length ? rows : `
          <tr>
            <td colspan="5" class="text-center py-10 text-gray-400">
              No hay resultados
            </td>
          </tr>
        `}
      </tbody>

    </table>

  </div>

</div>

<!-- 🧠 MAP SCRIPT -->
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<script>
  const map = L.map('map').setView([18.4861, -69.9312], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'mapa'
  }).addTo(map);

  let marker;

  map.on('click', function(e) {
    const { lat, lng } = e.latlng;

    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng]).addTo(map);
  });
</script>
`;

    res.send(
      layout({
        title: 'Buscar Usuarios (Mapa)',
        active: 'search',
        content
      })
    );

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;