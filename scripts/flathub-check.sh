#!/bin/bash
# Chequeo rápido de preparación para Flathub

echo "🔍 Validando archivos para sumisión a Flathub..."

if [ ! -f "com.linuxmarket.pos.yml" ]; then
    echo "❌ Error: Falta el archivo com.linuxmarket.pos.yml en la raíz."
    exit 1
fi

if [ ! -f "src-tauri/com.linuxmarket.pos.metainfo.xml" ]; then
    echo "❌ Error: Falta el archivo metainfo en src-tauri."
    exit 1
fi

echo "✅ Archivos base encontrados."

echo "🛠️ Verificando utilidades instaladas..."
if ! command -v appstream-util &> /dev/null; then
    echo "⚠️ appstream-util no encontrado. Instálalo con: sudo apt install appstream-util"
else
    echo "📄 Validando Metainfo..."
    appstream-util validate src-tauri/com.linuxmarket.pos.metainfo.xml
fi

echo "🤖 Próximos pasos:"
echo "1. Haz un Fork de https://github.com/flathub/flathub"
echo "2. En tu fork, crea la rama 'add-linux-market' basada en 'new-pr'"
echo "3. Sube SOLAMENTE com.linuxmarket.pos.yml"
echo "4. Abre el PR detallando que es fase experimental."
