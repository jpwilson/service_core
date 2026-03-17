import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

let mainWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    title: 'ServiceCore',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple tray icon (placeholder - would use real icon in production)
  const icon = nativeImage.createEmpty();
  const tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open ServiceCore', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Clock In', click: () => mainWindow?.webContents.send('tray-clock-in') },
    { label: 'Clock Out', click: () => mainWindow?.webContents.send('tray-clock-out') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('ServiceCore');
  tray.setContextMenu(contextMenu);
  return tray;
}

// IPC handler for native file save dialog (used by Excel/PDF export)
ipcMain.handle('save-file', async (_event, { data, defaultName, filters }) => {
  if (!mainWindow) return null;

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, Buffer.from(data));
    return result.filePath;
  }
  return null;
});

app.whenReady().then(() => {
  createWindow();
  if (process.env.ENABLE_TRAY) {
    createTray();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
