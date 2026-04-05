#!/bin/bash
# Script de instalación para Linux Mint / Debian / Ubuntu
# Linux-Market POS Desktop

set -eo pipefail

echo "========================================="
echo "  Linux-Market POS - Instalación Debian"
echo "========================================="
echo ""

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Por favor ejecuta este script como root o con sudo"
    echo "   sudo bash install-debian.sh"
    exit 1
fi

echo "📦 Actualizando repositorios..."
apt update

echo "📦 Resolviendo dependencias de WebKit (compatibilidad entre versiones)..."
if apt-cache show libwebkit2gtk-4.1-dev &> /dev/null; then
    WEBKIT_PKG="libwebkit2gtk-4.1-dev"
else
    WEBKIT_PKG="libwebkit2gtk-4.0-dev"
    echo "   ⚠️ libwebkit2gtk-4.1-dev no encontrado. Usando versión 4.0 (ideal para Ubuntu 22.04 / Debian 11 o inferior)."
fi

echo ""
echo "📦 Instalando dependencias del sistema..."
apt install -y \
    curl \
    wget \
    file \
    build-essential \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    $WEBKIT_PKG


echo ""
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "   Node.js no encontrado. Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js ya instalado: $NODE_VERSION"
fi

echo ""
echo "📦 Verificando pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "   Instalando pnpm (via corepack)..."
    corepack enable pnpm
else
    PNPM_VERSION=$(pnpm -v)
    echo "   ✅ pnpm ya instalado: $PNPM_VERSION"
fi

echo ""
echo "📦 Verificando Rust..."
if ! command -v rustc &> /dev/null; then
    echo "   Rust no encontrado. Instalando Rust..."
    # Instalar como usuario normal, no root
    if [ -n "$SUDO_USER" ]; then
        su - "$SUDO_USER" -c "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
    else
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    fi
else
    RUST_VERSION=$(rustc --version)
    echo "   ✅ Rust ya instalado: $RUST_VERSION"
fi

echo ""
echo "📦 Configurando Firewall (UFW)..."
if command -v ufw &> /dev/null && systemctl is-active --quiet ufw; then
    ufw allow 3001/tcp
    echo "   ✅ Puerto 3001 permitido para red local."
else
    echo "⚠️ UFW no detectado. Si utilizas otro firewall (nftables, iptables, etc.), permite el puerto 3001/TCP manualmente para la red local."
fi

echo ""
echo "✅ Todas las dependencias instaladas correctamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   0. Ejecuta 'source ~/.cargo/env' para habilitar Rust en tu terminal actual."
echo "   1. Navega al directorio del proyecto:"
echo "      cd linux-market"
echo ""
echo "   2. Instala las dependencias del proyecto:"
echo "      pnpm install"
echo ""
echo "   3. Para desarrollo (modo web):"
echo "      pnpm dev"
echo ""
echo "   4. Para desarrollo (aplicación desktop):"
echo "      pnpm desktop"
echo ""
echo "   5. Para compilar la aplicación desktop:"
echo "      pnpm tauri:build:linux"
echo ""
echo "   El instalador .deb estará en:"
echo "   src-tauri/target/release/bundle/deb/"
echo ""
echo "========================================="
echo "  Instalación completada ✅"
echo "========================================="
