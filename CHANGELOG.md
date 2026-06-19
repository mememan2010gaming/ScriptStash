# Changelog

## 2.3.x — Download improvements

### Downloads tab
- Completed downloads now appear in the History list with the correct filename, file size, and date.
- Clicking a history entry opens its folder in Explorer.
- Active downloads show a live progress bar and percentage while yt-dlp is running.
- Fixed a bug where IPC events (`download-complete`, `download-progress`, `download-error`) were silently wiped every time the topic detail page re-rendered, so the Downloads tab never updated.

### yt-dlp
- Downloads now run with 4 concurrent fragments (`-N 4`) for significantly faster speeds on fragmented streams (HLS/DASH).
- Added `--throttled-rate 100K` so yt-dlp automatically retries fragments that drop below 100 KB/s.
- The full yt-dlp command (URL + all flags) is now printed to the console before each run.
- yt-dlp can now be updated from **Settings → Downloads** without restarting the app. The binary also auto-updates silently on launch.
- HTTP 410 errors now correctly suggest updating yt-dlp rather than reporting the video as removed.

### Provider support
- Expanded video link detection to cover ~15 additional hosting providers: Iwara, EPorner, PMVHaven, HQPorner, FapTap, HStream, NoodleMagazine, e621, Boosty, Bilibili, VK, Pixiv, SubscribeStar, and Fanbox.

## 2.2.0 — Themes

Appearance has been rebuilt. Instead of swapping just the background, each theme now reskins the whole app — background, panels, text, borders, and accent all change together.

- **7 full themes:** Rose Noir, Ember, Emerald, Cyan Ice, Indigo Night, Sunset, Carbon, and **Frost** — the first light theme.
- The old environment + accent-color split is gone; pick one theme and the entire interface follows.
- Your previous look carries over automatically (Stealth becomes Carbon; everything else becomes Rose Noir).
- The animated background blobs are replaced by a cleaner static gradient per theme, which is also lighter on your GPU. Carbon keeps a subtle film grain.
- Your chosen theme now applies instantly on launch with no flash.

## 2.1.x — Automatic Updates

ScriptStash can now update itself in the background — no need to download and reinstall every time there's a new version.

- Update checks and download progress are now logged to the console for easier debugging.
- When an update is available, you'll see a notification at the bottom of the screen.
- Once it's downloaded and ready, click **Restart & Install** in the Updates tab to apply it.
- Automatic updates work on Windows (x64) and Linux. On other platforms, clicking "Check now" will open the download page if a newer version is out.

## 2.1.x — Expanded video support

ScriptStash no longer relies on a fixed list of supported video sites. Any link that isn't a direct file download is now routed through yt-dlp automatically, which means sites like xHamster, PornDig, Twitter/X, Fantia, and hundreds of others work out of the box. If a URL turns out to be a plain file link, it falls back to a direct download seamlessly.

## 2.0.x — Redesign

- Brand new look with a glass-panel style and animated background.
- Three visual themes to choose from: **Aurora**, **Mesh**, and **Stealth**.
- Accent color picker: Rose, Violet, Cyan, or Amber.
- Settings page with tabs for appearance, downloads, and more.
- Smoother browsing with better topic cards, search, and download tracking.
