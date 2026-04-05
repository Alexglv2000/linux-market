#!/bin/bash
# Script de verificación de requisitos del sistema
# Linux-Market POS

echo "========================================="
echo "  Verificación de Sistema - Linux-Market"
echo "========================================="
echo ""

ERRORS=0
WARNINGS=0

# Función para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        VERSION=$($1 $2 2>&1 | head -n 1)
        echo "✅ $3: $VERSION"
        return 0
    else
        echo "❌ $3: No instalado"
        ((ERRORS++))
        return 1
    fi
}

# Verificar Node.js
echo "📦 Verificando dependencias..."
echo ""
if check_command "node" "--version" "Node.js"; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "   ⚠️  Se recomienda Node.js 18 o superior"
        ((WARNINGS++))
    fi
fi

# Verificar npm
check_command "npm" "--version" "npm"

# Verificar pnpm
if ! check_command "pnpm" "--version" "pnpm"; then
    echo "   ℹ️  Puedes instalarlo con: npm install -g pnpm"
fi

# Verificar Rust (solo para desktop)
echo ""
echo "📦 Dependencias para aplicación desktop:"
if check_command "rustc" "--version" "Rust"; then
    check_command "cargo" "--version" "Cargo"
else
    echo "   ℹ️  Solo necesario para compilar la app desktop"
    echo "   Instalar: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi

# Verificar dependencias de sistema Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "📦 Dependencias del sistema Linux:"
    
    # Detectar distribución
    if [ -f /etc/debian_version ]; then
        DISTRO="Debian/Ubuntu/Mint"
        PKG_MANAGER="apt"
        
        # Resolver WebKit Dinámicamente para Ubuntu 22 vs 24
        if apt-cache show libwebkit2gtk-4.1-dev &> /dev/null; then
            WEBKIT_PKG="libwebkit2gtk-4.1-dev"
        else
            WEBKIT_PKG="libwebkit2gtk-4.0-dev"
        fi
        
        # Verificar paquetes Debian
        for pkg in $WEBKIT_PKG libgtk-3-dev build-essential; do
            if dpkg -l | grep -q "^ii  $pkg"; then
                echo "✅ $pkg"
            else
                echo "❌ $pkg: No instalado"
                ((ERRORS++))
            fi
        done
        
    elif [ -f /etc/fedora-release ] || [ -f /etc/redhat-release ]; then
        DISTRO="Fedora/RHEL"
        PKG_MANAGER="dnf"
        
        # Resolver WebKit Dinámicamente para RHEL
        if dnf list available webkit2gtk4.1-devel &> /dev/null || dnf list installed webkit2gtk4.1-devel &> /dev/null; then
            WEBKIT_PKG="webkit2gtk4.1-devel"
        else
            WEBKIT_PKG="webkit2gtk4.0-devel"
        fi
        
        # Verificar paquetes Fedora
        for pkg in $WEBKIT_PKG gtk3-devel gcc gcc-c++; do
            if rpm -q $pkg &> /dev/null; then
                echo "✅ $pkg"
            else
                echo "❌ $pkg: No instalado"
                ((ERRORS++))
            fi
        done
    else
        echo "⚠️  Distribución no identificada automáticamente"
        DISTRO="Desconocida"
    fi
    
    echo "   Distribución detectada: $DISTRO"
fi

# Resumen
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Sistema listo para Linux-Market!"
    echo "   Puedes ejecutar: pnpm install && pnpm desktop"
elif [ $ERRORS -eq 0 ]; then
    echo "✅ Sistema funcional con $WARNINGS advertencia(s)"
    echo "   El sistema funcionará pero considera actualizar"
else
    echo "⚠️  Se encontraron $ERRORS error(es) y $WARNINGS advertencia(s)"
    echo ""
    echo "Para instalar dependencias ejecuta:"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            echo "   sudo bash scripts/install-debian.sh"
        elif [ -f /etc/fedora-release ] || [ -f /etc/redhat-release ]; then
            echo "   sudo bash scripts/install-fedora.sh"
        fi
    fi
fi
echo "========================================="
