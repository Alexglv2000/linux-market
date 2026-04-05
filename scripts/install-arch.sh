#!/bin/bash
# Script de instalación para Arch Linux / Manjaro / EndeavourOS
# Linux-Market POS Desktop

set -eo pipefail

echo "========================================="
echo "  Linux-Market POS - Instalación Arch"
echo "========================================="
echo ""

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo "Por favor ejecuta este script como root o con sudo"
    echo "   sudo bash install-arch.sh"
    exit 1
fi

echo "Actualizando repositorios..."
pacman -Syu --noconfirm

echo ""
echo "Instalando dependencias del sistema..."
pacman -S --noconfirm --needed \
    curl \
    wget \
    base-devel \
    openssl \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    webkit2gtk-4.1 \
    gcc \
    make \
    git

echo ""
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "   Node.js no encontrado. Instalando Node.js (nodejs-lts)..."
    pacman -S --noconfirm nodejs npm
else
    NODE_VERSION=$(node -v)
    echo "   Node.js ya instalado: $NODE_VERSION"
fi

echo ""
echo "Verificando pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "   Instalando pnpm (via corepack)..."
    corepack enable pnpm
else
    PNPM_VERSION=$(pnpm -v)
    echo "   pnpm ya instalado: $PNPM_VERSION"
fi

echo ""
echo "Verificando Rust..."
if ! command -v rustc &> /dev/null; then
    echo "   Rust no encontrado. Instalando Rust via rustup..."
    pacman -S --noconfirm rustup
    # Instalar toolchain stable como usuario normal
    if [ -n "$SUDO_USER" ]; then
        su - "$SUDO_USER" -c "rustup default stable"
    else
        rustup default stable
    fi
else
    RUST_VERSION=$(rustc --version)
    echo "   Rust ya instalado: $RUST_VERSION"
fi

echo ""
echo "Configurando Firewall (UFW)..."
if command -v ufw &> /dev/null && systemctl is-active --quiet ufw; then
    ufw allow 3001/tcp
    echo "   ✅ Puerto 3001 permitido para red local."
else
    echo "   ⚠️  UFW no encontrado o inactivo. Si utilizas otro Firewall (nftables, iptables, etc.), asegúrate de abrir el puerto 3001/TCP manualmente."
fi

echo ""
echo "Todas las dependencias instaladas correctamente!"
echo ""
echo "Proximos pasos:"
echo "   1. Navega al directorio del proyecto:"
echo "      cd linux-market"
echo ""
echo "   2. Instala las dependencias del proyecto:"
echo "      pnpm install"
echo ""
echo "   3. Para desarrollo (modo web):"
echo "      pnpm dev"
echo ""
echo "   4. Para desarrollo (aplicacion desktop):"
echo "      pnpm desktop"
echo ""
echo "   5. Para compilar la aplicacion desktop:"
echo "      pnpm tauri:build"
echo ""
echo "   El paquete AppImage / binario estar en:"
echo "   src-tauri/target/release/bundle/"
echo ""
echo "========================================="
echo "  Instalacion completada"
echo "========================================="
