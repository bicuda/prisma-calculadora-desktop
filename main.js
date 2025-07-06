/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// --- Configuração de Log para o Auto-Updater ---
// Isso é útil para depurar problemas com o processo de atualização.
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');


// Mantenha uma referência global ao objeto da janela, se você não fizer isso, a janela
// será fechada automaticamente quando o objeto JavaScript for coletado pelo lixo.
let mainWindow;

// --- Criação da Janela Principal ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 384, // Corresponde a max-w-sm. O app foi desenhado para essa largura.
    height: 450, // Altura inicial ajustada para caber melhor na tela de login.
    minWidth: 320, // Para evitar que a UI quebre no redimensionamento.
    minHeight: 230, // Para garantir que os controles principais estejam sempre visíveis.
    resizable: false, // A janela não é redimensionável pelo usuário; ela se redimensiona programaticamente.
    maximizable: false, // A janela não pode ser maximizada.
    frame: false, // Usa uma janela sem moldura porque temos controles personalizados.
    backgroundColor: '#111827', // Define uma cor de fundo escura padrão para evitar flash branco.
    titleBarStyle: 'hidden',
    // --- Ícone da Aplicação ---
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      // O script de preload é essencial para a comunicação segura entre renderer e main.
      preload: path.join(__dirname, 'preload.js'),
      // Configurações de segurança recomendadas.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Carrega o arquivo HTML principal da aplicação React.
  mainWindow.loadFile('index.html');
  
  // Emitido quando a janela é fechada.
  mainWindow.on('closed', function () {
    // Dereferencia o objeto da janela.
    mainWindow = null;
  });
  
  // --- Handlers de Eventos IPC ---
  // Estes listeners lidam com eventos enviados do processo renderer via script de preload.

  // Fecha a janela.
  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  // Minimiza a janela.
  ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  // Define a janela para estar sempre no topo.
  ipcMain.on('set-always-on-top', (event, isPinned) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(isPinned);
  });

  // Redimensiona a janela programaticamente.
  ipcMain.on('resize-window', (event, { width, height }) => {
    if (mainWindow) {
        mainWindow.setContentSize(width, height, true);
    }
  });

  // --- Handlers para Auto-Update ---
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });
}

// --- Eventos do Ciclo de Vida do App ---

app.whenReady().then(() => {
  createWindow();

  // Inicia a verificação de atualizações assim que o app estiver pronto.
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Eventos do Auto-Updater ---
autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded');
  if (mainWindow) {
    // Envia um evento para o processo renderer para notificar o usuário.
    mainWindow.webContents.send('update-downloaded');
  }
});