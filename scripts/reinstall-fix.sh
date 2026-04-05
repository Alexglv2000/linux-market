#!/bin/bash
# Script de limpieza profunda y reinstalación para Linux-Market POS
# Propósito: Desinstalar completamente, limpiar cachés del SO y del proyecto, y reconstruir.

set -e

echo "🛑 Deteniendo procesos antiguos..."
pkill -f linux-market || true
pkill -f next-server || true
pkill -f node || true

echo "🗑️  Desinstalando del sistema..."
sudo rm -f /usr/bin/linux-market
sudo rm -f /usr/share/applications/linux-market.desktop
sudo rm -f /usr/local/bin/linux-market
sudo rm -f /usr/share/pixmaps/linux-market.png
sudo rm -f /usr/share/icons/hicolor/*/apps/linux-market.*

echo "🧹 Limpiando cachés de la aplicación (usuario)..."
rm -rf ~/.cache/com.linuxmarket.pos
rm -rf ~/.local/share/com.linuxmarket.pos
rm -rf ~/.config/com.linuxmarket.pos
rm -rf ~/.cache/linux-market
rm -rf ~/.local/share/linux-market

echo "📦 Limpiando cachés del Sistema Operativo..."
if command -v pacman &> /dev/null; then
    echo "   Arch Linux detectado: Limpiando caché de pacman..."
    sudo pacman -Sc --noconfirm
fi
if command -v apt-get &> /dev/null; then
    echo "   Debian/Ubuntu detectado: Limpiando caché de apt..."
    sudo apt-get clean
fi

echo "🏗️  Limpiando proyecto local..."
# Usar el script de limpieza existente más agresivo
rm -rf .next
rm -rf node_modules/.cache
rm -rf out
rm -rf src-tauri/target

echo "✨ Limpieza profunda completada."

echo "🚀 Reinstalando dependencias..."
pnpm install

echo "🛠️  Construyendo aplicación..."
pnpm build
pnpm tauri:build

echo "✅ Instalando versión fresca..."
# Si se generó un binario de Tauri, colocarlo en /usr/bin
if [ -f "src-tauri/target/release/linux-market" ]; then
    sudo cp src-tauri/target/release/linux-market /usr/bin/linux-market
    sudo chmod +x /usr/bin/linux-market
    
    # Copiar el desktop file
    if [ -f "linux-market.desktop" ]; then
        sudo cp linux-market.desktop /usr/share/applications/
    fi
    echo "🎉 Instalación completada con éxito!"
else
    echo "❌ No se encontró el binario compilado en src-tauri/target/release/linux-market"
    echo "   Revisa los logs del build arriba."
fi
