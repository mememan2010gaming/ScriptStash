const { parseFunscript, findActionIndex } = require('../renderer/src/services/funscript-parser')

describe('parseFunscript', () => {
  it('parses a valid funscript and sorts by at', () => {
    const json = JSON.stringify({
      actions: [
        { at: 1000, pos: 50 },
        { at: 0, pos: 0 },
        { at: 2000, pos: 99 },
      ],
    })
    const result = parseFunscript(json)
    expect(result.actions).toEqual([
      { at: 0, pos: 0 },
      { at: 1000, pos: 50 },
      { at: 2000, pos: 99 },
    ])
  })

  it('filters out negative timestamps', () => {
    const json = JSON.stringify({
      actions: [
        { at: -100, pos: 10 },
        { at: 500, pos: 20 },
      ],
    })
    const result = parseFunscript(json)
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].at).toBe(500)
  })

  it('clamps pos to 0-99', () => {
    const json = JSON.stringify({
      actions: [
        { at: 0, pos: 150 },
        { at: 100, pos: -10 },
      ],
    })
    const result = parseFunscript(json)
    expect(result.actions[0].pos).toBe(99)
    expect(result.actions[1].pos).toBe(0)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseFunscript('not json')).toThrow()
  })

  it('throws when actions field is missing', () => {
    expect(() => parseFunscript(JSON.stringify({ version: '1.0' }))).toThrow('no actions')
  })
})

describe('findActionIndex', () => {
  const actions = [
    { at: 0, pos: 0 },
    { at: 500, pos: 50 },
    { at: 1000, pos: 100 },
    { at: 1500, pos: 25 },
  ]

  it('returns -1 when time is before all actions', () => {
    expect(findActionIndex(actions, -1)).toBe(-1)
  })

  it('returns 0 for exact first action time', () => {
    expect(findActionIndex(actions, 0)).toBe(0)
  })

  it('returns correct index mid-sequence', () => {
    expect(findActionIndex(actions, 750)).toBe(1)
  })

  it('returns last index when time is past all actions', () => {
    expect(findActionIndex(actions, 9999)).toBe(3)
  })

  it('handles empty array', () => {
    expect(findActionIndex([], 500)).toBe(-1)
  })
})
