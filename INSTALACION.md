# Guía de Instalación Rápida - Linux-Market POS

## 🚀 Instalación Express

Elige tu sistema operativo y sigue los pasos:

---

## 🐧 Linux Mint / Ubuntu / Debian

### Opción 1: Instalación Automática (Recomendado)

```bash
# Descargar y ejecutar script de instalación
sudo bash scripts/install-debian.sh

# Instalar dependencias del proyecto
cd linux-market
pnpm install

# Iniciar aplicación
pnpm desktop
```

### Opción 2: Instalación Manual

```bash
# 1. Actualizar sistema
sudo apt update

# 2. Instalar dependencias
sudo apt install -y curl wget file build-essential libssl-dev \
  libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev \
  libwebkit2gtk-4.1-dev

# 3. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# 4. Instalar pnpm
sudo npm install -g pnpm

# 5. Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 6. Instalar dependencias del proyecto
cd linux-market
pnpm install

# 7. Iniciar aplicación
pnpm desktop
```

---

## 🐧 Fedora / RHEL / CentOS

### Opción 1: Instalación Automática (Recomendado)

```bash
# Descargar y ejecutar script de instalación
sudo bash scripts/install-fedora.sh

# Instalar dependencias del proyecto
cd linux-market
pnpm install

# Iniciar aplicación
pnpm desktop
```

### Opción 2: Instalación Manual

```bash
# 1. Actualizar sistema
sudo dnf update -y

# 2. Instalar dependencias
sudo dnf install -y curl wget file openssl-devel gtk3-devel \
  libappindicator-gtk3-devel librsvg2-devel webkit2gtk4.1-devel \
  gcc gcc-c++ make

# 3. Instalar Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 4. Instalar pnpm
sudo npm install -g pnpm

# 5. Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 6. Instalar dependencias del proyecto
cd linux-market
pnpm install

# 7. Iniciar aplicación
pnpm desktop
```

---

## Arch Linux / Manjaro / EndeavourOS

### Opcion 1: Instalacion Automatica (Recomendado)

```bash
sudo bash scripts/install-arch.sh
cd linux-market
pnpm install
pnpm desktop
```

### Opcion 2: Instalacion Manual

```bash
# 1. Actualizar sistema
sudo pacman -Syu

# 2. Instalar dependencias
sudo pacman -S --needed base-devel openssl gtk3 \
  libappindicator-gtk3 librsvg webkit2gtk-4.1 \
  nodejs npm git rustup

# 3. Configurar Rust
rustup default stable

# 4. Instalar pnpm
npm install -g pnpm

# 5. Instalar dependencias del proyecto
cd linux-market
pnpm install

# 6. Iniciar aplicacion
pnpm desktop
```

**Instalar desde AUR (mas facil):**
```bash
yay -S linux-market
```

---

## Windows

### Opción 1: Instalación Automática (Recomendado)

```powershell
# 1. Abrir PowerShell como Administrador
# Click derecho en el menú inicio > PowerShell (Administrador)

# 2. Ejecutar script de instalación
.\scripts\install-windows.ps1

# 3. Cerrar y abrir una NUEVA terminal PowerShell

# 4. Instalar dependencias del proyecto
cd linux-market
pnpm install

# 5. Iniciar aplicación
pnpm desktop
```

### Opción 2: Instalación Manual

```powershell
# 1. Instalar Chocolatey (gestor de paquetes)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar Node.js
choco install nodejs-lts -y

# 3. Instalar pnpm
npm install -g pnpm

# 4. Instalar Rust
choco install rust -y

# 5. Instalar Visual Studio Build Tools
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y

# 6. Reiniciar terminal

# 7. Instalar dependencias del proyecto
cd linux-market
pnpm install

# 8. Iniciar aplicación
pnpm desktop
```

---

## 🌐 Modo Web (Sin Desktop)

Si solo quieres usar la versión web sin compilar la aplicación desktop:

```bash
# 1. Instalar Node.js 18+ (https://nodejs.org)

# 2. Instalar pnpm
npm install -g pnpm

# 3. Instalar dependencias
cd linux-market
pnpm install

# 4. Iniciar servidor web
pnpm dev

# 5. Abrir navegador en http://localhost:3000
```

---

## 📦 Compilar Instaladores

### Linux (genera .deb, .rpm, .AppImage)

```bash
pnpm tauri:build:linux
```

**Ubicación de archivos:**
- `.deb`: `src-tauri/target/release/bundle/deb/`
- `.rpm`: `src-tauri/target/release/bundle/rpm/`
- `.AppImage`: `src-tauri/target/release/bundle/appimage/`

### Windows (genera .exe)

```powershell
pnpm tauri:build:windows
```

**Ubicación de archivos:**
- Instalador: `src-tauri\target\release\bundle\nsis\`

---

## 🔧 Comandos Útiles

```bash
# Desarrollo web
pnpm dev              # Iniciar servidor web en http://localhost:3000

# Desarrollo desktop
pnpm desktop          # Iniciar app desktop en modo desarrollo

# Compilar
pnpm build           # Build para web
pnpm tauri:build     # Build para desktop (todos los formatos)

# Específicos
pnpm tauri:build:linux    # Solo Linux (.deb, .rpm, .AppImage)
pnpm tauri:build:windows  # Solo Windows (.exe)
```

---

## 🎯 Primer Inicio

1. **Iniciar la aplicación** (web o desktop)
2. **Login con credenciales de prueba:**
   - Usuario: `admin`
   - Contraseña: `admin123`
3. **Explorar el dashboard** y las funcionalidades

---

## ❓ Solución de Problemas

### Error: "comando no encontrado" después de instalar

**Solución:** Cierra y abre una nueva terminal para cargar las variables de entorno.

### Error en Linux: "webkit2gtk not found"

**Solución (Debian/Ubuntu):**
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

**Solución (Fedora):**
```bash
sudo dnf install webkit2gtk4.1-devel
```

### Error en Windows: "Visual Studio not found"

**Solución:**
```powershell
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y
```

### Puerto 3000 ya en uso

**Solución:**
```bash
# Cambiar puerto en package.json o usar otro:
pnpm dev -- -p 3001
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Verifica los requisitos del sistema
3. Consulta el README.md principal
4. Revisa los logs en la consola

---

**Linux-Market POS** - Sistema moderno para tu negocio 🚀
