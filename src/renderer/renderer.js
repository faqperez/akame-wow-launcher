/* ═══════════════════════════════════════════════════════════════
   AKAME LAUNCHER - Renderer Process
   Handles all UI logic, state management, and user interactions
   ═══════════════════════════════════════════════════════════════ */

// ─── State ───────────────────────────────────────────────────────
let config = {};
let settings = {
  binaryPatches: { ram4gb: true, sigBypass: true, mouseFix: true },
};
let manifest = {};
let serverStatus = { online: false };
let currentView = 'news';
let isPatching = false;

// ─── Initialization ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load config and settings
  config = await window.akame.config.get();
  settings = await window.akame.settings.get();

  // Setup UI
  setupWindowControls();
  setupNavigation();
  setupSettings();
  setupEventListeners();

  // Load data
  await loadNews();
  await checkServerStatus();
  await loadPatchManifest();
  await updatePatchStatus();

  // Update play button state
  updatePlayButton();

  // Periodic server status check
  setInterval(checkServerStatus, 30000);
});

// ─── Window Controls ─────────────────────────────────────────────
function setupWindowControls() {
  document.getElementById('btn-minimize').addEventListener('click', () => {
    window.akame.window.minimize();
  });
  document.getElementById('btn-maximize').addEventListener('click', () => {
    window.akame.window.maximize();
  });
  document.getElementById('btn-close').addEventListener('click', () => {
    window.akame.window.close();
  });
}

// ─── Navigation ──────────────────────────────────────────────────
function setupNavigation() {
  // Titlebar nav links
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.link;
      const urls = {
        website: config.websiteUrl,
        shop: config.shopUrl,
        forum: config.forumUrl,
        discord: config.discordUrl,
      };
      if (urls[target]) {
        window.akame.shell.openExternal(urls[target]);
      }
    });
  });

  // Quick links
  document.querySelectorAll('.quick-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.link;
      const urls = {
        changelog: config.changelogUrl,
        bugtracker: config.bugTrackerUrl,
      };
      if (urls[target]) {
        window.akame.shell.openExternal(urls[target]);
      }
    });
  });

  // Settings button
  document.getElementById('btn-settings').addEventListener('click', () => {
    if (currentView === 'settings') {
      switchView('news');
    } else {
      switchView('settings');
    }
  });
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  // Toggle settings button active state
  document.getElementById('btn-settings').classList.toggle('active', viewName === 'settings');
}

// ─── Server Status ───────────────────────────────────────────────
async function checkServerStatus() {
  try {
    serverStatus = await window.akame.server.checkStatus();

    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    const realmName = document.getElementById('realm-name');
    const realmType = document.getElementById('realm-type');

    realmName.textContent = serverStatus.realmName;
    realmType.textContent = serverStatus.realmType;

    if (serverStatus.online) {
      dot.className = 'status-dot online';
      text.textContent = 'Online';
      text.style.color = 'var(--online)';
    } else {
      dot.className = 'status-dot offline';
      text.textContent = 'Offline';
      text.style.color = 'var(--offline)';
    }
  } catch (e) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    dot.className = 'status-dot offline';
    text.textContent = 'Error de conexión';
    text.style.color = 'var(--text-muted)';
  }
}

// ─── News Feed ───────────────────────────────────────────────────
async function loadNews() {
  const container = document.getElementById('news-list');

  try {
    const news = await window.akame.news.fetch();

    if (!news || news.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay noticias disponibles</p>
        </div>
      `;
      return;
    }

    container.innerHTML = news.map((item) => `
      <div class="news-card" data-url="${item.url || '#'}">
        <div class="news-image">
          ${item.image
            ? `<img src="${item.image}" alt="${item.title}" loading="lazy">`
            : `<div class="news-image-placeholder">
                <svg viewBox="0 0 24 24" width="32" height="32"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              </div>`
          }
        </div>
        <div class="news-content">
          <h3 class="news-title">${escapeHtml(item.title)}</h3>
          <p class="news-description">${escapeHtml(item.description)}</p>
          <span class="news-date">${formatDate(item.date)}</span>
        </div>
      </div>
    `).join('');

    // Click to open news in browser
    container.querySelectorAll('.news-card').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.dataset.url;
        if (url && url !== '#') {
          window.akame.shell.openExternal(url);
        }
      });
    });
  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Error al cargar noticias</p>
      </div>
    `;
  }
}

// ─── Patch Management ────────────────────────────────────────────
async function loadPatchManifest() {
  try {
    manifest = await window.akame.patches.getManifest();
    renderBinaryPatches();
    renderHDPacks();
  } catch (e) {
    console.error('Error loading patch manifest:', e);
  }
}

function renderBinaryPatches() {
  const container = document.getElementById('essential-patches');
  if (!manifest.binaryPatches || !container) return;

  container.innerHTML = manifest.binaryPatches.map((patch) => createPatchToggle(patch)).join('');

  // Setup toggle events
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', async () => {
      if (!settings.binaryPatches) settings.binaryPatches = {};
      settings.binaryPatches[input.dataset.patchId] = input.checked;
      await window.akame.settings.save(settings);
    });
  });
}

function createPatchToggle(patch) {
  const checked = patch.mandatory ? true : (settings.binaryPatches?.[patch.id] !== false);
  return `
    <div class="patch-toggle ${patch.mandatory ? 'mandatory' : ''}">
      <label class="toggle-switch">
        <input type="checkbox" data-patch-id="${patch.id}" ${checked ? 'checked' : ''} ${patch.mandatory ? 'disabled' : ''}>
        <span class="toggle-slider"></span>
      </label>
      <div class="patch-label">
        <div class="patch-name">
          ${escapeHtml(patch.name)}
          ${patch.mandatory ? '<span class="hd-badge badge-core">Obligatorio</span>' : ''}
        </div>
        <div class="patch-desc">${escapeHtml(patch.description)}</div>
      </div>
      ${patch.offset ? `<span class="patch-offset">${patch.offset}</span>` : ''}
    </div>
  `;
}

function renderHDPacks() {
  const container = document.getElementById('hd-packs-list');
  if (!manifest.hdPacks || !container) return;

  const categoryLabel = { core: 'Core', optional: 'Opcional' };
  const categoryClass = { core: 'badge-core', optional: 'badge-opt' };

  container.innerHTML = manifest.hdPacks.map((pack) => {
    const installed = settings.hdPacks?.[pack.id] || false;
    const cat = pack.category || 'core';
    
    let variantSelect = '';
    if (!installed && pack.variants && pack.variants.length > 0) {
      variantSelect = `
        <select class="variant-select" id="variant-${pack.id}">
          ${pack.variants.map(v => `<option value="${v.url}">${v.name}</option>`).join('')}
        </select>
      `;
    }

    return `
      <div class="hd-pack-item" data-pack-id="${pack.id}">
        <div class="hd-pack-info">
          <div class="hd-pack-name">
            ${escapeHtml(pack.name)}
            <span class="hd-badge ${categoryClass[cat]}">${categoryLabel[cat] || cat}</span>
          </div>
          <div class="hd-pack-desc">${escapeHtml(pack.description)}</div>
          ${pack.note ? `<div class="hd-pack-note">⚠ ${escapeHtml(pack.note)}</div>` : ''}
        </div>
        <span class="hd-pack-status ${installed ? 'installed' : 'not-installed'}">
          ${installed ? '✓ Instalado' : 'No instalado'}
        </span>
        <div class="hd-pack-actions">
          ${installed
            ? `<button class="btn-secondary btn-small" data-action="remove" data-pack-id="${pack.id}">Remover</button>`
            : `${variantSelect}
               <button class="btn-primary btn-small" data-action="download" data-pack-id="${pack.id}">Descargar</button>`
          }
        </div>
      </div>
    `;
  }).join('');

  // Setup HD pack button events
  container.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const packId = btn.dataset.packId;
      const action = btn.dataset.action;
      const pack = manifest.hdPacks.find((p) => p.id === packId);

      if (!pack) return;

      if (action === 'download') {
        const clonedPack = { ...pack };
        if (clonedPack.variants && clonedPack.variants.length > 0) {
          const select = document.getElementById(`variant-${packId}`);
          if (select) clonedPack.url = select.value;
        }
        await downloadHDPack(clonedPack);
      } else if (action === 'remove') {
        await removeHDPack(pack);
      }
    });
  });
}

async function downloadHDPack(pack) {
  if (!settings.gamePath) {
    showToast('Configurá la ruta del juego primero', 'warning');
    return;
  }

  isPatching = true;
  updatePlayButton();

  try {
    const missingDeps = [];
    if (pack.requires) {
      for (const req of pack.requires) {
        if (!settings.hdPacks?.[req]) {
          const reqPack = manifest.hdPacks.find(p => p.id === req);
          if (reqPack) missingDeps.push(reqPack);
        }
      }
    }

    if (missingDeps.length > 0) {
      showToast(`${pack.name} requiere otras partes. Se descargarán automáticamente en cola.`, 'info');
      for (const depPack of missingDeps) {
        showDownloadBar(depPack.name);
        window.akame.on('download:progress', (data) => updateDownloadBar(data.percent));
        await window.akame.patches.downloadHDPack(depPack);
        window.akame.removeAllListeners('download:progress');
        settings.hdPacks[depPack.id] = true;
      }
    }

    showDownloadBar(pack.name);
    window.akame.on('download:progress', (data) => updateDownloadBar(data.percent));
    await window.akame.patches.downloadHDPack(pack);
    settings.hdPacks[pack.id] = true;

    hideDownloadBar();
    showToast(`${pack.name} instalado correctamente`, 'success');

    // Reload settings and re-render
    settings = await window.akame.settings.get();
    renderHDPacks();
  } catch (e) {
    hideDownloadBar();
    if (e.message.includes('EBUSY')) {
      showToast(`Error: Cierra el juego antes de actualizar o descargar parches.`, 'error');
    } else if (e.message.includes('USER_CANCELLED')) {
      showToast(`Descarga cancelada.`, 'info');
    } else {
      showToast(`Error al descargar ${pack.name}: ${e.message}`, 'error');
    }
  } finally {
    isPatching = false;
    await updatePatchStatus();
    updatePlayButton();
    window.akame.removeAllListeners('download:progress');
  }
}

async function removeHDPack(pack) {
  try {
    await window.akame.patches.removeHDPack(pack);
    showToast(`${pack.name} removido`, 'info');

    settings = await window.akame.settings.get();
    renderHDPacks();
    await updatePatchStatus();
    updatePlayButton();
  } catch (e) {
    if (e.message.includes('EBUSY')) {
      showToast(`No se pudo remover ${pack.name}: El juego está abierto. Cerralo primero.`, 'error');
    } else {
      showToast(`Error al remover ${pack.name}: ${e.message}`, 'error');
    }
  }
}

let lastStatus = null;

async function updatePatchStatus() {
  try {
    const status = await window.akame.patches.checkStatus();
    lastStatus = status;

    if (!status.ready) {
      if (status.hdError) {
        showWarning('Dependencia faltante', status.hdError);
      } else if (status.error) {
        showWarning('Atención', status.error);
      }
    } else {
      hideWarning();
    }

    // Update realmlist status
    const rlStatus = document.getElementById('realmlist-status');
    if (status.realmlistOk) {
      rlStatus.textContent = '✓ Realmlist configurado correctamente';
      rlStatus.className = 'realmlist-status ok';
    } else if (settings.gamePath) {
      rlStatus.textContent = '✗ Realmlist no configurado';
      rlStatus.className = 'realmlist-status error';
    }
  } catch (e) {
    console.error('Error checking patch status:', e);
  }
}

// ─── Settings Setup ──────────────────────────────────────────────
function setupSettings() {
  // Game path
  const pathInput = document.getElementById('input-game-path');
  pathInput.value = settings.gamePath || '';

  document.getElementById('btn-browse').addEventListener('click', async () => {
    const result = await window.akame.settings.selectGamePath();
    if (result.success) {
      pathInput.value = result.path;
      settings.gamePath = result.path;
      showToast('Ruta del juego configurada', 'success');
      await updatePatchStatus();
      updatePlayButton();
      hideWarning();

      // Show game info
      const gameInfo = await window.akame.util.getGameInfo();
      if (gameInfo) {
        document.getElementById('game-info').innerHTML = `
          <span>📁 ${gameInfo.path}</span>
          ${gameInfo.hasBackup ? '<span style="color:var(--online);margin-left:12px;">✓ Backup disponible</span>' : ''}
        `;
      }
    } else if (result.error !== 'Cancelado') {
      showToast(result.error, 'error');
    }
  });

  // Realmlist
  document.getElementById('realmlist-display').textContent = config.realmlist || 'set realmlist logon.akame-wow.com';

  document.getElementById('btn-apply-realmlist').addEventListener('click', async () => {
    try {
      const result = await window.akame.patches.applyRealmlist();
      if (result.success) {
        showToast('Realmlist aplicado correctamente', 'success');
        await updatePatchStatus();
      } else {
        showToast(result.error, 'error');
      }
    } catch (e) {
      showToast('Error al aplicar realmlist: ' + e.message, 'error');
    }
  });

  // Game Config (Config.wtf)
  const chkWindowed = document.getElementById('cfg-windowed');
  const chkBorderless = document.getElementById('cfg-borderless');

  // Load state from settings
  chkWindowed.checked = settings.gameConfig?.windowed || false;
  chkBorderless.checked = settings.gameConfig?.borderless || false;

  const saveGameConfig = async () => {
    if (!settings.gameConfig) settings.gameConfig = {};
    settings.gameConfig.windowed = chkWindowed.checked;
    settings.gameConfig.borderless = chkBorderless.checked;
    await window.akame.settings.save(settings);
  };

  const updateBorderlessState = () => {
    const parent = chkBorderless.closest('.patch-toggle');
    if (!chkWindowed.checked) {
      chkBorderless.checked = false;
      chkBorderless.disabled = true;
      if (parent) parent.classList.add('disabled');
    } else {
      chkBorderless.disabled = false;
      if (parent) parent.classList.remove('disabled');
    }
  };

  chkWindowed.addEventListener('change', () => {
    updateBorderlessState();
    saveGameConfig();
  });
  
  chkBorderless.addEventListener('change', () => {
    saveGameConfig();
  });

  // Call on load
  updateBorderlessState();

  document.getElementById('btn-apply-config').addEventListener('click', async () => {
    if (!settings.gamePath) {
      showToast('Configurá la ruta del juego primero', 'warning');
      return;
    }
    const statusEl = document.getElementById('config-status');
    statusEl.textContent = 'Aplicando...';
    try {
      const result = await window.akame.patches.applyConfigWtf({
        windowed: chkWindowed.checked,
        borderless: chkBorderless.checked,
      });
      if (result.success) {
        showToast('Configuración del juego aplicada', 'success');
        statusEl.textContent = '¡Aplicado con éxito!';
      } else {
        showToast(result.error, 'error');
        statusEl.textContent = '';
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
      statusEl.textContent = '';
    }
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  });

  // Apply binary patches
  document.getElementById('btn-apply-patches').addEventListener('click', async () => {
    if (!settings.gamePath) {
      showToast('Configurá la ruta del juego primero', 'warning');
      return;
    }

    try {
      const result = await window.akame.patches.applyBinaryPatches();
      if (result.success) {
        let msg = `${result.applied} parche(s) aplicado(s)`;
        if (result.backupCreated) msg += ' (backup creado)';
        showToast(msg, 'success');

        if (result.errors.length > 0) {
          showToast(`Errores: ${result.errors.join(', ')}`, 'warning');
        }
      }
    } catch (e) {
      showToast('Error al aplicar parches: ' + e.message, 'error');
    }
  });

  // Restore original
  document.getElementById('btn-restore-exe').addEventListener('click', async () => {
    try {
      const result = await window.akame.patches.restoreOriginal();
      if (result.success) {
        showToast('WoW.exe restaurado al original', 'success');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });

  // Clear cache (Settings View)
  document.getElementById('btn-clear-cache').addEventListener('click', async () => {
    try {
      const result = await window.akame.util.clearCache();
      showToast(result.message, 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });

  // Clear cache (Sidebar)
  document.getElementById('btn-sidebar-clear-cache').addEventListener('click', async () => {
    try {
      const result = await window.akame.util.clearCache();
      showToast(result.message, 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });

  // Minimize checkbox
  const chkMinimize = document.getElementById('chk-minimize');
  chkMinimize.checked = settings.minimizeOnLaunch !== false;
  chkMinimize.addEventListener('change', async () => {
    settings.minimizeOnLaunch = chkMinimize.checked;
    await window.akame.settings.save(settings);
  });
}

// ─── Event Listeners ─────────────────────────────────────────────
function setupEventListeners() {
  // Play button
  document.getElementById('btn-play').addEventListener('click', async () => {
    if (isPatching) return;

    if (!settings.gamePath) {
      showToast('Configurá la ruta del juego primero', 'warning');
      switchView('settings');
      return;
    }

    try {
      // Apply realmlist before launching
      await window.akame.patches.applyRealmlist();
      
      // Launch game
      const result = await window.akame.game.launch();
      if (result.success) {
        showToast('¡Juego iniciado! Buena suerte en Azeroth 🎮', 'success');
      }
    } catch (e) {
      showToast('Error al iniciar el juego: ' + e.message, 'error');
    }
  });

  // Cancel download
  document.getElementById('btn-cancel-download').addEventListener('click', async () => {
    try {
      const result = await window.akame.patches.cancelDownload();
      if (result.success) {
        showToast('Descarga cancelada', 'warning');
      }
    } catch (e) {
      showToast('Error al cancelar: ' + e.message, 'error');
    }
  });
}

// ─── Play Button State ───────────────────────────────────────────
function updatePlayButton() {
  const btn = document.getElementById('btn-play');
  const playText = btn.querySelector('.play-text');

  if (isPatching) {
    btn.disabled = true;
    btn.classList.add('patching');
    playText.textContent = 'DESCARGANDO...';
    return;
  }

  btn.classList.remove('patching');

  if (!settings.gamePath) {
    btn.disabled = true;
    playText.textContent = 'CONFIGURAR';
    showWarning('Configuración necesaria', 'Configurá la ruta del juego');
  } else if (lastStatus && !lastStatus.ready) {
    btn.disabled = true;
    playText.textContent = 'FALTAN PARCHES';
  } else {
    btn.disabled = false;
    playText.textContent = 'JUGAR';
  }
}

// ─── Warning Banner ──────────────────────────────────────────────
function showWarning(title, description) {
  const banner = document.getElementById('warning-banner');
  document.getElementById('warning-title').textContent = title;
  document.getElementById('warning-desc').textContent = description;
  banner.style.display = 'flex';
}

function hideWarning() {
  document.getElementById('warning-banner').style.display = 'none';
}

// ─── Download Bar ────────────────────────────────────────────────
function showDownloadBar(name) {
  const bar = document.getElementById('download-bar');
  document.getElementById('download-name').textContent = `Descargando: ${name}`;
  document.getElementById('download-percent').textContent = '0%';
  document.getElementById('download-fill').style.width = '0%';
  bar.style.display = 'flex';
}

function updateDownloadBar(percent) {
  document.getElementById('download-percent').textContent = `${percent}%`;
  document.getElementById('download-fill').style.width = `${percent}%`;
}

function hideDownloadBar() {
  document.getElementById('download-bar').style.display = 'none';
}

// ─── Toast Notifications ─────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─── Utilities ───────────────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
