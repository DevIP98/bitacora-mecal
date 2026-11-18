# Script para mantener despierto Supabase (Evita que el proyecto entre en pausa por inactividad)
$supabaseUrl = "https://faghdxupjcbykyiczxam.supabase.co/rest/v1/registros?select=id&limit=1"
$anonKey = "sb_publishable_HiwmXX3UlJIblqxOW0MTxw_mx0bg4_m"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

try {
    $response = Invoke-RestMethod -Uri $supabaseUrl -Headers $headers -Method Get -TimeoutSec 15
    Write-Host "[OK] Supabase respondio correctamente. El proyecto esta activo." -ForegroundColor Green
} catch {
    Write-Host "[ERROR/PAUSADO] No se pudo conectar con Supabase: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Si el proyecto esta en pausa, debes ir a https://supabase.com/dashboard y darle clic a 'Resume project'." -ForegroundColor Yellow
}
