const { getStreamUrl } = require('../main/services/stream.service')

jest.mock('yt-dlp-wrap', () => {
  return jest.fn().mockImplementation(() => ({
    execPromise: jest.fn(),
  }))
})

const YTDlpWrap = require('yt-dlp-wrap')

describe('stream.service', () => {
  let mockExecPromise

  beforeEach(() => {
    jest.clearAllMocks()
    mockExecPromise = jest.fn()
    YTDlpWrap.mockImplementation(() => ({ execPromise: mockExecPromise }))
  })

  it('returns the first URL from yt-dlp output', async () => {
    mockExecPromise.mockResolvedValue('https://cdn.example.com/video.mp4\n')
    const url = await getStreamUrl('https://example.com/video')
    expect(url).toBe('https://cdn.example.com/video.mp4')
  })

  it('takes the first line when yt-dlp returns multiple lines', async () => {
    mockExecPromise.mockResolvedValue(
      'https://cdn.example.com/v.mp4\nhttps://cdn.example.com/a.m4a\n'
    )
    const url = await getStreamUrl('https://example.com/video')
    expect(url).toBe('https://cdn.example.com/v.mp4')
  })

  it('throws when yt-dlp fails', async () => {
    mockExecPromise.mockRejectedValue(new Error('Unsupported URL'))
    await expect(getStreamUrl('https://example.com/bad')).rejects.toThrow('Unsupported URL')
  })
})
