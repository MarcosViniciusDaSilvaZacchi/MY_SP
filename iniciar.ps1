$ROOT = $PSScriptRoot
if (-not $ROOT) { $ROOT = (Get-Location).Path }

$host.ui.RawUI.WindowTitle = "MY Service Parking - Console Unificado"
node "$ROOT\iniciar.js" @args
