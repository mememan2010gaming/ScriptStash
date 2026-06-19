describe('Utility Functions Tests', () => {
  test('should format file size', () => {
    const formatFileSize = bytes => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })

  test('should format duration', () => {
    const formatDuration = seconds => {
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  test('should sanitize user input', () => {
    const sanitizeInput = input => {
      return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, '')
    }

    expect(sanitizeInput('  test  ')).toBe('test')
    expect(sanitizeInput('normal text')).toBe('normal text')
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
  })

  test('should debounce function calls', done => {
    jest.useFakeTimers()
    const mockFn = jest.fn()

    const debounce = (fn, delay) => {
      let timeoutId
      return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
      }
    }

    const debouncedFn = debounce(mockFn, 300)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)

    expect(mockFn).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
    done()
  })
})
