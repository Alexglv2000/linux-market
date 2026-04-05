#!/usr/bin/env node

/**
 * Script de configuración inicial para Linux-Market
 * Ejecuta: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🖨️  Bienvenido a Linux-Market POS Setup\n');

// Verificar versión de Node
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

console.log(`✓ Node.js version: ${nodeVersion}`);

if (majorVersion < 18) {
  console.error('❌ Error: Se requiere Node.js 18 o superior');
  console.error('   Por favor actualiza Node.js desde https://nodejs.org/');
  process.exit(1);
}

// Verificar si existe package.json
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: No se encuentra package.json');
  console.error('   ¿Estás en el directorio correcto del proyecto?');
  process.exit(1);
}

console.log('✓ package.json encontrado');

// Detectar gestor de paquetes
let packageManager = 'npm';
if (fs.existsSync('pnpm-lock.yaml')) {
  packageManager = 'pnpm';
} else if (fs.existsSync('yarn.lock')) {
  packageManager = 'yarn';
}

console.log(`✓ Gestor de paquetes: ${packageManager}\n`);

// Instalar dependencias
console.log('📦 Instalando dependencias...');
console.log('   Esto puede tomar algunos minutos...\n');

try {
  execSync(`${packageManager} install`, { stdio: 'inherit' });
  console.log('\n✓ Dependencias instaladas correctamente\n');
} catch (error) {
  console.error('❌ Error al instalar dependencias');
  process.exit(1);
}

// Verificar dependencias críticas
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = ['next', 'react', 'dexie', 'dexie-react-hooks'];

console.log('🔍 Verificando dependencias críticas...');
let allDepsOk = true;

criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✓ ${dep}`);
  } else {
    console.error(`❌ Falta dependencia: ${dep}`);
    allDepsOk = false;
  }
});

if (!allDepsOk) {
  console.error('\n❌ Faltan dependencias críticas');
  process.exit(1);
}

console.log('\n✅ ¡Todo listo! El sistema está configurado correctamente.\n');
console.log('🚀 Para iniciar el servidor de desarrollo, ejecuta:');
console.log(`   ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev\n`);
console.log('📖 Credenciales de prueba:');
console.log('   Usuario: admin');
console.log('   Contraseña: admin123\n');
console.log('🌐 El sistema estará disponible en: http://localhost:3000\n');
console.log('💡 Consulta README.md para más información\n');
