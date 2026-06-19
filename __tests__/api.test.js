const axios = require('axios')

jest.mock('axios')

describe('API Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('axios should be mocked', () => {
    expect(axios.get).toBeDefined()
    expect(typeof axios.get).toBe('function')
  })

  test('should handle successful API call', async () => {
    const mockData = { data: { success: true } }
    axios.get.mockResolvedValue(mockData)

    const result = await axios.get('https://api.example.com/test')
    expect(result).toEqual(mockData)
    expect(axios.get).toHaveBeenCalledWith('https://api.example.com/test')
  })

  test('should handle failed API call', async () => {
    const mockError = new Error('Network Error')
    axios.get.mockRejectedValue(mockError)

    await expect(axios.get('https://api.example.com/test')).rejects.toThrow('Network Error')
  })
})
