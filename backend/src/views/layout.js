const sidebar = require('./sidebar');

function layout({ title, active, content }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gray-100">

<div class="flex h-screen">

  ${sidebar(active)}

  <main class="flex-1 p-8 overflow-auto">
    ${content}
  </main>

</div>

</body>
</html>
`;
}

module.exports = layout;