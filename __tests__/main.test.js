const { app } = require('electron')

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
    on: jest.fn(),
    quit: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
    },
  })),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
}))

describe('Main Process', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('app should be defined', () => {
    expect(app).toBeDefined()
  })

  test('app.whenReady should be callable', () => {
    expect(typeof app.whenReady).toBe('function')
  })

  test('app.getPath should return mock path', () => {
    expect(app.getPath('userData')).toBe('/mock/path')
  })
})
