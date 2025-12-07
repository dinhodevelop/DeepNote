const { app, BrowserWindow, ipcMain, Menu  } = require("electron");
const path = require("path");

// Configurações para resolver problemas do GLib no Linux
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--disable-gpu-sandbox');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
  app.commandLine.appendSwitch('--disable-background-timer-throttling');
  app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('--disable-renderer-backgrounding');
  app.commandLine.appendSwitch('--disable-features', 'TranslateUI');
  app.commandLine.appendSwitch('--disable-ipc-flooding-protection');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false, // Não mostrar até estar pronto
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Permite que o preload script acesse módulos Node.js
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  // Log de erros para debug se necessário
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  win.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
  });

  win.loadFile("./src/index.html");

  // Mostrar janela apenas quando estiver pronta
  win.once('ready-to-show', () => {
    win.show();
  });

  // Remove menu padrão
  Menu.setApplicationMenu(null);

}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
