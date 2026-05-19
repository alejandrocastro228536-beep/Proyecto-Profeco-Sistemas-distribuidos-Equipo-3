# Ejecuta docker/seed-data.sql contra el contenedor profeco-postgres.
# Uso (desde la raiz del repo o desde docker\):
#   .\docker\seed.ps1
#
# Es idempotente: se puede correr varias veces sin duplicar datos.

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile   = Join-Path $scriptDir "seed-data.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Error "No se encontro $sqlFile"
    exit 1
}

# Verifica que el contenedor este corriendo
$running = docker ps --filter "name=profeco-postgres" --format "{{.Names}}"
if (-not $running) {
    Write-Error "El contenedor profeco-postgres no esta corriendo. Ejecuta primero: docker compose up -d"
    exit 1
}

Write-Host "Aplicando seed-data.sql a profeco-postgres..." -ForegroundColor Cyan
Get-Content $sqlFile -Raw | docker exec -i profeco-postgres psql -U postgres -v ON_ERROR_STOP=1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Seed aplicado correctamente." -ForegroundColor Green
} else {
    Write-Error "El seed termino con errores (exit code $LASTEXITCODE)."
    exit $LASTEXITCODE
}
