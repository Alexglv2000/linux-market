# Linux-Market POS Local v1.0.0 Beta
## Guia de instalacion, configuracion, ejecucion y mantenimiento

---

## Que es esto?

Sistema Punto de Venta (POS) para red local (LAN). Funciona completamente sin internet.
Disenado para tiendas pequenas, negocios familiares y sucursales conectadas en la misma red.

- **Backend:** Node.js + Express + SQLite (100% gratuito)
- **Frontend:** HTML/CSS/JS puro — sin frameworks, cero dependencias en el navegador
- **Motor analitico:** Regresion lineal, promedio movil ponderado, suavizado exponencial
- **Acceso:** Desde cualquier navegador en la misma red (PC, tablet, celular)

---

## Requisitos minimos

| Componente | Minimo |
|---|---|
| Sistema operativo | Linux (cualquier distro), Windows 10+ |
| Node.js | 18.0.0 o superior |
| RAM | 512 MB |
| Disco | 200 MB |
| Red | LAN (Ethernet o WiFi) |

---

## Instalacion en 1 comando (Linux)

```bash
# Descargar e instalar automaticamente
sudo bash pos-local/installer/install.sh
```

El instalador detecta tu distribucion y hace todo automatico:
- Instala Node.js 20 LTS
- Instala dependencias del sistema (build-essential, gcc, etc.)
- Instala dependencias de Node (express, better-sqlite3, cors)
- Crea y migra la base de datos SQLite
- Configura el servicio systemd para arranque automatico
- Muestra la URL de acceso con la IP local de tu maquina

### Distribuciones soportadas

| Distribucion | Gestor |
|---|---|
| Debian / Ubuntu / Mint / Pop!_OS | apt |
| Fedora | dnf |
| CentOS Stream / RHEL / Rocky / AlmaLinux | dnf |
| Arch Linux / Manjaro / EndeavourOS | pacman |
| openSUSE | zypper |

---

## Instalacion manual

```bash
# 1. Entrar al directorio del POS
cd pos-local

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos (se hace automatico al arrancar)
node backend/server.js

# 4. Abrir en el navegador
# En la misma maquina:   http://localhost:3001
# Desde otra maquina:    http://[IP-DEL-SERVIDOR]:3001
```

---

## Estructura del proyecto

```
pos-local/
  backend/
    server.js          <- API REST (Express + SQLite)
  frontend/
    index.html         <- Interfaz web completa (sin frameworks)
  database/
    schema.sql         <- Esquema de la base de datos
    pos.db             <- Archivo SQLite (se crea al arrancar)
  analytics-engine/
    predictor.js       <- Motor de prediccion matematica
  installer/
    install.sh         <- Instalador automatico Linux
  package.json
  POS_LOCAL_SETUP.md   <- Esta guia
```

---

## Configuracion inicial

1. Abre `http://[IP-SERVIDOR]:3001` desde cualquier navegador en la red
2. Inicia sesion con:
   - Usuario: `admin`
   - Contrasena: `admin123`
3. Ve a **Configuracion** y personaliza:
   - Nombre del negocio
   - Moneda (MXN, USD, EUR)
   - Porcentaje de IVA
   - Texto del pie de ticket
4. Ve a **Inventario** y agrega tus productos reales
5. Listo. Ya puedes empezar a vender desde **Punto de Venta**

---

## Como acceder desde otros dispositivos

El servidor escucha en `0.0.0.0:3001` — esto significa que cualquier
dispositivo conectado a la misma red WiFi o LAN puede acceder.

1. En la maquina servidor, obtener la IP local:
   ```bash
   hostname -I | awk '{print $1}'
   # Ejemplo: 192.168.1.10
   ```
2. Desde cualquier otro dispositivo abrir:
   ```
   http://192.168.1.10:3001
   ```
3. Se muestra la misma interfaz completa del POS.

Recomendacion: asigna IP fija al servidor en el router para que
la direccion no cambie al reiniciar.

---

## Mantenimiento

### Ver estado del servicio
```bash
systemctl status linux-market-pos
```

### Ver logs en tiempo real
```bash
journalctl -u linux-market-pos -f
```

### Reiniciar el servidor
```bash
systemctl restart linux-market-pos
```

### Detener el servidor
```bash
systemctl stop linux-market-pos
```

### Hacer respaldo de la base de datos
```bash
# Copia simple del archivo SQLite
cp /opt/linux-market-pos/database/pos.db ~/respaldo-pos-$(date +%Y%m%d).db
```

### Actualizar a nueva version
```bash
cd /opt/linux-market-pos
git pull origin main     # si usas git
npm install              # actualizar dependencias
systemctl restart linux-market-pos
```

---

## Roles del sistema

| Rol | Descripcion | Permisos |
|---|---|---|
| `super_admin` | Acceso total | Todo |
| `admin_general` | Administrador de tienda | Ventas, inventario, reportes, config |
| `admin_sucursal` | Admin de sucursal | Inventario y reportes de su sucursal |
| `cajero` | Operador de caja | Solo punto de venta |

---

## Motor Analitico - Metodos implementados

El motor `/analytics-engine/predictor.js` implementa:

| Metodo | Descripcion |
|---|---|
| Regresion lineal (MCO) | Tendencia general de ventas con coeficiente R² |
| Promedio movil ponderado | Ventana de 14 dias, mayor peso a dias recientes |
| Suavizado exponencial | Alpha=0.3, captura cambios graduales |
| Indices estacionales | Por dia de la semana (0-6) y por hora (0-23) |
| Intervalo de confianza 95% | Bandas superior/inferior de la prediccion |
| Recomendaciones automaticas | Basadas en tendencia, anomalias y estacionalidad |

La prediccion hibrida combina los tres metodos con pesos 40/35/25
y aplica el indice estacional del dia de la semana correspondiente.

---

## Stack tecnologico (todo gratuito)

| Componente | Tecnologia | Licencia |
|---|---|---|
| Backend API | Express.js 4 | MIT |
| Base de datos | SQLite via better-sqlite3 | MIT / Public Domain |
| Frontend | HTML/CSS/JS puro | - |
| Runtime | Node.js 20 LTS | MIT |
| Servicio del sistema | systemd | LGPL |

No hay suscripciones, no hay APIs de pago, no hay dependencias en la nube.

---

## Escalabilidad futura a SaaS

La arquitectura esta preparada para migrar a la nube:

1. Reemplazar `better-sqlite3` por `pg` (PostgreSQL) cambiando
   las queries (la mayoria son SQL estandar)
2. Agregar autenticacion JWT real con `jsonwebtoken`
3. Mover el frontend a Next.js con el mismo diseno visual
4. Desplegar backend en cualquier VPS con Node.js

La logica de negocio, el motor analitico y los modelos de datos
permanecen identicos — solo cambia la capa de persistencia.

---

Creado por Alexis Gabriel Lugo Villeda
Linux-Market POS v1.0.0 Beta — Licencia MIT
