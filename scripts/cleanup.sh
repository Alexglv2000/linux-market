#!/bin/bash

# Script de limpieza para Linux-Market POS
# Elimina archivos temporales y basura sin afectar la funcionalidad del código fuente.

echo "🧹 Iniciando limpieza profunda del proyecto..."

# 1. Limpieza de Rust/Tauri (Artefactos de compilación masivos)
if [ -d "src-tauri/target" ]; then
    echo "🗑️  Eliminando caché de Rust intermedia..."
    rm -rf src-tauri/target/debug
    rm -rf src-tauri/target/release/build
    rm -rf src-tauri/target/release/deps
    rm -rf src-tauri/target/release/incremental
    rm -rf src-tauri/target/release/.fingerprint
else
    echo "✨ La caché de Rust ya está limpia."
fi

# 2. Limpieza de Next.js
echo "🗑️  Eliminando caché de Next.js (.next/cache)..."
rm -rf .next/cache

# 3. Limpieza de builds de Frontend (regenerables con pnpm build)
echo "🗑️  Eliminando cachés de módulos temporales..."
rm -rf node_modules/.cache

# 4. Eliminar archivos de sistema y logs
echo "🗑️  Eliminando archivos basura y logs..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
find . -name "npm-debug.log*" -type f -delete
find . -name "yarn-error.log*" -type f -delete
find . -name "pnpm-debug.log*" -type f -delete

# 5. Informar espacio liberado (aproximado)
echo "✅ Limpieza completada con éxito."
echo "💡 Recuerda: La próxima vez que compiles el proyecto tardará un poco más, pero tu código fuente está intacto."
