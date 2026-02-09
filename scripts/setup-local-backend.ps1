param(
  [string]$Ec2FrontendUrl = "http://3.83.164.82",
  [switch]$StartBackend = $false
)

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command
  )

  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar: $Command (exit code $LASTEXITCODE)"
  }
}

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "api-backend"
$envPath = Join-Path $backendDir ".env"
$templatePath = Join-Path $backendDir ".env.local.postgres.example"

if (-not (Test-Path $templatePath)) {
  throw "Template não encontrado: $templatePath"
}

if (-not (Test-Path $envPath)) {
  Copy-Item $templatePath $envPath -Force
  Write-Host "Criado $envPath a partir de $templatePath"
} else {
  Write-Host "$envPath já existe. Mantendo arquivo atual."
}

$envContent = Get-Content $envPath -Raw
if ($envContent -match '^CORS_ORIGIN=') {
  $lines = $envContent -split "`r?`n"
  $updated = @()
  foreach ($line in $lines) {
    if ($line -like "CORS_ORIGIN=*") {
      $origins = $line.Substring("CORS_ORIGIN=".Length).Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
      if ($origins -notcontains "http://localhost:3000") { $origins += "http://localhost:3000" }
      if ($origins -notcontains $Ec2FrontendUrl) { $origins += $Ec2FrontendUrl }
      $line = "CORS_ORIGIN=" + (($origins | Select-Object -Unique) -join ",")
    }
    $updated += $line
  }
  Set-Content -Path $envPath -Value ($updated -join "`n") -Encoding UTF8
} else {
  Add-Content -Path $envPath -Value "`nCORS_ORIGIN=http://localhost:3000,$Ec2FrontendUrl"
}

Push-Location $root
try {
  $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
  if ($dockerCmd) {
    Write-Host "Subindo PostgreSQL local (docker compose)..."
    Invoke-CheckedCommand "docker compose up -d db"
  } else {
    Write-Warning "Docker não encontrado. Suba o PostgreSQL manualmente e depois rode db:health/db:migrate."
  }

  Write-Host "Instalando dependências do backend..."
  Invoke-CheckedCommand "npm --prefix api-backend ci"

  $dbReady = $true
  try {
    Write-Host "Validando conexão com banco local..."
    Invoke-CheckedCommand "npm --prefix api-backend run db:health"
  }
  catch {
    $dbReady = $false
    Write-Warning "Falha ao conectar no PostgreSQL local. Verifique DB_HOST/DB_PORT e se o serviço está ativo."
  }

  if ($dbReady) {
    Write-Host "Aplicando migração local..."
    Invoke-CheckedCommand "npm --prefix api-backend run db:migrate"
  } else {
    Write-Warning "Migração não aplicada porque o banco local não está acessível."
  }

  if ($StartBackend) {
    Write-Host "Iniciando backend local em modo desenvolvimento..."
    Invoke-CheckedCommand "npm --prefix api-backend run dev"
  } else {
    Write-Host "Backend local preparado. Para iniciar: npm --prefix api-backend run dev"
  }
}
finally {
  Pop-Location
}
