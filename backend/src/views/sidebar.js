function sidebar(active) {
  const link = (key, href, label) => `
    <a href="${href}"
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition
      ${active === key
        ? 'bg-green-50 text-green-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
      }">
      ${label}
    </a>
  `;

  return `
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">

    <!-- HEADER -->
    <div class="px-6 py-5 border-b border-gray-100">
      <div class="text-lg font-bold">🗑️ TrashReport</div>
      <p class="text-xs text-gray-400">Admin Panel</p>
    </div>

    <!-- NAV -->
    <nav class="flex-1 px-4 py-4 space-y-2">
      ${link('users', '/admin', '👤 Usuarios')}
      ${link('reports', '/admin/reports', '📄 Reportes')}
      ${link('search', '/user-search', '🔍 Buscar Usuarios')}
      ${link('docs', '/api/docs', '📚 API Docs')}
    </nav>

    <!-- FOOTER -->
    <div class="px-4 py-4 border-t border-gray-100 text-xs text-gray-400">
      MongoDB conectado
    </div>

  </aside>
  `;
}

module.exports = sidebar;