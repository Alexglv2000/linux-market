#!/bin/bash
# Script de instalación para Fedora / RHEL / CentOS
# Linux-Market POS Desktop

set -eo pipefail

echo "========================================="
echo "  Linux-Market POS - Instalación Fedora"
echo "========================================="
echo ""

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Por favor ejecuta este script como root o con sudo"
    echo "   sudo bash install-fedora.sh"
    exit 1
fi

echo "📦 Actualizando repositorios..."
dnf update -y

echo "📦 Resolviendo dependencias de WebKit (compatibilidad entre versiones)..."
if dnf list available webkit2gtk4.1-devel &> /dev/null || dnf list installed webkit2gtk4.1-devel &> /dev/null; then
    WEBKIT_PKG="webkit2gtk4.1-devel"
else
    WEBKIT_PKG="webkit2gtk4.0-devel"
    echo "   ⚠️ webkit2gtk4.1-devel no encontrado. Usando versión 4.0."
fi

echo ""
echo "📦 Instalando dependencias del sistema..."
dnf install -y \
    curl \
    wget \
    file \
    openssl-devel \
    gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    $WEBKIT_PKG \
    gcc \
    gcc-c++ \
    make

echo ""
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "   Node.js no encontrado. Instalando Node.js 20 LTS..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
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
echo "📦 Configurando Firewall (Firewalld)..."
if command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
    firewall-cmd --add-port=3001/tcp --permanent
    firewall-cmd --reload
    echo "   ✅ Puerto 3001 permitido para red local."
else
    echo "   ⚠️  Firewall-cmd no encontrado o inactivo. Si utilizas otro Firewall (nftables, iptables, etc.), asegúrate de abrir el puerto 3001/TCP manualmente."
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
echo "   El instalador .rpm estará en:"
echo "   src-tauri/target/release/bundle/rpm/"
echo ""
echo "========================================="
echo "  Instalación completada ✅"
echo "========================================="
