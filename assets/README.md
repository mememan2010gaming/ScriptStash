# Assets Directory

This directory contains application assets including icons.

## Required Icons

For building releases, you'll need to add the following icon files:

### Windows

- `icon.ico` - Windows application icon (256x256, multi-size ICO format)

### macOS

- `icon.icns` - macOS application icon (1024x1024 ICNS format)

### Linux

- `icon.png` - PNG icon (512x512 recommended)
- Or create an `icons/` subdirectory with multiple sizes:
  - `icons/16x16.png`
  - `icons/32x32.png`
  - `icons/48x48.png`
  - `icons/64x64.png`
  - `icons/128x128.png`
  - `icons/256x256.png`
  - `icons/512x512.png`

## Generating Icons

You can use tools like:

- [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker)
- [png2icons](https://github.com/nickyat/png-to-ico)
- [iconutil](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html) (macOS)

### Using electron-icon-maker

```bash
npm install -g electron-icon-maker
electron-icon-maker --input=./logo.png --output=./assets
```

This will generate all required icon formats from a single PNG source.
