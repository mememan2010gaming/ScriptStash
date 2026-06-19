<div align="center">

<img src="assets/icons/128x128.png" width="96" alt="ScriptStash" />

# ScriptStash

**A native desktop browser and downloader for EroScripts**

[![Version](https://img.shields.io/badge/version-2.4.4-crimson?style=flat-square)](../../releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square&logo=electron&logoColor=white)](../../releases)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/license-Custom-lightgrey?style=flat-square)](LICENSE)


[**Download**](../../releases/latest) &nbsp;·&nbsp; [**Report a Bug**](../../issues) &nbsp;·&nbsp; [**Request a Feature**](../../issues)

</div>

---

## Features

- **Script browser** — Browse free and paid scripts from EroScripts directly in a native app
- **Download queue** — Concurrent downloads (up to 10 at once) with live progress tracking
- **Video support** — Download video links via `yt-dlp`, fetched automatically on first run
- **Ad blocker** — EasyList-based ad filtering applied to the main window
- **Auto-update** — Checks GitHub releases for new versions on launch
- **Encrypted storage** — Auth cookies and settings stored locally with encryption

---

## Install

Download the latest build from the [**Releases**](../../releases/latest) page.

| Platform | File |
|----------|------|
| Windows | `ScriptStash-Setup.exe` |
| macOS (Intel) | `.zip` (x64) |
| macOS (Apple Silicon) | `.zip` (arm64) |
| Linux | `.AppImage` |
| Android (experimental) | `.apk` |

---

## Build from Source

**Requirements:** Node.js 18+, npm 9+

```sh
git clone https://github.com/mememan2010gaming/ScriptStash.git
cd ScriptStash
npm install
npm run dev
```

To build a distributable:

```sh
npm run make
```

---

## Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + Electron with hot reload |
| `npm run build:renderer` | Build the renderer only |
| `npm run package` | Package the app (no installer) |
| `npm run make` | Build installers |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |

Run a specific test file:

```sh
npx jest __tests__/api.test.js
```

---

## Architecture

ScriptStash is a two-process Electron app. The **main process** (`main/`) handles all API calls, auth, downloads, and IPC. The **renderer** (`renderer/src/`) is a React 18 SPA built with Vite.

```
main/
  index.js          # Entry point, IPC handler registration
  window.js         # BrowserWindow setup
  preload.js        # window.electronAPI surface (contextBridge)
  store/config.js   # Encrypted electron-store
  services/
    api.service.js       # EroScripts Discourse API + caching
    auth.service.js      # Session cookie management
    download.service.js  # Queued download manager
    adblocker.service.js # EasyList ad blocking
    update.service.js    # GitHub release checks
  ipc/              # ipcMain.handle registrations

renderer/src/
  App.jsx           # Root, view routing
  components/
    layout/AppShell.jsx
  hooks/useIpc.js   # window.electronAPI wrapper
  context/          # Theme, Download, Toast providers
```

IPC flow: `window.electronAPI.*` (preload) → `ipcRenderer.invoke` → `ipcMain.handle` → service → back to renderer.

---

## Configuration

Settings are stored locally with encrypted storage:

| OS | Path |
|----|------|
| Windows | `%APPDATA%\scriptstash\` |
| macOS | `~/Library/Application Support/scriptstash/` |
| Linux | `~/.config/scriptstash/` |

Stored data: auth cookies (encrypted), download path, download history, app settings.

---

## Contributing

1. Fork the repo and create a branch (`feature/...` or `fix/...`)
2. Run `npm run lint` and `npm run format` before committing
3. Add tests for new behavior
4. Open a PR with a clear description of the change

---

## License

See [LICENSE](LICENSE).
