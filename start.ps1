# ===========================================================
#   TRASH REPORT - INICIAR TODO
#   Doble click en este archivo o corre: .\start.ps1
# ===========================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = "$ROOT\backend"
$MOBILE  = "$ROOT\mobile\trash-report-app"

# ── Detectar IP ──────────────────────────────────────────────
$IP = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" } |
  Sort-Object -Property PrefixLength |
  Select-Object -First 1
).IPAddress

if ($IP) {
  # Actualizar IP en api.ts automáticamente
  $apiFile = "$MOBILE\services\api.ts"
  if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    $content = $content -replace "http://[\d\.]+:3000/api", "http://${IP}:3000/api"
    Set-Content $apiFile $content -NoNewline
    Write-Host "IP actualizada: $IP" -ForegroundColor Green
  }
}

# ── Abrir backend ────────────────────────────────────────────
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$BACKEND'; Write-Host '=== BACKEND ===' -ForegroundColor Cyan; npm run dev"
)

Start-Sleep -Seconds 2

# ── Abrir expo ───────────────────────────────────────────────
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$MOBILE'; Write-Host '=== EXPO (escanea el QR) ===' -ForegroundColor Cyan; npx expo start"
)

Write-Host ""
Write-Host "Listo. Se abrieron 2 terminales." -ForegroundColor Green
Write-Host "Escanea el QR con Expo Go en tu celular." -ForegroundColor White
