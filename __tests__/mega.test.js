const path = require('path')
const { EventEmitter } = require('events')

jest.mock('electron', () => ({
  app: { getPath: () => '/tmp/downloads' },
  ipcMain: { handle: jest.fn() },
}))

jest.mock('../main/store/config', () => ({
  get: jest.fn((key, defaultVal) => {
    if (key === 'downloadPath') return '/tmp/downloads'
    if (key === 'settings') return {}
    if (key === 'downloadHistory') return defaultVal ?? []
    return defaultVal ?? null
  }),
  set: jest.fn(),
}))

const mockDownloadStream = jest.fn()
const mockLoadAttributes = jest.fn()
const mockFromURL = jest.fn()

jest.mock('megajs', () => ({
  File: { fromURL: (...args) => mockFromURL(...args) },
}))

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn(),
  existsSync: jest.fn(() => false),
  unlinkSync: jest.fn(),
}))

const fs = require('fs')

describe('downloadFromMega', () => {
  let service
  let mockWindow

  beforeEach(() => {
    jest.clearAllMocks()

    mockWindow = {
      isDestroyed: jest.fn(() => false),
      webContents: { send: jest.fn() },
    }

    service = require('../main/services/download.service')
    service.downloadPath = '/tmp/downloads'
    // Clear active downloads between tests
    service.activeDownloads = new Map()
  })

  test('downloads a single MEGA file and fires progress + complete events', async () => {
    const fakeStream = new EventEmitter()
    fakeStream.pipe = jest.fn(writer => {
      setImmediate(() => {
        fakeStream.emit('data', Buffer.alloc(512))
        fakeStream.emit('data', Buffer.alloc(512))
        writer.emit('finish')
      })
      return writer
    })

    const mockWriter = new EventEmitter()
    fs.createWriteStream.mockReturnValue(mockWriter)

    mockFromURL.mockReturnValue({
      loadAttributes: jest.fn().mockResolvedValue(undefined),
      name: 'video.mp4',
      size: 1024,
      nodeId: null,
      children: null,
      download: jest.fn(() => fakeStream),
    })

    const result = await service.downloadFromMega(
      'https://mega.nz/file/abc123#key',
      'video.mp4',
      mockWindow,
      'test-id-1'
    )

    expect(result.filename).toBe('video.mp4')
    expect(mockWindow.webContents.send).toHaveBeenCalledWith(
      'download-progress',
      expect.objectContaining({ downloadId: 'test-id-1', totalBytes: 1024 })
    )
    expect(mockWindow.webContents.send).toHaveBeenCalledWith(
      'download-complete',
      expect.objectContaining({ downloadId: 'test-id-1' })
    )
  })

  test('resolves correct child node when nodeId is provided', async () => {
    const childStream = new EventEmitter()
    childStream.pipe = jest.fn(writer => {
      setImmediate(() => writer.emit('finish'))
      return writer
    })

    const mockWriter = new EventEmitter()
    fs.createWriteStream.mockReturnValue(mockWriter)

    const childNode = {
      name: 'file2.mp4',
      size: 2048,
      nodeId: 'node-456',
      children: null,
      download: jest.fn(() => childStream),
    }
    const rootNode = {
      name: 'MyFolder',
      size: 0,
      nodeId: 'root-123',
      children: [childNode],
      loadAttributes: jest.fn().mockResolvedValue(undefined),
      download: jest.fn(),
    }
    mockFromURL.mockReturnValue(rootNode)

    const result = await service.downloadFromMega(
      'https://mega.nz/folder/abc123#key',
      'folder',
      mockWindow,
      'test-id-2',
      'node-456'
    )

    expect(childNode.download).toHaveBeenCalled()
    expect(result.filename).toBe('file2.mp4')
  })

  test('cleans up partial file on stream error', async () => {
    const badStream = new EventEmitter()
    badStream.pipe = jest.fn(writer => {
      setImmediate(() => badStream.emit('error', new Error('MEGA decryption failed')))
      return writer
    })

    const mockWriter = new EventEmitter()
    fs.createWriteStream.mockReturnValue(mockWriter)
    fs.existsSync.mockReturnValue(true)

    mockFromURL.mockReturnValue({
      loadAttributes: jest.fn().mockResolvedValue(undefined),
      name: 'file.mp4',
      size: 1024,
      nodeId: null,
      children: null,
      download: jest.fn(() => badStream),
    })

    await expect(
      service.downloadFromMega(
        'https://mega.nz/file/abc#key',
        'file.mp4',
        mockWindow,
        'test-id-3'
      )
    ).rejects.toThrow('MEGA decryption failed')

    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join('/tmp/downloads', 'file.mp4')
    )
  })
})
