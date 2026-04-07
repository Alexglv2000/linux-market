# 🚀 Guía de Instalación Detallada
**Linux-Market POS — El sistema nativo para tu negocio.**

Linux-Market POS está diseñado para ser agnóstico del sistema operativo, ofreciendo tanto una solución nativa de escritorio como una accesible vía web.

---

## 🐧 Distribuciones Linux (Recomendado)

### 1. Debian / Ubuntu / Linux Mint / Pop!_OS
```bash
# Paso 1: Ejecutar script de instalación automática
sudo bash scripts/install-debian.sh

# Paso 2: Iniciar desarrollo/ejecución
pnpm install
pnpm desktop
```

### 2. Fedora / RHEL / CentOS Stream 9+
```bash
# Paso 1: Ejecutar script de instalación automática
sudo bash scripts/install-fedora.sh

# Paso 2: Iniciar desarrollo/ejecución
pnpm install
pnpm desktop
```

### 3. Arch Linux / Manjaro / EndeavourOS
```bash
# Paso 1: Ejecutar script de instalación automática
sudo bash scripts/install-arch.sh

# Paso 2: Iniciar desarrollo/ejecución
pnpm install
pnpm desktop
```

---

## 🪟 Instalación en Windows 10/11

1. **Abrir PowerShell como Administrador**.
2. **Ejecutar script de instalación**:
   ```powershell
   .\scripts\install-windows.ps1
   ```
3. **Cierra y abre una NUEVA terminal PowerShell**.
4. **Instalar dependencias**:
   ```bash
   pnpm install
   pnpm desktop
   ```

---

## 🏗️ Despliegue en Servidor Web (Modo Remoto)

Si solo deseas usar la versión web accesible vía navegador (sin características nativas como impresión directa):

### 1. Requisitos
- **Node.js 20+** (LTS)
- **pnpm** o **npm**

### 2. Configuración y Ejecución
```bash
# Instalar pnpm si no lo tienes
npm i -g pnpm

# Instalar dependencias
pnpm install

# Iniciar servidor web de producción local
pnpm dev --hostname 0.0.0.0
```
Acceso en la misma computadora: `http://localhost:3000`.  
Acceso desde otros dispositivos en la red: `http://[TU-IP-LOCAL]:3000`.

---

## 📦 Compilación de Instaladores (.deb, .rpm, .exe)

Linux-Market POS utiliza **Tauri** para empaquetar la aplicación en formatos instalables nativos.

### Para Linux (genera .deb, .rpm, .AppImage)
```bash
pnpm tauri:build:linux
```
Los archivos estarán en: `src-tauri/target/release/bundle/`.

### Para Windows (genera .exe)
```bash
pnpm tauri:build:windows
```
El instalador estará en: `src-tauri\target\release\bundle\nsis\`.

---

## ❓ Solución de Problemas Comunes

### Error: "webkit2gtk-4.1-dev" no encontrado
Este es el motor de renderizado. Asegúrate de que tu distribución esté actualizada:
- **Ubuntu/Debian**: `sudo apt install libwebkit2gtk-4.1-dev`
- **Fedora**: `sudo dnf install webkit2gtk4.1-devel`

### El programa no detecta mi Impresora Térmica
Asegúrate de que tu usuario tenga permisos de acceso a puertos seriales y USB:
```bash
sudo usermod -a -G lp,dialout,plugdev [TU-USUARIO]
# Reinicia tu sesión después de ejecutar esto.
```

---

¡Gracias por elegir **Linux-Market POS** para tu negocio!  
Creado con orgullo por **Alexis Gabriel Lugo Villeda**.
