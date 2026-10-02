const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('akame', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },

  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    selectGamePath: () => ipcRenderer.invoke('settings:selectGamePath'),
  },

  // Config
  config: {
    get: () => ipcRenderer.invoke('config:get'),
  },

  // Shell
  shell: {
    openExternal: (url) => ipcRenderer.send('shell:openExternal', url),
  },

  // Server status
  server: {
    checkStatus: () => ipcRenderer.invoke('server:checkStatus'),
  },

  // News
  news: {
    fetch: () => ipcRenderer.invoke('news:fetch'),
  },

  // Patches
  patches: {
    getManifest: () => ipcRenderer.invoke('patches:getManifest'),
    checkStatus: () => ipcRenderer.invoke('patches:checkStatus'),
    applyRealmlist: () => ipcRenderer.invoke('patches:applyRealmlist'),
    downloadPatch: (patchInfo) => ipcRenderer.invoke('patches:downloadPatch', patchInfo),
    downloadHDPack: (packInfo) => ipcRenderer.invoke('patches:downloadHDPack', packInfo),
    cancelDownload: () => ipcRenderer.invoke('patches:cancelDownload'),
    removeHDPack: (packInfo) => ipcRenderer.invoke('patches:removeHDPack', packInfo),
    applyBinaryPatches: () => ipcRenderer.invoke('patches:applyBinaryPatches'),
    applyConfigWtf: (opts) => ipcRenderer.invoke('patches:applyConfigWtf', opts),
    restoreOriginal: () => ipcRenderer.invoke('patches:restoreOriginal'),
  },

  // Game
  game: {
    launch: () => ipcRenderer.invoke('game:launch'),
  },

  // Utilities
  util: {
    clearCache: () => ipcRenderer.invoke('util:clearCache'),
    getGameInfo: () => ipcRenderer.invoke('util:getGameInfo'),
  },

  // Events
  on: (channel, callback) => {
    const validChannels = ['download:progress'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data));
    }
  },

  removeAllListeners: (channel) => {
    const validChannels = ['download:progress'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});
