#!/usr/bin/env bash
# ============================================================
# Linux-Market POS Local v1.1.0 Stable - Instalador Inteligente
# Detecta la distribucion, instala dependencias, configura
# el servicio systemd y arranca el servidor automaticamente.
#
# Uso: sudo bash install.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[POS]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[!]${NC}   $*"; }
error()   { echo -e "${RED}[ERR]${NC} $*" >&2; exit 1; }

# ── Verificar root ───────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Ejecuta este script con sudo: sudo bash install.sh"

# ── Detectar distribucion ────────────────────────────────────
detect_distro() {
  if   [[ -f /etc/os-release ]]; then . /etc/os-release; echo "${ID:-unknown}"
  elif [[ -f /etc/arch-release ]];   then echo "arch"
  elif [[ -f /etc/debian_version ]]; then echo "debian"
  elif [[ -f /etc/fedora-release ]]; then echo "fedora"
  elif [[ -f /etc/centos-release ]]; then echo "centos"
  else echo "unknown"
  fi
}

DISTRO=$(detect_distro)
info "Distribucion detectada: ${DISTRO}"

# ── Instalar Node.js 20 LTS ──────────────────────────────────
install_node() {
  if command -v node &>/dev/null && [[ $(node -e "process.exit(+process.version.slice(1).split('.')[0]>=18?0:1)" 2>/dev/null; echo $?) -eq 0 ]]; then
    success "Node.js $(node -v) ya instalado"
    return
  fi
  info "Instalando Node.js 20 LTS..."
  case "$DISTRO" in
    debian|ubuntu|linuxmint|pop|elementary|kali)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
      ;;
    fedora)
      dnf install -y nodejs npm
      ;;
    centos|rhel|rocky|almalinux)
      dnf install -y curl
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      dnf install -y nodejs
      ;;
    arch|manjaro|endeavouros|garuda)
      pacman -S --noconfirm nodejs npm
      ;;
    opensuse*|suse*)
      zypper install -y nodejs20 npm20
      ;;
    *)
      warn "Distribucion no reconocida. Intenta instalar Node.js 18+ manualmente."
      warn "Visita: https://nodejs.org/en/download"
      ;;
  esac
  success "Node.js $(node -v) instalado"
}

# ── Instalar dependencias del sistema ────────────────────────
install_system_deps() {
  info "Instalando dependencias del sistema..."
  case "$DISTRO" in
    debian|ubuntu|linuxmint|pop|elementary|kali)
      apt-get update -qq
      apt-get install -y build-essential python3 curl git
      ;;
    fedora)
      dnf install -y gcc-c++ make python3 curl git
      ;;
    centos|rhel|rocky|almalinux)
      dnf groupinstall -y "Development Tools"
      dnf install -y python3 curl git
      ;;
    arch|manjaro|endeavouros|garuda)
      pacman -S --noconfirm base-devel python curl git
      ;;
    opensuse*|suse*)
      zypper install -y -t pattern devel_C_C++
      zypper install -y python3 curl git
      ;;
  esac
  success "Dependencias del sistema instaladas"
}

# ── Instalar dependencias del proyecto ───────────────────────
install_project() {
  INSTALL_DIR="${1:-/opt/linux-market-pos}"
  info "Directorio de instalacion: $INSTALL_DIR"

  # Copiar archivos del proyecto
  mkdir -p "$INSTALL_DIR"
  cp -r "$(dirname "$0")/../." "$INSTALL_DIR/"

  # Instalar dependencias Node
  cd "$INSTALL_DIR"
  info "Instalando dependencias de Node.js..."
  npm install --production
  success "Dependencias instaladas"

  # Compilar better-sqlite3 en la maquina destino
  info "Compilando modulo SQLite nativo..."
  npm rebuild better-sqlite3
  success "SQLite compilado correctamente"
}

# ── Configurar servicio systemd ──────────────────────────────
setup_systemd() {
  INSTALL_DIR="${1:-/opt/linux-market-pos}"
  SERVICE_FILE="/etc/systemd/system/linux-market-pos.service"
  NODE_BIN=$(command -v node)

  info "Configurando servicio systemd..."
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Linux-Market POS Local Server
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
ExecStart=${NODE_BIN} backend/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=DB_PATH=${INSTALL_DIR}/database/pos.db
StandardOutput=append:/var/log/linux-market-pos.log
StandardError=append:/var/log/linux-market-pos-error.log
User=root

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable linux-market-pos
  systemctl restart linux-market-pos
  success "Servicio systemd configurado y activo"
}

# ── Obtener IP local ─────────────────────────────────────────
get_local_ip() {
  ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I | awk '{print $1}'
}

# ── Ejecucion principal ──────────────────────────────────────
main() {
  echo ""
  echo -e "${CYAN}============================================${NC}"
  echo -e "${CYAN}  Linux-Market POS v1.1.0 Stable - Instalador${NC}"
  echo -e "${CYAN}============================================${NC}"
  echo ""

  INSTALL_DIR="/opt/linux-market-pos"

  install_system_deps
  install_node
  install_project "$INSTALL_DIR"
  setup_systemd   "$INSTALL_DIR"

  LOCAL_IP=$(get_local_ip)

  echo ""
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  Instalacion completada exitosamente${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo ""
  echo -e "  ${CYAN}Accede al POS desde cualquier dispositivo en tu red:${NC}"
  echo -e "  ${YELLOW}http://${LOCAL_IP}:3001${NC}"
  echo ""
  echo -e "  Credenciales iniciales:"
  echo -e "  Usuario:    ${YELLOW}admin${NC}"
  echo -e "  Contrasena: ${YELLOW}admin123${NC}"
  echo ""
  echo -e "  ${CYAN}Comandos utiles:${NC}"
  echo -e "  Ver estado:  systemctl status linux-market-pos"
  echo -e "  Ver logs:    journalctl -u linux-market-pos -f"
  echo -e "  Reiniciar:   systemctl restart linux-market-pos"
  echo ""
}

main "$@"
