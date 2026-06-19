// Tests for ApiService.rankVideos()
// Requires the singleton to be instantiated, so we reach into the class directly

jest.mock('../main/services/rate-limiter.service', () => {
  return jest.fn().mockImplementation(() => ({
    acquire: jest.fn().mockResolvedValue(undefined),
  }))
})
jest.mock('../main/services/api-cache.service', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  }))
})
jest.mock('../main/services/auth.service', () => ({
  getAuthHeaders: jest.fn().mockReturnValue({}),
}))

const ApiService = require('../main/services/api.service')

// Get the underlying class instance (module exports `new ApiService()`)
const api = ApiService

describe('rankVideos', () => {
  it('returns empty array for empty input', () => {
    expect(api.rankVideos([])).toEqual([])
    expect(api.rankVideos(null)).toEqual([])
  })

  it('marks first result as isBest, others false', () => {
    const videos = [
      { url: 'https://gofile.io/d/abc', postNumber: 1, clicks: 5 },
      { url: 'https://pixeldrain.com/u/xyz', postNumber: 3, clicks: 2 },
    ]
    const ranked = api.rankVideos(videos, null)
    expect(ranked[0].isBest).toBe(true)
    expect(ranked.slice(1).every(v => !v.isBest)).toBe(true)
  })

  it('prefers pixeldrain over gofile at the same postNumber', () => {
    const videos = [
      { url: 'https://gofile.io/d/abc', postNumber: 1, clicks: 0 },
      { url: 'https://pixeldrain.com/u/xyz', postNumber: 1, clicks: 0 },
    ]
    const ranked = api.rankVideos(videos, null)
    expect(ranked[0].url).toContain('pixeldrain')
  })

  it('gives OP author a massive bonus', () => {
    const OP_ID = 42
    const videos = [
      { url: 'https://pixeldrain.com/u/old', postNumber: 1, clicks: 0, userId: OP_ID },
      { url: 'https://pixeldrain.com/u/new', postNumber: 99, clicks: 0, userId: 99 },
    ]
    const ranked = api.rankVideos(videos, OP_ID)
    expect(ranked[0].url).toContain('old')
  })

  it('de-duplicates by normalized URL (http vs https, www)', () => {
    const videos = [
      { url: 'https://pixeldrain.com/u/abc', postNumber: 1, clicks: 0 },
      { url: 'http://www.pixeldrain.com/u/abc', postNumber: 2, clicks: 0 },
    ]
    const ranked = api.rankVideos(videos, null)
    expect(ranked.length).toBe(1)
  })

  it('sets isBest only on a single item even with many inputs', () => {
    const videos = Array.from({ length: 5 }, (_, i) => ({
      url: `https://mega.nz/file/${i}`,
      postNumber: i,
      clicks: 0,
    }))
    const ranked = api.rankVideos(videos, null)
    expect(ranked.filter(v => v.isBest).length).toBe(1)
  })
})
