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
    echo "⚠️ firewall-cmd no detectado. Si utilizas otro firewall (nftables, iptables, etc.), permite el puerto 3001/TCP en tu configuración de red."
fi

exit 0
