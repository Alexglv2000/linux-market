#!/bin/bash
# Post-install script for Linux Market (.rpm)
# Configura el Firewall (Firewalld) para permitir tráfico en el puerto 3001

if command -v firewall-cmd > /dev/null; then
    # Verificar si el servicio está activo
    if systemctl is-active --quiet firewalld; then
        echo "🔧 Configurando Firewalld para Linux Market..."
        firewall-cmd --permanent --add-port=3001/tcp || true
        firewall-cmd --reload > /dev/null 2>&1 || true
        echo "✅ Regla de puerto 3001 añadida a Firewalld."
    else
        echo "⚠️ Firewalld detectado pero no está activo."
    fi
else
    echo "⚠️ firewall-cmd no detectado. Si utilizas otro firewall, permite el puerto 3001/TCP."
fi

# 📝 Sincronizar Metainfo (AppStream) para que aparezcan capturas en AppStore
METADATA_SOURCE="/usr/lib/Linux-Market/com.linuxmarket.pos.metainfo.xml"
METADATA_DEST="/usr/share/metainfo"

if [ -f "$METADATA_SOURCE" ]; then
    echo "📝 Registrando metadatos AppStream..."
    mkdir -p "$METADATA_DEST"
    cp "$METADATA_SOURCE" "$METADATA_DEST/"
    echo "✅ Metadatos registrados exitosamente."
else
    echo "⚠️ No se encontró el archivo de metadatos en $METADATA_SOURCE"
fi

exit 0
