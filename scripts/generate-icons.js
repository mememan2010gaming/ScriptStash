#!/usr/bin/env node
/**
 * Generates icon.ico (Windows) and icon.icns (macOS) from the PNG files in assets/icons/.
 * Run from the project root: node scripts/generate-icons.js
 */

const fs = require('fs')
const path = require('path')

const ASSETS = path.join(__dirname, '..', 'assets')
const ICONS = path.join(ASSETS, 'icons')

// ── ICO (Vista+ PNG-in-ICO, supports all sizes cleanly) ──────────────────────
const icoSizes = [16, 32, 48, 64, 128, 256]
const icoPngs = icoSizes.map(s => ({
  size: s,
  data: fs.readFileSync(path.join(ICONS, `${s}x${s}.png`)),
}))

const count = icoPngs.length
const dirOffset = 6 + count * 16
let dataOffset = dirOffset
const offsets = icoPngs.map(p => {
  const o = dataOffset
  dataOffset += p.data.length
  return o
})

const icoBuf = Buffer.alloc(dataOffset)
icoBuf.writeUInt16LE(0, 0) // reserved
icoBuf.writeUInt16LE(1, 2) // type = icon
icoBuf.writeUInt16LE(count, 4)

icoPngs.forEach((p, i) => {
  const b = 6 + i * 16
  const dim = p.size >= 256 ? 0 : p.size
  icoBuf.writeUInt8(dim, b + 0)
  icoBuf.writeUInt8(dim, b + 1)
  icoBuf.writeUInt8(0, b + 2) // color count
  icoBuf.writeUInt8(0, b + 3) // reserved
  icoBuf.writeUInt16LE(1, b + 4) // planes
  icoBuf.writeUInt16LE(32, b + 6) // bit depth
  icoBuf.writeUInt32LE(p.data.length, b + 8)
  icoBuf.writeUInt32LE(offsets[i], b + 12)
})
icoPngs.forEach((p, i) => p.data.copy(icoBuf, offsets[i]))

fs.writeFileSync(path.join(ASSETS, 'icon.ico'), icoBuf)
console.log(`✓ icon.ico  (${icoBuf.length} bytes, sizes: ${icoSizes.join(', ')}px)`)

// ── ICNS (PNG-in-ICNS, macOS 10.7+) ─────────────────────────────────────────
// OSType codes for PNG payloads
const icnsMap = [
  { size: 16, type: 'icp4' },
  { size: 32, type: 'icp5' },
  { size: 64, type: 'icp6' },
  { size: 128, type: 'ic07' },
  { size: 256, type: 'ic08' },
  { size: 512, type: 'ic09' },
]

const icnsEntries = icnsMap.map(({ size, type }) => ({
  type,
  data: fs.readFileSync(path.join(ICONS, `${size}x${size}.png`)),
}))

const icnsBody = icnsEntries.reduce((acc, e) => acc + 8 + e.data.length, 0)
const icnsTotal = 8 + icnsBody
const icnsBuf = Buffer.alloc(icnsTotal)
icnsBuf.write('icns', 0, 'ascii')
icnsBuf.writeUInt32BE(icnsTotal, 4)

let pos = 8
for (const e of icnsEntries) {
  icnsBuf.write(e.type, pos, 'ascii')
  icnsBuf.writeUInt32BE(8 + e.data.length, pos + 4)
  e.data.copy(icnsBuf, pos + 8)
  pos += 8 + e.data.length
}

fs.writeFileSync(path.join(ASSETS, 'icon.icns'), icnsBuf)
console.log(
  `✓ icon.icns (${icnsBuf.length} bytes, sizes: ${icnsMap.map(m => m.size).join(', ')}px)`
)
