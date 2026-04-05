#!/bin/bash
# Linux-Market POS — Script de Diagnóstico de Emergencia
# Si el programa principal no inicia el servidor, usa este script.

echo "🔍 Iniciando diagnóstico de Linux-Market..."

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado o no está en el PATH."
    echo "💡 Intenta: sudo apt install nodejs"
else
    echo "✅ Node.js detectado: $(node -v)"
fi

# 2. Verificar Puerto 3001
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ El puerto 3001 ya está en uso. El servidor probablemente ya corre."
else
    echo "⚠️ El puerto 3001 está libre. El servidor NO está corriendo."
fi

# 3. Intentar Inicio Manual
echo "🚀 Intentando iniciar el servidor manualmente para pruebas..."
SERVER_PATH="/usr/lib/Linux-Market/_up_/dist-server-bundle/index.js"

if [ -f "$SERVER_PATH" ]; then
    echo "📂 Ejecutando bundle en: $SERVER_PATH"
    cd "/usr/lib/Linux-Market/_up_/"
    node "$SERVER_PATH"
else
    echo "❌ Error: No se encontró el bundle del servidor en $SERVER_PATH"
fi
