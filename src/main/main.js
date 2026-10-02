const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');
const net = require('net');
const { autoUpdater } = require('electron-updater');

// ─── Fix GPU / rendering issues on some Windows setups ───────────
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
  // Configuración del Servidor
  serverName: 'Akame: Layerforge',
  realmlist: 'set realmlist wow.akamestudio.com',
  websiteUrl: 'https://wow.akamestudio.com',
  discordUrl: 'https://discord.gg/mC3WKQ96FD',
  shopUrl: 'https://wow.akamestudio.com/shop',
  bugTrackerUrl: 'https://wow.akamestudio.com/bugtracker',
  changelogUrl: 'https://wow.akamestudio.com/changelog',
  newsApiUrl: 'https://wow.akamestudio.com/api/news', // You may need to create this JSON endpoint!
  patchManifestUrl: 'https://wow.akamestudio.com/api/patches/manifest.json',
  authServerHost: 'wow.akamestudio.com',
  authServerPort: 3724,
  worldServerHost: 'wow.akamestudio.com',
  worldServerPort: 8085,
  realmName: 'Akame: Layerforge',
  realmType: 'PvP',
  build: 12340,
  windowWidth: 1050,
  windowHeight: 680,
};

// ─── Paths ───────────────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

// ─── Settings ────────────────────────────────────────────────────
let settings = {
  gamePath: '',
  autoApplyPatches: true,
  hdPacks: {
    patchA: false,
    patchB: false,
    patchC: false,
    patchD: false,
    patchE: false,
    patchG: false,
    patchI: false,
    patchM: false,
    patchN: false,
    patchP: false,
    patchS: false,
    patchU: false,
  },
  binaryPatches: {
    ram4gb: true,
    sigBypass: true,
    mouseFix: true,
  },
  minimizeOnLaunch: true,
};

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      settings = { ...settings, ...saved };
    }
  } catch (e) {
    console.error('Error loading settings:', e.message);
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Error saving settings:', e.message);
  }
}

// ─── Main Window ─────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    resizable: true,
    backgroundColor: '#0a0e17',
    show: false,
    center: true,
    title: 'Akame Launcher',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  
  // Check for updates automatically
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  app.quit();
});

// ─── IPC: Window controls ────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// ─── IPC: Settings ───────────────────────────────────────────────
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:save', (_, newSettings) => {
  settings = { ...settings, ...newSettings };
  saveSettings();
  return settings;
});
ipcMain.handle('settings:selectGamePath', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccioná la carpeta de World of Warcraft',
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const gamePath = result.filePaths[0];
    if (fs.existsSync(path.join(gamePath, 'WoW.exe'))) {
      settings.gamePath = gamePath;
      saveSettings();
      return { success: true, path: gamePath };
    }
    return { success: false, error: 'WoW.exe no encontrado en esa carpeta' };
  }
  return { success: false, error: 'Cancelado' };
});

// ─── IPC: Config ─────────────────────────────────────────────────
ipcMain.handle('config:get', () => CONFIG);

// ─── IPC: Shell ──────────────────────────────────────────────────
ipcMain.on('shell:openExternal', (_, url) => shell.openExternal(url));

// ─── IPC: Server Status ──────────────────────────────────────────
ipcMain.handle('server:checkStatus', async () => {
  const checkPort = (host, port) => new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
  try {
    const auth = await checkPort(CONFIG.authServerHost, CONFIG.authServerPort);
    return {
      online: auth,
      realmName: CONFIG.realmName,
      realmType: CONFIG.realmType,
    };
  } catch {
    return { online: false, realmName: CONFIG.realmName, realmType: CONFIG.realmType };
  }
});

// ─── IPC: News ───────────────────────────────────────────────────
ipcMain.handle('news:fetch', async () => {
  // Replace these with your real API/RSS feed when available
  return [
    {
      id: 1,
      title: '¡BIENVENIDOS A AKAME WoW!',
      description: 'El servidor Akame ya está online. Descargá el cliente WotLK 3.3.5a, configurá la ruta del juego y aplicá los parches. ¡Buena suerte en Azeroth!',
      date: '2026-09-29',
      image: null,
      url: CONFIG.websiteUrl,
    },
    {
      id: 2,
      title: 'PAQUETES HD - PROJECT REFORGED',
      description: 'Ya podés instalar los paquetes HD de Project Reforged: personajes, criaturas, edificios, entorno, equipamiento y más. Todos disponibles desde la pestaña Configuración.',
      date: '2026-09-28',
      image: null,
      url: CONFIG.websiteUrl,
    },
    {
      id: 3,
      title: 'PARCHES DEL CLIENTE APLICADOS',
      description: 'El launcher aplica automáticamente: 4GB RAM, Interface Signature Bypass y Mouse Camera Fix. Usá el botón "Aplicar Parches" desde Configuración.',
      date: '2026-09-25',
      image: null,
      url: CONFIG.websiteUrl,
    },
  ];
});

// ─── IPC: Patch Manifest ─────────────────────────────────────────
const BASE_URL = 'https://pub-0f05631d243e4046993fc02ca7be9542.r2.dev/Wrath%20of%20the%20Lich%20King/patches';

function getManifest() {
  return {
    version: '1.0.0',
    // Required server MPQ patches (your own server files go here)
    patches: [],
    // Project Reforged HD packs
    hdPacks: [
      {
        id: 'patchA',
        name: 'Patch-A · Personajes y NPCs',
        description: 'Core: Personajes HD y NPCs. Base para múltiples módulos.',
        files: ['patch-A.MPQ'],
        category: 'core',
        requires: [],
        note: 'Elegí entre variante HD o SD.',
        variants: [
          { id: 'hd', name: 'HD (Modelos modernos)', url: `${BASE_URL}/patch-A.mpq` },
          { id: 'sd', name: 'SD (Texturas mejoradas, baja carga)', url: `${BASE_URL}/extras/patch-A.mpq` }
        ]
      },
      {
        id: 'patchB',
        name: 'Patch-B · Edificios',
        description: 'Arquitectura y estructuras. Instalar junto con D + E.',
        url: `${BASE_URL}/patch-B.mpq`,
        files: ['patch-B.MPQ'],
        category: 'core',
        requires: ['patchD', 'patchE'],
        dependencyGroup: 'BDE',
        note: 'Instalar SIEMPRE junto a Patch-D y Patch-E.',
      },
      {
        id: 'patchC',
        name: 'Patch-C · Criaturas',
        description: 'Criaturas y assets relacionados. Requiere Patch-A.',
        url: `${BASE_URL}/patch-C.mpq`,
        files: ['patch-C.MPQ'],
        category: 'core',
        requires: ['patchA'],
        note: 'Requiere Patch-A (HD o SD) para funcionar.',
      },
      {
        id: 'patchD',
        name: 'Patch-D · Doodads',
        description: 'Doodads y texturas del mundo. Instalar junto con B + E.',
        url: `${BASE_URL}/patch-D.mpq`,
        files: ['patch-D.MPQ'],
        category: 'core',
        requires: ['patchB', 'patchE'],
        dependencyGroup: 'BDE',
        note: 'Instalar SIEMPRE junto a Patch-B y Patch-E.',
      },
      {
        id: 'patchE',
        name: 'Patch-E · Entorno',
        description: 'Texturas del entorno y mundo. Instalar junto con B + D.',
        url: `${BASE_URL}/patch-E.mpq`,
        files: ['patch-E.MPQ'],
        category: 'core',
        requires: ['patchB', 'patchD'],
        dependencyGroup: 'BDE',
        note: 'Instalar SIEMPRE junto a Patch-B y Patch-D.',
      },
      {
        id: 'patchG',
        name: 'Patch-G · Equipamiento y Armas',
        description: 'Visuales de equipamiento y armas.',
        url: `${BASE_URL}/patch-G.mpq`,
        files: ['patch-G.MPQ'],
        category: 'core',
        requires: [],
        note: null,
      },
      {
        id: 'patchI',
        name: 'Patch-I · Interfaz',
        description: 'Mejoras visuales de la interfaz y UI.',
        url: `${BASE_URL}/patch-I.mpq`,
        files: ['patch-I.MPQ'],
        category: 'core',
        requires: [],
        note: null,
      },
      {
        id: 'patchM',
        name: 'Patch-M · Mapas y Pantallas de Carga',
        description: 'Mapas y pantallas de carga mejoradas.',
        url: `${BASE_URL}/patch-M.mpq`,
        files: ['patch-M.MPQ'],
        category: 'optional',
        requires: [],
        note: null,
      },
      {
        id: 'patchN',
        name: 'Patch-N · Noches Oscuras',
        description: 'Noches más oscuras para una experiencia más atmosférica.',
        url: `${BASE_URL}/patch-N.mpq`,
        files: ['patch-N.MPQ'],
        category: 'optional',
        requires: [],
        note: null,
      },
      {
        id: 'patchP',
        name: 'Patch-P · Efectos de Hechizos',
        description: 'Visuales y partículas de hechizos mejorados.',
        url: `${BASE_URL}/patch-P.mpq`,
        files: ['patch-P.MPQ'],
        category: 'optional',
        requires: [],
        note: null,
      },
      {
        id: 'patchS',
        name: 'Patch-S · Sonido y Música',
        description: 'Mejoras de audio y nuevas pistas musicales por región.',
        files: ['patch-S.MPQ'],
        category: 'optional',
        requires: [],
        note: 'Podés elegir entre Standard (requiere Patch-M) o Standalone.',
        variants: [
          { id: 'standard', name: 'Standard (Requiere Patch-M)', url: `${BASE_URL}/patch-S.mpq`, requires: ['patchM'] },
          { id: 'standalone', name: 'Standalone (Sin Patch-M)', url: `${BASE_URL}/extras/patch-S.mpq`, requires: [] }
        ]
      },
      {
        id: 'patchU',
        name: 'Patch-U · Orcos Erguidos',
        description: 'Orcos con postura erguida en vez de encorvada.',
        url: `${BASE_URL}/patch-U.mpq`,
        files: ['patch-U.MPQ'],
        category: 'optional',
        requires: ['patchA', 'patchC'],
        note: 'Requiere Patch-A y Patch-C.',
      },
    ],
    // Binary patches via Project Reforged patcher (WoW.exe build 12340)
    binaryPatches: [
      {
        id: 'ram4gb',
        name: '4 GB RAM (Large Address Aware)',
        description: 'Permite usar hasta 4 GB de RAM en vez de 2 GB. Imprescindible con paquetes HD para evitar crashes.',
        category: 'essential',
        batFile: 'patch-002-4gb_ram_limit.bat',
        mandatory: true,
      },
      {
        id: 'sigBypass',
        name: 'Interface Signature Bypass',
        description: 'Permite cargar archivos de interfaz personalizados (FrameXML/GlueXML) sin errores de firma.',
        category: 'essential',
        batFile: 'patch-004-allow_interface_edit.bat',
        mandatory: true,
      },
      {
        id: 'mouseFix',
        name: 'Mouse Camera Fix',
        description: 'Elimina el stuttering de cámara al mover el mouse rápidamente.',
        category: 'essential',
        batFile: 'patch-011-fix_mouse_bug.bat',
        mandatory: true,
      },
      {
        id: 'meleeSwing',
        name: 'Melee Swing al hacer Click Derecho',
        description: 'Fix: el swing de melee no se cancela al usar click derecho para girar la cámara.',
        category: 'bugfix',
        batFile: 'patch-020-melee_swing_rightclick.bat',
        mandatory: true,
      },
      {
        id: 'charListLimit',
        name: 'Límite de personajes: 10 → 50',
        description: 'Aumenta el máximo de personajes visibles en la pantalla de selección.',
        category: 'qol',
        batFile: 'patch-030-char_list_limit.bat',
        mandatory: true,
      },
    ],
  };
}

ipcMain.handle('patches:getManifest', () => getManifest());

// ─── IPC: Check patch status ─────────────────────────────────────
ipcMain.handle('patches:checkStatus', async () => {
  if (!settings.gamePath) return { ready: false, error: 'Ruta del juego no configurada' };
  const dataPath = path.join(settings.gamePath, 'Data');
  if (!fs.existsSync(dataPath)) return { ready: false, error: 'Carpeta Data no encontrada' };

  const manifest = getManifest();
  const status = { ready: true, patches: [], hdPacks: [], realmlistOk: false };

  for (const patch of manifest.patches) {
    const filePath = path.join(dataPath, patch.name);
    const exists = fs.existsSync(filePath);
    status.patches.push({ ...patch, installed: exists, upToDate: exists });
    if (patch.required && !exists) status.ready = false;
  }

  for (const pack of manifest.hdPacks) {
    const installed = pack.files.every(f => fs.existsSync(path.join(dataPath, f)));
    status.hdPacks.push({ ...pack, installed, enabled: settings.hdPacks[pack.id] || false });
  }

  // Validate HD Pack dependencies (e.g., B, D, E must be together)
  const missingDeps = [];
  for (const pack of status.hdPacks) {
    if (pack.installed && pack.requires && pack.requires.length > 0) {
      for (const reqId of pack.requires) {
        const reqPack = status.hdPacks.find(p => p.id === reqId);
        if (!reqPack || !reqPack.installed) {
          status.ready = false;
          if (pack.dependencyGroup === 'BDE') {
            if (!missingDeps.includes('Patch-B, Patch-D y Patch-E deben instalarse juntos.')) {
              missingDeps.push('Patch-B, Patch-D y Patch-E deben instalarse juntos.');
            }
          } else {
            missingDeps.push(`${pack.name} requiere ${reqPack ? reqPack.name : reqId}.`);
          }
        }
      }
    }
  }
  if (missingDeps.length > 0) {
    status.hdError = missingDeps.join(' ');
  }

  const localeFolders = ['enUS', 'enGB', 'esES', 'esMX', 'deDE', 'frFR', 'ptBR', 'ruRU'];
  for (const locale of localeFolders) {
    const rlPath = path.join(settings.gamePath, 'Data', locale, 'realmlist.wtf');
    if (fs.existsSync(rlPath)) {
      try {
        const content = fs.readFileSync(rlPath, 'utf-8');
        if (content.includes('100.91.133.101')) { status.realmlistOk = true; break; }
      } catch {}
    }
  }

  return status;
});

// ─── IPC: Apply Realmlist ────────────────────────────────────────
ipcMain.handle('patches:applyRealmlist', async () => {
  if (!settings.gamePath) return { success: false, error: 'Sin ruta de juego' };
  const localeFolders = ['enUS', 'enGB', 'esES', 'esMX', 'deDE', 'frFR', 'ptBR', 'ruRU'];
  let applied = false;
  for (const locale of localeFolders) {
    const localeDir = path.join(settings.gamePath, 'Data', locale);
    if (fs.existsSync(localeDir)) {
      try {
        fs.writeFileSync(path.join(localeDir, 'realmlist.wtf'), CONFIG.realmlist + '\n');
        applied = true;
      } catch {}
    }
  }
  // Also write root realmlist.wtf as fallback
  try {
    fs.writeFileSync(path.join(settings.gamePath, 'realmlist.wtf'), CONFIG.realmlist + '\n');
    applied = true;
  } catch {}
  return { success: applied };
});

// ─── IPC: Patch Config.wtf ───────────────────────────────────────
// Modifies WTF/Config.wtf with game settings (windowed, borderless, etc.)
ipcMain.handle('patches:applyConfigWtf', async (_, configOptions) => {
  if (!settings.gamePath) return { success: false, error: 'Sin ruta de juego' };
  const configPath = path.join(settings.gamePath, 'WTF', 'Config.wtf');

  // Read existing config or start fresh
  let lines = [];
  if (fs.existsSync(configPath)) {
    lines = fs.readFileSync(configPath, 'utf-8').split(/\r?\n/);
  }

  // Helper: set or update a key
  const setKey = (key, value) => {
    const regex = new RegExp(`^SET ${key}\\s+`, 'i');
    const idx = lines.findIndex(l => regex.test(l));
    const entry = `SET ${key} "${value}"`;
    if (idx >= 0) lines[idx] = entry;
    else lines.push(entry);
  };

  // Apply options
  if (configOptions.windowed !== undefined) setKey('gxWindow', configOptions.windowed ? '1' : '0');
  if (configOptions.borderless !== undefined) setKey('gxMaximize', configOptions.borderless ? '1' : '0');
  if (configOptions.vsync !== undefined) setKey('gxVSync', configOptions.vsync ? '1' : '0');
  if (configOptions.sound !== undefined) setKey('Sound_EnableAllSound', configOptions.sound ? '1' : '0');
  if (configOptions.trilinear !== undefined) setKey('graphicsTextureFiltering', configOptions.trilinear ? '3' : '0');

  // Ensure WTF folder exists
  const wtfDir = path.join(settings.gamePath, 'WTF');
  if (!fs.existsSync(wtfDir)) fs.mkdirSync(wtfDir, { recursive: true });

  fs.writeFileSync(configPath, lines.filter(l => l.trim()).join('\r\n') + '\r\n');
  return { success: true };
});

let currentDownloadReq = null;

function downloadFile(url, destPath, progressCallback) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close(); fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath, progressCallback).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close(); fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      const total = parseInt(response.headers['content-length'], 10);
      let downloaded = 0; let lastTick = Date.now();
      response.on('data', chunk => {
        downloaded += chunk.length;
        const now = Date.now();
        if (now - lastTick > 200) {
          lastTick = now;
          if (progressCallback) progressCallback({ downloaded, total, percent: total ? Math.round((downloaded / total) * 100) : 0 });
        }
      });
      response.pipe(file);
      file.on('finish', () => file.close(() => {
        currentDownloadReq = null;
        resolve();
      }));
    });
    
    currentDownloadReq = request;
    
    request.on('error', err => { 
      file.close(); 
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath); 
      currentDownloadReq = null;
      reject(err); 
    });
    
    request.setTimeout(60000, () => { 
      request.destroy(); 
      currentDownloadReq = null;
      reject(new Error('Download timeout')); 
    });
  });
}

ipcMain.handle('patches:cancelDownload', () => {
  if (currentDownloadReq) {
    currentDownloadReq.destroy(new Error('USER_CANCELLED'));
    currentDownloadReq = null;
    return { success: true };
  }
  return { success: false };
});

function getHDPackDest(gamePath, fileName) {
  return path.join(gamePath, 'Data', fileName);
}

ipcMain.handle('patches:downloadHDPack', async (event, packInfo) => {
  if (!settings.gamePath) throw new Error('Sin ruta de juego');
  const destFile = getHDPackDest(settings.gamePath, packInfo.files[0]);

  await downloadFile(packInfo.url, destFile, (progress) => {
    mainWindow?.webContents.send('download:progress', { name: packInfo.name, ...progress });
  });

  settings.hdPacks[packInfo.id] = true;
  saveSettings();
  return { success: true };
});

ipcMain.handle('patches:removeHDPack', async (event, packInfo) => {
  if (!settings.gamePath) throw new Error('Sin ruta de juego');
  const dataPath = path.join(settings.gamePath, 'Data');
  
  for (const file of packInfo.files) {
    const fp = path.join(dataPath, file);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  settings.hdPacks[packInfo.id] = false;
  saveSettings();
  return { success: true };
});

// ─── IPC: Download a server MPQ patch ────────────────────────────
ipcMain.handle('patches:downloadPatch', async (event, patchInfo) => {
  if (!settings.gamePath) throw new Error('Sin ruta de juego');
  const destPath = path.join(settings.gamePath, 'Data', patchInfo.name);
  await downloadFile(patchInfo.url, destPath, (progress) => {
    mainWindow?.webContents.send('download:progress', { name: patchInfo.name, ...progress });
  });
  return { success: true };
});

// ─── IPC: Apply Binary Patches (using bundled patcher tool) ──────
// The Project Reforged patcher (binary_pattern_replace.exe + .bat files)
// is bundled in resources/patcher/ at build time.
// At dev time it's expected in assets/patcher/.
ipcMain.handle('patches:applyBinaryPatches', async () => {
  if (!settings.gamePath) throw new Error('Sin ruta de juego');
  const wowExe = path.join(settings.gamePath, 'WoW.exe');
  if (!fs.existsSync(wowExe)) throw new Error('WoW.exe no encontrado');

  // Patcher tool location (dev: assets/patcher, prod: resources/patcher)
  const patcherDir = app.isPackaged
    ? path.join(process.resourcesPath, 'patcher')
    : path.join(app.getAppPath(), 'assets', 'patcher');

  const patcherExe = path.join(patcherDir, 'binary_pattern_replace.exe');
  if (!fs.existsSync(patcherExe)) {
    throw new Error('Error interno: Falta la herramienta de parcheo en ' + patcherDir);
  }

  // Copy WoW.exe to patcher dir, run selected bats, copy back
  const tempExe = path.join(patcherDir, 'Wow.exe');
  if (!fs.existsSync(wowExe + '.orig')) fs.copyFileSync(wowExe, wowExe + '.orig');
  
  // Ensure we can write to the file (removes read-only attribute if present)
  fs.copyFileSync(wowExe, tempExe);
  try {
    fs.chmodSync(tempExe, 0o666);
  } catch(e) {}

  const manifest = getManifest();
  const batMap = {};
  let applied = 0; const errors = [];
  for (const p of manifest.binaryPatches) {
    if (!p.batFile) continue;
    
    // If mandatory, force it on. Otherwise, check user settings.
    if (p.mandatory) {
      settings.binaryPatches[p.id] = true;
    } else if (settings.binaryPatches[p.id] === false) {
      continue;
    }

    const bat = p.batFile;
    const batPath = path.join(patcherDir, bat);
    if (!fs.existsSync(batPath)) { errors.push(`${bat} no encontrado`); continue; }
    try {
      await new Promise((resolve, reject) => {
        const p = spawn('cmd.exe', ['/c', bat], { cwd: patcherDir, shell: false });
        p.on('close', code => {
          if (code === 0 || code === 4294967294 || code === -2) {
            resolve(); // 4294967294 (-2) significa "patrón no encontrado" (ya parcheado)
          } else {
            reject(new Error(`Exit ${code}`));
          }
        });
        p.on('error', reject);
      });
      applied++;
    } catch (e) {
      errors.push(`${bat}: ${e.message}`);
    }
  }

  // Copy patched exe back
  if (fs.existsSync(tempExe)) {
    fs.copyFileSync(tempExe, wowExe);
    fs.unlinkSync(tempExe);
  }

  saveSettings();
  return { success: true, applied, errors };
});

ipcMain.handle('patches:restoreOriginal', async () => {
  if (!settings.gamePath) throw new Error('Sin ruta de juego');
  const wowExe = path.join(settings.gamePath, 'WoW.exe');
  const orig = wowExe + '.orig';
  if (!fs.existsSync(orig)) throw new Error('No se encontró backup .orig del WoW.exe');
  fs.copyFileSync(orig, wowExe);
  return { success: true };
});

// ─── IPC: Game Launch ────────────────────────────────────────────
ipcMain.handle('game:launch', async () => {
  if (!settings.gamePath) throw new Error('Ruta del juego no configurada');
  const wowExe = path.join(settings.gamePath, 'WoW.exe');
  if (!fs.existsSync(wowExe)) throw new Error('WoW.exe no encontrado');

  // Ensure realmlist is set
  const localeFolders = ['enUS', 'enGB', 'esES', 'esMX', 'deDE', 'frFR', 'ptBR', 'ruRU'];
  for (const locale of localeFolders) {
    const rlPath = path.join(settings.gamePath, 'Data', locale, 'realmlist.wtf');
    if (fs.existsSync(path.dirname(rlPath))) {
      try { fs.writeFileSync(rlPath, CONFIG.realmlist + '\n'); } catch {}
    }
  }

  const proc = spawn(wowExe, [], { cwd: settings.gamePath, detached: true, stdio: 'ignore' });
  proc.unref();

  if (settings.minimizeOnLaunch) mainWindow?.minimize();
  return { success: true };
});

// ─── IPC: Utilities ──────────────────────────────────────────────
ipcMain.handle('util:clearCache', async () => {
  if (!settings.gamePath) throw new Error('Sin ruta de juego');
  const cachePath = path.join(settings.gamePath, 'Cache');
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
    return { success: true, message: 'Cache eliminado correctamente' };
  }
  return { success: true, message: 'No hay cache para limpiar' };
});

ipcMain.handle('util:getGameInfo', async () => {
  if (!settings.gamePath) return null;
  const wowExe = path.join(settings.gamePath, 'WoW.exe');
  if (!fs.existsSync(wowExe)) return null;
  const stats = fs.statSync(wowExe);
  return {
    path: settings.gamePath,
    exeSize: stats.size,
    hasBackup: fs.existsSync(wowExe + '.orig'),
  };
});

// ─── Startup Migration ───────────────────────────────────────────
app.whenReady().then(() => {
  // Try to rescue HD packs from locale folders back to root Data folder 
  // (WotLK engine bugs out with character models in locale folders)
  try {
    if (settings.gamePath && settings.hdPacks) {
      const manifest = getManifest();
      const localesToScan = ['enUS', 'enGB', 'esES', 'esMX', 'deDE', 'frFR', 'ptBR', 'ruRU'];
      
      for (const pack of manifest.hdPacks) {
        if (settings.hdPacks[pack.id]) {
          const rootFile = path.join(settings.gamePath, 'Data', pack.files[0]);
          const baseName = pack.files[0].match(/patch-([a-zA-Z0-9])\.MPQ/i)?.[1].toUpperCase() || 'A';
          
          for (const loc of localesToScan) {
            const locDir = path.join(settings.gamePath, 'Data', loc);
            const possibleFile1 = path.join(locDir, `patch-${loc}-${baseName}.MPQ`);
            const possibleFile2 = path.join(locDir, pack.files[0]);
            
            for (const badFile of [possibleFile1, possibleFile2]) {
              if (fs.existsSync(badFile)) {
                console.log(`Rescatando parche HD: ${badFile} -> ${rootFile}`);
                if (!fs.existsSync(rootFile)) {
                  fs.renameSync(badFile, rootFile);
                } else {
                  fs.unlinkSync(badFile);
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error rescatando parches:', e);
  }
});
