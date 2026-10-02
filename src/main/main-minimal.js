const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1050,
    height: 680,
    frame: true,
    title: 'Akame Launcher',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  win.setAlwaysOnTop(true);
  
  setTimeout(() => {
    win.setAlwaysOnTop(false);
  }, 2000);
});

app.on('window-all-closed', () => app.quit());
