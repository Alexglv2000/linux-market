# 🏗️ Guía Técnica y Arquitectura
**Linux-Market POS — Una base sólida para el comercio moderno.**

Linux-Market POS combina la velocidad de **Rust** con la flexibilidad de **React** para crear un entorno comercial nativo y performante en Linux.

---

## 🏛️ Descripción Arquitectónica

Linux-Market POS utiliza un enfoque **híbrido** nativo/web para garantizar estabilidad y accesibilidad.

*   **Núcleo (Backend Nativo)**: Escrito en **Rust v1.75+ (via Tauri v2)**, se encarga de la interacción con el sistema de archivos de Linux, puertos seriales (impresoras térmicas), escáneres USB-HID y gestión de procesos del sistema operativo.
*   **Interfaz (Frontend)**: Desarrollada en **Next.js 16 (React 19)**, proporciona una interfaz SPA (Single Page Application) rápida y responsiva, utilizando el patrón **App Router**.
*   **Persistencia (DB)**:
    *   **Nativo**: SQLite para almacenamiento persistente de ventas, usuarios y configuración local.
    *   **Navegador**: **Dexie.js (IndexedDB)** para caché local y modo "Offline-First", permitiendo que el POS no dependa de la red para operar momentáneamente.
*   **Sincronización (LAN)**: Utiliza **Server-Sent Events (SSE)** y una API de red local (LAN) integrada para conectar múltiples tablets o computadoras a la misma base de datos sin necesidad de configurar un servidor externo.

---

## 🛠️ Entorno de Desarrollo

### Requisitos Previos

- **Node.js 20+** (LTS)
- **Rustup** (Stable Toolchain)
- **pnpm** (Gestor de paquetes recomendado)
- **Compilador GCC** y dependencias webkit2gtk-4.1.

### 🐧 Configuración de Sistema

#### Debian / Ubuntu / Mint
```bash
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
```

#### Fedora / RHEL
```bash
sudo dnf install -y gcc gcc-c++ make openssl-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel webkit2gtk4.1-devel
```

---

## ⚙️ Comandos de Desarrollo

### 1. Iniciar Entorno Web
```bash
pnpm install
pnpm dev
```
Acceso en `http://localhost:3000`.

### 2. Iniciar Modo Desktop (Nativo)
```bash
pnpm desktop
```
Abre la aplicación nativa con Hot Reloading tanto en Rust como en React.

### 3. Generar Instaladores
```bash
# Compilar para todas las distros Linux (.deb, .rpm, .AppImage)
pnpm tauri:build:linux

# Compilar para Windows (.exe)
pnpm tauri:build:windows
```

---

## 📁 Estructura del Código

```text
/linux-market/
├── app/                  # Rutas y páginas de Next.js
│   ├── dashboard/        # Centro de operaciones y reportes
│   └── store/            # Lógica de login y punto de venta
├── components/           # Componentes de UI (Cyber-Dark Aesthetic)
├── hooks/                # Lógica de negocio (moneda, realtime, etc.)
├── lib/                  # Utilidades (Dexie, auth-context, api-client)
├── src-tauri/            # Código fuente en Rust (Comandos nativos)
│   ├── src/main.rs       # Punto de entrada y comandos de Rust
│   └── capabilities/     # Permisos del sistema operativo
├── scripts/              # Herramientas de instalación y build
└── snap/                 # Configuración para Snap Store
```

---

## ⚖️ Filosofía de Diseño "Cyber-Dark"

Linux-Market POS utiliza un sistema de diseño propio basado en:
- **Colores**: Paleta Violeta/Esmeralda/Ambar sobre fondo de alto contraste (OLED Negro).
- **Tipografía**: Fuentes monoespaciadas para SKUs y precios, Inter para la interfaz.
- **Gráficos**: Uso extensivo de **Lucide React** y efectos de cristal (Glassmorphism).
- **Consistencia**: Todos los botones siguen el patrón de "Terminal de Operaciones" para que el usuario sienta el control total del negocio.

---

¡Gracias por interesarte en la parte técnica de **Linux-Market POS**!  
Diseñado y construido por **Alexis Gabriel Lugo Villeda**.
