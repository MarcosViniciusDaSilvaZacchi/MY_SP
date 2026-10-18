Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Parando MY Service Parking...         " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ports = @(3000, 3001, 3002, 3003, 3004, 3005, 5173)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Write-Host "Encerrando processo $p na porta $port..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Todos os serviços foram finalizados!   " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
