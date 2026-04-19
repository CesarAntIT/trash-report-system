# ===========================================================
#   TRASH REPORT - INICIAR TODO
#   Doble click en este archivo o corre: .\start.ps1
# ===========================================================

$ROOT    = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = "$ROOT\backend"
$MOBILE  = "$ROOT\mobile\trash-report-app"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   TRASH REPORT - Iniciando proyecto..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Crear .env si no existe ───────────────────────────────
$envFile = "$BACKEND\.env"
$envExample = "$BACKEND\.env.example"

if (-not (Test-Path $envFile)) {
  Write-Host "[1/4] Configurando .env del backend..." -ForegroundColor Yellow

  if (Test-Path $envExample) {
    Copy-Item $envExample $envFile
  }

  Write-Host ""
  Write-Host "  Necesitas la URL de tu base de datos MongoDB Atlas." -ForegroundColor White
  Write-Host "  Ejemplo: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/trash-report" -ForegroundColor Gray
  Write-Host ""
  $mongoUri = Read-Host "  Pega aqui tu MONGODB_URI"

  if ($mongoUri -ne "") {
    $envContent = Get-Content $envFile -Raw
    $envContent = $envContent -replace "MONGODB_URI=.*", "MONGODB_URI=$mongoUri"
    Set-Content $envFile $envContent -NoNewline
    Write-Host "  .env configurado correctamente." -ForegroundColor Green
  } else {
    Write-Host "  AVISO: No ingresaste URI. Edita backend\.env manualmente antes de iniciar." -ForegroundColor Red
  }
} else {
  Write-Host "[1/4] .env ya existe. Saltando configuracion." -ForegroundColor Green
}

# ── 2. Instalar dependencias del backend ─────────────────────
Write-Host ""
Write-Host "[2/4] Verificando dependencias del backend..." -ForegroundColor Yellow

if (-not (Test-Path "$BACKEND\node_modules")) {
  Write-Host "  Instalando paquetes del backend (npm install)..." -ForegroundColor White
  Push-Location $BACKEND
  npm install | Out-Null
  Pop-Location
  Write-Host "  Backend listo." -ForegroundColor Green
} else {
  Write-Host "  node_modules del backend ya existen. OK." -ForegroundColor Green
}

# ── 3. Instalar dependencias del mobile ──────────────────────
Write-Host ""
Write-Host "[3/4] Verificando dependencias del mobile..." -ForegroundColor Yellow

if (-not (Test-Path "$MOBILE\node_modules")) {
  Write-Host "  Instalando paquetes del mobile (npm install)..." -ForegroundColor White
  Push-Location $MOBILE
  npm install | Out-Null
  Pop-Location
  Write-Host "  Mobile listo." -ForegroundColor Green
} else {
  Write-Host "  node_modules del mobile ya existen. OK." -ForegroundColor Green
}

# ── 4. Detectar IP y actualizar api.ts ───────────────────────
Write-Host ""
Write-Host "[4/4] Detectando IP de red local..." -ForegroundColor Yellow

$IP = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" } |
  Sort-Object -Property PrefixLength |
  Select-Object -First 1
).IPAddress

if ($IP) {
  $apiFile = "$MOBILE\services\api.ts"
  if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    $content = $content -replace "http://[\d\.]+:3000/api", "http://${IP}:3000/api"
    Set-Content $apiFile $content -NoNewline
    Write-Host "  IP actualizada a: $IP" -ForegroundColor Green
  }
} else {
  Write-Host "  No se pudo detectar la IP. Edita api.ts manualmente." -ForegroundColor Red
}

# ── Abrir regla de firewall (silencioso) ─────────────────────
netsh advfirewall firewall add rule name="TrashReport" dir=in action=allow protocol=TCP localport=3000 | Out-Null

# ── Lanzar backend ───────────────────────────────────────────
Write-Host ""
Write-Host "Iniciando backend (puerto 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$BACKEND'; Write-Host '=== BACKEND (puerto 3000) ===' -ForegroundColor Cyan; npm run dev"
)

Start-Sleep -Seconds 2

# ── Lanzar Expo ──────────────────────────────────────────────
Write-Host "Iniciando Expo..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$MOBILE'; Write-Host '=== EXPO (escanea el QR) ===' -ForegroundColor Cyan; npx expo start"
)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Todo listo. Se abrieron 2 terminales." -ForegroundColor Green
Write-Host "  Escanea el QR con Expo Go en tu celular." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
