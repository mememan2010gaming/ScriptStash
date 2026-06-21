function parseFunscript(json) {
  const file = JSON.parse(json)
  if (!Array.isArray(file.actions)) throw new Error('funscript has no actions array')

  const actions = file.actions
    .filter(a => typeof a.at === 'number' && a.at >= 0)
    .map(a => ({
      at: Math.round(a.at),
      pos: Math.max(0, Math.min(99, Math.round(a.pos ?? 0))),
    }))
    .sort((a, b) => a.at - b.at)

  return { actions }
}

function findActionIndex(actions, timeMs) {
  if (actions.length === 0) return -1
  let lo = 0
  let hi = actions.length - 1
  let result = -1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (actions[mid].at <= timeMs) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}

module.exports = { parseFunscript, findActionIndex }
