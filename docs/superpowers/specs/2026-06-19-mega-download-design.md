# MEGA Download Support

**Date:** 2026-06-19
**Status:** Approved

## Problem

MEGA uses client-side encryption — the decryption key lives in the URL fragment and never reaches the server. A plain HTTP GET returns an HTML page, not the file. The current downloader falls through to `downloadDirect` for MEGA URLs, saving the HTML page with a `.mp4` extension.

## Goals

- Download single MEGA files (`mega.nz/file/...`) natively, with progress reporting
- Download files from MEGA folders (`mega.nz/folder/...`) with a file picker when the folder contains more than one file
- No account required (public links only)

## Non-Goals

- Private/account-gated MEGA links
- Preserving folder structure on disk (all files go flat into the download directory)
- Streaming video playback from MEGA

---

## Architecture

### Package

Add `megajs` as a runtime dependency. Key API used:

```js
const { File } = require('megajs')

// Single file or folder
const file = File.fromURL(url)
await file.loadAttributes()   // fetches name, size, children (for folders)
const stream = file.download() // ReadableStream of decrypted bytes
```

For folders, `file.children` is an array of `File` nodes (flattened by iterating the tree).

---

## Service Layer (`main/services/download.service.js`)

### `detectUrlType` — no change needed

Already returns `'mega'` for `mega.nz` URLs.

### `verifyUrl` — replace the mega stub

Current: `return { valid: false, needsBrowser: true }`

New behavior:
1. Call `File.fromURL(url).loadAttributes()`
2. If it's a single file (or a folder with exactly one file): return `{ valid: true, filename, size }`
3. If it's a folder with multiple files: return `{ valid: true, isMegaFolder: true, files: [{ name, size, nodeId }] }` where files is the flattened list of all leaf nodes
4. On any error: return `{ valid: false, error: error.message }`

`nodeId` is the node's `.nodeId` property from megajs — used later to identify which child to download.

### `downloadFromMega(url, filename, window, downloadId, nodeId?)` — new method

```
downloadFromMega(url, filename, window, downloadId, nodeId?)
```

1. Call `File.fromURL(url).loadAttributes()`
2. If `nodeId` is provided (folder child), find the matching child node; otherwise use the root node
3. Use the node's `.name` as the real filename (overrides the passed `filename`)
4. Stream `node.download()` → `fs.createWriteStream(filePath)`
5. Track bytes via the stream's `data` event; fire `download-progress` IPC events with the same payload shape as `downloadDirect`:
   ```js
   { downloadId, filename, url, progress, bytesReceived, totalBytes }
   ```
6. On completion call `addToHistory` and send `download-complete`
7. On error clean up the partial file and rethrow

### `executeDownload` — add `'mega'` case

```js
} else if (urlType === 'mega') {
  result = await this.downloadFromMega(url, filename, window, downloadId)
}
```

The `nodeId` parameter is not used here — folder downloads are split into individual calls at the IPC layer before they reach `executeDownload`.

---

## IPC Layer (`main/ipc/`)

### New handler: `mega:get-folder-files`

**Input:** `{ url: string }`

**Behavior:**
1. Call `File.fromURL(url).loadAttributes()`
2. If it's a single file or not a folder: return `{ success: true, isSingleFile: true }`
3. If it's a folder: flatten all leaf nodes, return:
   ```js
   {
     success: true,
     isSingleFile: false,
     folderName: string,
     files: [{ name: string, size: number, nodeId: string }]
   }
   ```
4. On error: return `{ success: false, error: string }`

Flattening: recursively walk `node.children`, collect nodes that have no children (leaves).

---

## Renderer (`renderer/src/`)

### Preload (`main/preload.js`)

Expose the new channel:
```js
getMegaFolderFiles: (url) => ipcRenderer.invoke('mega:get-folder-files', { url })
```

### `MegaFolderPicker` — new component

`renderer/src/components/MegaFolderPicker.jsx`

**Props:** `{ url, folderName, files, onConfirm, onCancel }`

- Modal overlay using existing modal patterns in the app
- Title: folder name
- "Select All" / "Select None" toggle
- Scrollable file list — each row: checkbox, filename, human-readable size
- "Download N files" button (disabled when 0 selected)
- Cancel button

**State:** local `Set` of selected `nodeId`s, initialised with all files selected.

`onConfirm` receives the array of selected `{ name, size, nodeId }` objects.

### Integration point

Wherever download is initiated in the renderer (topic detail, search results), wrap the MEGA URL path:

```
if url contains 'mega.nz':
  call getMegaFolderFiles(url)
  if isSingleFile → queue download normally
  if folder with 1 file → queue that file directly
  if folder with >1 files → open MegaFolderPicker
    onConfirm: for each selected file, call downloadFile(url, file.name, { nodeId: file.nodeId })
```

The existing `downloadFile` IPC call needs to accept an optional `nodeId` option and thread it through to `downloadFromMega`.

---

## Data Flow

```
Renderer clicks "Download" on a MEGA URL
  │
  ├─ calls mega:get-folder-files(url)
  │     └─ loadAttributes() → returns file list or isSingleFile
  │
  ├─ if isSingleFile → downloadFile(url, name)
  │     └─ executeDownload → downloadFromMega(url, name, window, id)
  │
  └─ if folder with >1 files → MegaFolderPicker modal
        └─ user selects files → onConfirm
              └─ for each: downloadFile(url, file.name, { nodeId })
                    └─ executeDownload → downloadFromMega(url, name, window, id, nodeId)
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Link expired / deleted | `loadAttributes` throws → `verifyUrl` returns `{ valid: false, error }` |
| Network error mid-download | Partial file deleted, `download-error` IPC sent |
| Folder with 0 files | `verifyUrl` returns `{ valid: false, error: 'Empty folder' }` |
| Single-file folder | Treated as a direct file download, no picker shown |

---

## Files to Create

- `renderer/src/components/MegaFolderPicker.jsx`

## Files to Modify

- `package.json` — add `megajs`
- `main/services/download.service.js` — `verifyUrl`, `executeDownload`, new `downloadFromMega`
- `main/ipc/` — new `mega:get-folder-files` handler (new file or added to existing download handler file)
- `main/preload.js` — expose `getMegaFolderFiles`
- Renderer download initiation — wrap MEGA URLs with folder detection
