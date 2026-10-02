# Akame WoW Launcher

Launcher para el servidor de World of Warcraft **Akame** (WotLK 3.3.5a, build 12340).

## Features

- 🎮 **Lanzador del juego** - Inicia WoW con la realmlist configurada automáticamente
- 📰 **Noticias del servidor** - Feed de noticias integrado
- 🌐 **Estado del servidor** - Verificación en tiempo real del realm
- 📦 **Auto-patching** - Descarga y aplica parches MPQ automáticamente
- 🔧 **Parches binarios** - 12 parches para mejorar el cliente (borderless, fixes, etc.)
- 🎨 **Paquetes HD** - Texturas y modelos en alta definición opcionales
- ⚙️ **Configuración** - Ruta del juego, realmlist, opciones de parches
- 🔗 **Links rápidos** - Sitio web, Discord, Foro, Bug Tracker

## Parches Binarios Incluidos (Build 12340)

### Esenciales / Corrección de Bugs
| Parche | Descripción | Offset |
|--------|-------------|--------|
| SIG & MD5 Protection Remover | Desactiva verificación de firma | - |
| Borderless Fullscreen | Modo ventana sin bordes | 0x0E94 |
| Melee Swing Right-Click | Fix swing con click derecho | 0x2E1C67 |
| NPC Attack Animation | Fix animación al girar | 0x33D7C9 |
| Ghost Attack Fix | Fix ataques fantasma en evade | 0x0355BF |
| Pre-Cast Animation | Fix animación pre-cast | 0x33E0D6 |
| Naked Character Fix | Desactiva SPELL_AURA_X_RAY | 0x1DDC5D |
| Mail Timeout | Sin espera de 60s para mail | 0x16D899 |
| Area Trigger Timer | 250ms → 50ms más preciso | 0x2DB241 |
| Chat While Dead | Comandos mientras muerto | 0x10CA41 |
| Character List Limit | 10 → 20 personajes | 0x6404F |

### Cosmético
| Parche | Descripción | Offset |
|--------|-------------|--------|
| Blue Moon | Restaurar luna azul | 0x5CFBC0 |

## Paquetes HD Opcionales
- **HD Battlegrounds** - Texturas mejoradas de BGs
- **HD Creatures** - Modelos HD de criaturas
- **HD Misc** - Contenido HD misceláneo
- **HD Spells** - Efectos de hechizos en HD
- **HD Textures** - Texturas del mundo en HD

## Desarrollo

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
npm install
```

### Ejecutar en modo desarrollo
```bash
npm run dev
```

### Compilar para Windows
```bash
npm run build:win
```

### Compilar portable
```bash
npm run build:portable
```

## Estructura del Proyecto
```
akame-wow-launcher/
├── package.json
├── assets/              # Iconos y recursos
├── build/               # Recursos de build (iconos)
├── src/
│   ├── main/
│   │   └── main.js      # Proceso principal de Electron
│   ├── preload/
│   │   └── preload.js   # Bridge IPC seguro
│   └── renderer/
│       ├── index.html   # UI principal
│       ├── style.css    # Estilos (tema oscuro)
│       └── renderer.js  # Lógica de la UI
└── dist/                # Builds compilados
```

## Configuración del Servidor

Editá los valores en `src/main/main.js` en el objeto `CONFIG`:

```javascript
const CONFIG = {
  serverName: 'Akame',
  realmlist: 'set realmlist logon.akame-wow.com',
  websiteUrl: 'https://akame-wow.com',
  discordUrl: 'https://discord.gg/akame',
  // ... más opciones
};
```

## Licencia

MIT
