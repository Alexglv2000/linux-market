#!/bin/bash
set -e

# Asegurar que el script se ejecuta desde la raíz del proyecto
cd "$(dirname "$0")/.."
echo "📂 Trabajando desde la raíz del proyecto: $(pwd)"

# 0. Limpieza profunda para liberar espacio
echo "🧹 Limpiando archivos de compilaciones anteriores..."
rm -rf out/
rm -rf dist/
rm -rf dist-server-bundle/
rm -rf src-tauri/target/release/bundle/
rm -rf public/downloads/debian/*
rm -rf public/downloads/fedora/*
rm -rf public/downloads/arch/*

# 1. Asegurar dependencias frescas e instalar
echo "📦 Instalando dependencias..."
pnpm install

# 1.5. COMPATIBILIDAD CRÍTICA: Reconstruir módulos nativos para el Node del sistema (/usr/bin/node)
if [ -f "/usr/bin/node" ]; then
    echo "⚙️  Forzando reconstrucción agresiva para Node $(/usr/bin/node -v) (Sistema)..."
    # Borrar binarios previos para evitar conflictos
    rm -rf node_modules/better-sqlite3/build
    
    # Ejecutar reconstrucción forzando el PATH al Node del sistema
    PATH="/usr/bin:$PATH" /usr/bin/node /usr/bin/npm rebuild better-sqlite3 --build-from-source
    
    # Verificar si se generó correctamente
    if [ -f "node_modules/better-sqlite3/build/Release/better_sqlite3.node" ]; then
        echo "✅ Binario nativo generado exitosamente para el sistema."
    else
        echo "❌ Falló la generación del binario nativo."
        exit 1
    fi
else
    echo "⚠️  No se encontró /usr/bin/node. Saltando reconstrucción forzada del sistema."
fi

# 2. Crear enlaces simbólicos temporales para que Next.js vea las rutas del POS
echo "📂 Enlazando carpetas del POS..."
rm -f app/api app/central app/store app/superadmin

ln -s "$(pwd)/src/pos-app/api" app/api
ln -s "$(pwd)/src/pos-app/central" app/central
ln -s "$(pwd)/src/pos-app/store" app/store
ln -s "$(pwd)/src/pos-app/superadmin" app/superadmin

# 2. Ejecutar build de Next.js (esto generará out/ limpio)
echo "🏗️  Compilando Frontend (Next.js)..."
pnpm build

# 2.1. PREVENCIÓN DE BUCLE: Eliminar instaladores de out/ antes de empaquetar
# Si existen instaladores en public/downloads, Next los copia a out/.
# Los borramos de out/ para que Tauri NO los meta dentro del nuevo binario.
if [ -d "out/downloads" ]; then
    echo "🧹 Excluyendo carpeta de descargas del empaquetado final..."
    rm -rf out/downloads/
fi

# 2.5. Empaquetar Servidor con NCC
echo "📦 Optimizando Servidor API (NCC)..."
npx @vercel/ncc build server.js -o dist-server-bundle -e better-sqlite3

# 3. Ejecutar build de Tauri (sin repetir build de frontend y con límite de memoria)
echo "📦 Generando instaladores nativos (.deb, .rpm)..."
# CARGO_BUILD_JOBS=1 evita el error OOM/SIGKILL al compilar Rust
CARGO_BUILD_JOBS=1 pnpm tauri build 

# 4. Generar Tarball manual (.tar.gz) optimizado
echo "🗜️ Generando Tarball (.tar.gz) optimizado..."
BUILD_NAME="linux-market-pos-v1.2.3"
mkdir -p "dist/$BUILD_NAME"
cp src-tauri/target/release/linux-market "dist/$BUILD_NAME/"
cp dist-server-bundle/index.js "dist/$BUILD_NAME/server.js"
cp package.json "dist/$BUILD_NAME/"
mkdir -p "dist/$BUILD_NAME/node_modules"
cp -r node_modules/better-sqlite3 "dist/$BUILD_NAME/node_modules/"
cp -r out "dist/$BUILD_NAME/"
cd dist
tar -czf "$BUILD_NAME.tar.gz" "$BUILD_NAME"
rm -rf "$BUILD_NAME"
cd ..

# 5. Actualizar Carpeta de Descargas de la Landing Page
echo "📡 Sincronizando instaladores con la Landing Page..."
mkdir -p "public/downloads/debian"
mkdir -p "public/downloads/fedora"
mkdir -p "public/downloads/arch"

# Copiar Debian
CP_DEB=$(find src-tauri/target/release/bundle/deb/ -name "*.deb" | head -n 1)
if [ -n "$CP_DEB" ]; then
    cp "$CP_DEB" "public/downloads/debian/linux-market.deb"
    echo "✅ DEB actualizado en landing page."
fi

# Copiar Fedora
CP_RPM=$(find src-tauri/target/release/bundle/rpm/ -name "*.rpm" | head -n 1)
if [ -n "$CP_RPM" ]; then
    cp "$CP_RPM" "public/downloads/fedora/linux-market.rpm"
    echo "✅ RPM actualizado en landing page."
fi

# Copiar Tarball (Arch)
if [ -f "dist/$BUILD_NAME.tar.gz" ]; then
    cp "dist/$BUILD_NAME.tar.gz" "public/downloads/arch/linux-market.tar.gz"
    echo "✅ Tarball actualizado en landing page."
fi

# 6. Sincronizar también con la carpeta de salida (out/) si existe para el servidor en vivo
if [ -d "out" ]; then
    echo "📡 Sincronizando también con carpeta 'out/' para servidor activo..."
    mkdir -p out/downloads/debian out/downloads/fedora out/downloads/arch
    cp -r public/downloads/* out/downloads/
    echo "✅ Carpeta 'out/downloads' sincronizada."
fi

echo "✅ Build Nativo completado con éxito!"
echo "📂 Instaladores: src-tauri/target/release/bundle/"
echo "📂 Tarball: dist/$BUILD_NAME.tar.gz"
echo "🌐 Landing Page lista para descargas."
