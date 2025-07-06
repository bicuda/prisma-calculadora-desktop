/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Garante que o diretório de destino exista
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

esbuild.build({
  entryPoints: ['index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: ['chrome120'], // Alinhado com a versão do Chromium no Electron 28
  format: 'iife',       // Formato seguro para scripts de navegador
  sourcemap: true,      // Ajuda na depuração
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts'
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
}).then(() => {
    console.log('Build finished successfully.');
}).catch((err) => {
    console.error('Build failed:', err);
    process.exit(1)
});