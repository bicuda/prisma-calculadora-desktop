/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { contextBridge, ipcRenderer } = require('electron');

// Este script é executado no mundo principal do processo renderer, mas tem
// acesso às APIs do Node.js. É usado para expor de forma segura uma API
// limitada do processo principal para o processo renderer.
contextBridge.exposeInMainWorld('electronAPI', {
  // Funções existentes
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  setAlwaysOnTop: (isPinned) => ipcRenderer.send('set-always-on-top', isPinned),
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),

  // Novas funções para o auto-update
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateDownloaded: (callback) => {
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on('update-downloaded', listener);
    // Retorna uma função para remover o listener, evitando memory leaks
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  restartApp: () => ipcRenderer.send('restart-app'),
});