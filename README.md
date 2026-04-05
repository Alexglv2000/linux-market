# Linux-Market POS

Sistema de Punto de Venta moderno y minimalista para la comunidad de usuarios de Linux.

**Multiplataforma:** Funciona como aplicación web y como aplicación desktop nativa en Windows, Debian/Ubuntu/Mint, Fedora/RHEL/CentOS, Arch Linux/Manjaro y más.

## Características Principales

- ✅ **Offline-First**: Funciona sin conexión a internet usando IndexedDB
- 🎨 **Diseño Moderno**: Interfaz minimalista con tema violeta corporativo
- 👥 **Multi-Roles**: 4 niveles de usuarios (Cajero, Admin Sucursal, Admin Célula, Admin General)
- 💰 **POS Completo**: Ventas rápidas con múltiples métodos de pago
- 📦 **Gestión de Inventario**: Control total de productos y stock
- 📊 **Dashboards Analíticos**: Gráficas en tiempo real con Recharts
- 🔄 **Transferencias**: Movimiento de inventario entre sucursales
- 📈 **Reportes**: Sistema completo de reportes y auditoría
- 🔐 **Seguridad**: Autenticación robusta con bcrypt

## Modos de Uso

Linux-Market POS puede ejecutarse de dos formas:

### 🌐 Modo Web (Navegador)
Acceso desde cualquier navegador moderno, ideal para:
- Acceso remoto desde cualquier dispositivo
- Sin necesidad de instalación en cliente
- Actualizaciones automáticas

### 💻 Modo Desktop (Aplicación Nativa)
Aplicación instalable en tu sistema operativo, ideal para:
- Rendimiento óptimo
- Funciona sin navegador
- Integración completa con el sistema operativo
- Soporte para Windows, Linux Mint, Debian, Fedora, Ubuntu, etc.

---

## Instalación

### 🌐 Instalación Modo Web

#### Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm

#### Pasos de Instalación

1. **Clonar o descargar el proyecto**
```bash
# Si tienes el ZIP, descomprímelo
unzip linux-market.zip
cd linux-market

# O si usas Git
git clone [URL_DEL_REPO]
cd linux-market
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
pnpm dev
# o
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

¡Listo! El sistema está funcionando. 🎉

---

### 💻 Instalación Modo Desktop

Linux-Market POS usa **Tauri** para crear aplicaciones desktop nativas multiplataforma.

#### 🐧 Linux Mint / Debian / Ubuntu

```bash
# 1. Ejecutar script de instalación automática
sudo bash scripts/install-debian.sh

# 2. Instalar dependencias del proyecto
pnpm install

# 3. Ejecutar en modo desarrollo
pnpm desktop

# 4. Compilar aplicación (genera .deb)
pnpm tauri:build:linux
```

**Instalar el paquete .deb generado:**
```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/linux-market_1.0.0_amd64.deb
```

#### Fedora / RHEL / CentOS

```bash
# 1. Ejecutar script de instalación automática
sudo bash scripts/install-fedora.sh

# 2. Instalar dependencias del proyecto
pnpm install

# 3. Ejecutar en modo desarrollo
pnpm desktop

# 4. Compilar aplicación (genera .rpm)
pnpm tauri:build:linux
```

**Instalar el paquete .rpm generado:**
```bash
sudo dnf install src-tauri/target/release/bundle/rpm/linux-market-1.0.0-1.x86_64.rpm
```

CentOS Stream 9+ es compatible con el mismo script y el mismo paquete .rpm.

#### Arch Linux / Manjaro / EndeavourOS

```bash
# 1. Ejecutar script de instalación automática
sudo bash scripts/install-arch.sh

# 2. Instalar dependencias del proyecto
pnpm install

# 3. Ejecutar en modo desarrollo
pnpm desktop

# 4. Compilar aplicación (genera .pkg.tar.zst)
pnpm tauri:build:linux
```

**Instalar el paquete generado:**
```bash
sudo pacman -U src-tauri/target/release/bundle/pacman/linux-market-1.0.0-1-x86_64.pkg.tar.zst
```

**O instalar desde AUR:**
```bash
yay -S linux-market
```

#### 🪟 Windows

```powershell
# 1. Ejecutar PowerShell como Administrador

# 2. Ejecutar script de instalación automática
.\scripts\install-windows.ps1

# 3. Abrir una NUEVA terminal PowerShell

# 4. Instalar dependencias del proyecto
pnpm install

# 5. Ejecutar en modo desarrollo
pnpm desktop

# 6. Compilar aplicación (genera instalador .exe)
pnpm tauri:build:windows
```

**El instalador estará en:**
```
src-tauri\target\release\bundle\nsis\Linux-Market_1.0.0_x64-setup.exe
```

#### Requisitos para Compilar Desktop

**Debian / Ubuntu / Mint:**
- Node.js 18+, Rust, build-essential, libwebkit2gtk-4.1-dev, libgtk-3-dev

**Fedora / RHEL / CentOS Stream 9+:**
- Node.js 18+, Rust, gcc, gcc-c++, webkit2gtk4.1-devel, gtk3-devel

**Arch Linux / Manjaro:**
- Node.js 18+, Rust (rustup), base-devel, webkit2gtk-4.1, gtk3

**Windows:**
- Node.js 18+, Rust, Visual Studio Build Tools 2022

Todos los scripts de instalación automática instalan estos requisitos por ti.

---

## Credenciales de Prueba

El sistema viene con datos de demostración pre-cargados:

**Administrador General:**
- Usuario: `admin`
- Contraseña: `admin123`

**Cajero:**
- Usuario: `cajero1`
- Contraseña: `cajero123`

## Estructura del Proyecto

```
linux-market/
├── app/
│   ├── dashboard/
│   │   ├── pos/              # Punto de Venta
│   │   ├── inventory/        # Gestión de Inventario
│   │   ├── transfers/        # Transferencias entre sucursales
│   │   └── reports/          # Reportes y Auditoría
│   ├── login/                # Página de login
│   └── layout.tsx            # Layout principal
├── lib/
│   ├── db.ts                 # Configuración de Dexie.js (Base de datos local)
│   └── auth-context.tsx      # Contexto de autenticación
├── components/
│   └── ui/                   # Componentes shadcn/ui
└── public/                   # Archivos estáticos
```

## Uso del Sistema

### 1. Punto de Venta (POS)

- Busca productos por nombre, código o escanea código de barras
- Agrega productos al carrito
- Ajusta cantidades
- Selecciona método de pago (Efectivo, Tarjeta, Transferencia)
- Procesa la venta

### 2. Inventario

- Ver todos los productos con stock actual
- Agregar nuevos productos
- Editar productos existentes
- Eliminar productos (si tienes permisos)
- Ver alertas de stock bajo

### 3. Transferencias

- Crear solicitudes de transferencia entre sucursales
- Aprobar/rechazar transferencias (Admin Sucursal/Célula)
- Seguimiento del estado de transferencias
- Historial completo

### 4. Reportes

- Ventas por período
- Productos más vendidos
- Ingresos por método de pago
- Log completo de auditoría
- Exportar reportes

## Roles y Permisos

### Cajero
- Realizar ventas en POS
- Ver inventario (solo lectura)
- Ver su historial de ventas

### Admin Sucursal
- Todo lo del Cajero +
- Gestionar inventario de su sucursal
- Crear transferencias
- Ver reportes de su sucursal

### Admin Célula
- Todo lo del Admin Sucursal +
- Ver todas las sucursales de su célula
- Aprobar transferencias entre sucursales
- Ver reportes consolidados de célula

### Admin General
- Acceso total al sistema
- Gestionar usuarios y roles
- Ver reportes globales
- Configuración del sistema

## Base de Datos Offline

El sistema usa **Dexie.js** con IndexedDB para funcionar sin conexión:

- Los datos se almacenan localmente en el navegador
- Sincronización automática cuando hay conexión (próximamente)
- Resolución de conflictos inteligente
- Backup automático

### Tablas Principales

- `users`: Usuarios del sistema
- `products`: Catálogo de productos
- `sales`: Registro de ventas
- `sale_items`: Detalle de productos vendidos
- `branches`: Sucursales
- `cells`: Células organizacionales
- `transfers`: Transferencias de inventario
- `audit_logs`: Registro de auditoría

## Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19.2 + shadcn/ui
- **Estilos**: Tailwind CSS v4
- **Base de Datos**: Dexie.js (IndexedDB)
- **Gráficas**: Recharts
- **Autenticación**: bcryptjs
- **Validación**: Zod + React Hook Form
- **TypeScript**: Full type safety

## Despliegue en Producción

### Opción 1: Vercel (Recomendado)

1. Conecta tu repositorio Git a Vercel
2. Vercel detectará automáticamente Next.js
3. Deploy automático en cada push

```bash
# O usando Vercel CLI
npm i -g vercel
vercel
```

### Opción 2: Build Manual

```bash
pnpm build
pnpm start
```

El build estará en `.next/` y el servidor en puerto 3000.

## Personalización

### Cambiar Colores del Tema

Edita `app/globals.css`:

```css
:root {
  --primary: oklch(0.55 0.18 285);  /* Color principal */
  --accent: oklch(0.65 0.15 290);    /* Color de acento */
  /* ... más variables */
}
```

### Agregar Nueva Sucursal

Edita `lib/db.ts` y agrega en el array de `seedBranches`:

```typescript
{
  id: crypto.randomUUID(),
  name: 'Nueva Sucursal',
  cellId: 'cell-id',
  address: 'Dirección',
  phone: 'Teléfono',
  isActive: true
}
```

## Roadmap Futuro

- [ ] Sincronización con servidor PostgreSQL/Supabase
- [ ] Impresión de tickets
- [ ] Lector de código de barras integrado
- [ ] App móvil con React Native
- [ ] Reportes avanzados con filtros
- [ ] Sistema de notificaciones
- [ ] Integración con sistemas de facturación

## Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Verifica los logs del navegador (F12 → Console)
3. Asegúrate de tener las versiones correctas de Node.js

## Licencia

Este proyecto es privado y de uso exclusivo para Linux-Market.

---

**Linux-Market** - Tecnologia accesible y moderna para la comunidad de usuarios de Linux
