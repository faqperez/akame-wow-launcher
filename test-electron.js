const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Log everything to a file
const logFile = path.join(__dirname, '../../debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
});

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});

log('App starting...');
log(`__dirname: ${__dirname}`);
log(`app path: ${app.getAppPath()}`);

app.whenReady().then(() => {
  log('App ready, creating window...');

  try {
    const win = new BrowserWindow({
      width: 1050,
      height: 680,
      frame: false,
      backgroundColor: '#0a0e17',
      show: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    const htmlPath = path.join(__dirname, '../renderer/index.html');
    log(`Loading HTML from: ${htmlPath}`);
    log(`HTML exists: ${fs.existsSync(htmlPath)}`);

    win.loadFile(htmlPath);

    win.webContents.on('did-finish-load', () => {
      log('HTML loaded successfully');
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log(`LOAD FAILED: ${errorCode} - ${errorDescription}`);
    });

    win.webContents.on('render-process-gone', (event, details) => {
      log(`RENDERER CRASHED: ${JSON.stringify(details)}`);
    });

    win.on('closed', () => {
      log('Window closed');
    });

    log('Window created successfully');
  } catch (err) {
    log(`ERROR creating window: ${err.message}\n${err.stack}`);
  }
});

app.on('window-all-closed', () => {
  log('All windows closed, quitting');
  app.quit();
});
