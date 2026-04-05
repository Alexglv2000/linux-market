# Script de instalación para Windows
# Linux-Market POS Desktop
# Ejecutar en PowerShell como Administrador

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Linux-Market POS - Instalación Windows" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Por favor ejecuta PowerShell como Administrador" -ForegroundColor Red
    Write-Host "   Click derecho en PowerShell > Ejecutar como administrador" -ForegroundColor Yellow
    exit 1
}

# Verificar si Chocolatey está instalado
Write-Host "📦 Verificando Chocolatey..." -ForegroundColor Green
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "   Instalando Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
} else {
    Write-Host "   ✅ Chocolatey ya instalado" -ForegroundColor Green
}

# Verificar Node.js
Write-Host ""
Write-Host "📦 Verificando Node.js..." -ForegroundColor Green
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "   Instalando Node.js 20 LTS..." -ForegroundColor Yellow
    choco install nodejs-lts -y
    refreshenv
} else {
    $nodeVersion = node -v
    Write-Host "   ✅ Node.js ya instalado: $nodeVersion" -ForegroundColor Green
}

# Verificar pnpm
Write-Host ""
Write-Host "📦 Verificando pnpm..." -ForegroundColor Green
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "   Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
} else {
    $pnpmVersion = pnpm -v
    Write-Host "   ✅ pnpm ya instalado: $pnpmVersion" -ForegroundColor Green
}

# Verificar Rust
Write-Host ""
Write-Host "📦 Verificando Rust..." -ForegroundColor Green
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "   Instalando Rust..." -ForegroundColor Yellow
    choco install rust -y
    refreshenv
} else {
    $rustVersion = rustc --version
    Write-Host "   ✅ Rust ya instalado: $rustVersion" -ForegroundColor Green
}

# Verificar Visual Studio Build Tools
Write-Host ""
Write-Host "📦 Verificando Visual Studio Build Tools..." -ForegroundColor Green
$vsBuildTools = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -like "*Visual Studio*Build Tools*" }
if (!$vsBuildTools) {
    Write-Host "   ⚠️  Visual Studio Build Tools no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalando componentes necesarios..." -ForegroundColor Yellow
    choco install visualstudio2022buildtools -y
    choco install visualstudio2022-workload-vctools -y
} else {
    Write-Host "   ✅ Visual Studio Build Tools instalado" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Todas las dependencias instaladas correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Abre una nueva terminal PowerShell (para cargar las nuevas variables)"
Write-Host ""
Write-Host "   2. Navega al directorio del proyecto:"
Write-Host "      cd linux-market" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Instala las dependencias del proyecto:"
Write-Host "      pnpm install" -ForegroundColor Yellow
Write-Host ""
Write-Host "   4. Para desarrollo (modo web):"
Write-Host "      pnpm dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "   5. Para desarrollo (aplicación desktop):"
Write-Host "      pnpm desktop" -ForegroundColor Yellow
Write-Host ""
Write-Host "   6. Para compilar la aplicación desktop:"
Write-Host "      pnpm tauri:build:windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "   El instalador .exe estará en:"
Write-Host "   src-tauri\target\release\bundle\nsis\" -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Instalación completada ✅" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
