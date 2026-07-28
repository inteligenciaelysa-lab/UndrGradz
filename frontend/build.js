const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Excluir archivos y carpetas del entorno de desarrollo y nativo
const exclude = new Set([
  'node_modules',
  'android',
  'ios',
  'www',
  'package.json',
  'package-lock.json',
  'build.js',
  '.git',
  '.vscode'
]);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const entries = fs.readdirSync(srcDir, { withFileTypes: true });

for (const entry of entries) {
  if (exclude.has(entry.name)) continue;
  const srcPath = path.join(srcDir, entry.name);
  const destPath = path.join(destDir, entry.name);
  fs.cpSync(srcPath, destPath, { recursive: true, force: true });
}

console.log('✅ Web assets sincronizados limpiamente en www/');
