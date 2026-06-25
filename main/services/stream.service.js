const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const YTDlpWrap = require('yt-dlp-wrap').default

let ytDlp = null
let _tempDir = null
const tempFiles = new Set()

function getTempDir() {
  if (!_tempDir) {
    _tempDir = path.join(app.getPath('temp'), 'scriptstash-player')
    if (!fs.existsSync(_tempDir)) fs.mkdirSync(_tempDir, { recursive: true })
  }
  return _tempDir
}

async function getYtDlp() {
  if (!ytDlp) {
    try {
      ytDlp = new YTDlpWrap()
    } catch {
      await YTDlpWrap.downloadFromGithub()
      ytDlp = new YTDlpWrap()
    }
  }
  return ytDlp
}

async function downloadVideoToTemp(videoUrl, onProgress) {
  const dir = getTempDir()
  const instance = await getYtDlp()
  const timestamp = Date.now()
  const outputTemplate = path.join(dir, `player-${timestamp}.%(ext)s`)

  return new Promise((resolve, reject) => {
    const args = [
      videoUrl,
      '-f',
      'best[ext=mp4]/best[ext=webm]/best',
      '-o',
      outputTemplate,
      '--no-playlist',
      '--newline',
      '-N',
      '4',
      '--throttled-rate',
      '100K',
    ]

    let resolvedPath = null
    const execEmitter = instance.exec(args)
    const proc = execEmitter.ytDlpProcess

    proc.stdout.on('data', data => {
      for (const line of data.toString().split('\n')) {
        const trimmed = line.trim()

        const destMatch = trimmed.match(/\[download\] Destination:\s*(.+)/)
        if (destMatch) resolvedPath = destMatch[1].trim()

        const mergeMatch = trimmed.match(/\[Merger\] Merging formats into "(.+)"/)
        if (mergeMatch) resolvedPath = mergeMatch[1].trim()

        const pctMatch = trimmed.match(/\[download\]\s+(\d+\.?\d*)%(?:.*ETA\s+(\S+))?/)
        if (pctMatch) onProgress(Math.round(parseFloat(pctMatch[1])), pctMatch[2] ?? null)
      }
    })

    proc.stderr.on('data', () => {})

    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}`))
        return
      }
      if (!resolvedPath) {
        const files = fs.readdirSync(dir).filter(f => f.startsWith(`player-${timestamp}`))
        if (files.length > 0) resolvedPath = path.join(dir, files[0])
      }
      if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        reject(new Error('Downloaded file not found'))
        return
      }
      tempFiles.add(resolvedPath)
      onProgress(100)
      resolve(resolvedPath)
    })

    proc.on('error', reject)
  })
}

function cleanupTempFiles() {
  for (const file of tempFiles) {
    try {
      fs.unlinkSync(file)
    } catch {}
  }
  tempFiles.clear()
}

async function getStreamUrl(videoUrl) {
  // Use require (not .default) so jest.mock can intercept in tests
  const Ctor = require('yt-dlp-wrap')
  const instance = new Ctor()
  const output = await instance.execPromise([videoUrl, '-g', '--no-playlist'])
  const first = output.split('\n').find(l => l.trim())
  if (!first) throw new Error('yt-dlp returned no stream URL')
  return first.trim()
}

module.exports = { downloadVideoToTemp, cleanupTempFiles, getTempDir, getStreamUrl }
