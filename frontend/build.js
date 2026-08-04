const fs = require('fs');
const path = require('path');

const srcDir = __dirname;

// Carpetas de desarrollo/nativo que nunca deben copiarse a ningún bundle
const devExclude = new Set([
  'node_modules',
  'android',
  'ios',
  'www',
  'www-app',
  'www-admin',
  'www-landing',
  'package.json',
  'package-lock.json',
  'build.js',
  '.git',
  '.vscode',
  'admin',   // se empaqueta aparte en www-admin/
  'landing'  // se empaqueta aparte en www-landing/
]);

function resetDir(destDir) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });
}

// App principal: todo excepto admin/ y landing/ (mismo contenido que antes)
const appDest = path.join(__dirname, 'www-app');
resetDir(appDest);
for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
  if (devExclude.has(entry.name)) continue;
  fs.cpSync(path.join(srcDir, entry.name), path.join(appDest, entry.name), { recursive: true, force: true });
}
console.log('✅ Bundle generado en www-app/');

// Panel de administración: solo frontend/admin/
const adminDest = path.join(__dirname, 'www-admin');
resetDir(adminDest);
fs.cpSync(path.join(srcDir, 'admin'), adminDest, { recursive: true, force: true });
console.log('✅ Bundle generado en www-admin/');

// Landing page: solo frontend/landing/
const landingDest = path.join(__dirname, 'www-landing');
resetDir(landingDest);
fs.cpSync(path.join(srcDir, 'landing'), landingDest, { recursive: true, force: true });
console.log('✅ Bundle generado en www-landing/');
