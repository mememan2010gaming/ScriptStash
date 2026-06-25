import { DeviceOutput, OutputType } from 'buttplug'

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

async function sendToDevices(devices, durationMs, position) {
  for (const device of devices) {
    try {
      if (device.hasOutput(OutputType.HwPositionWithDuration)) {
        await device.runOutput(DeviceOutput.HwPositionWithDuration.value(position, durationMs))
      } else if (device.hasOutput(OutputType.Position)) {
        await device.runOutput(DeviceOutput.Position.value(position))
      }
    } catch {
      // Device disconnected or busy — ignore, will be cleaned up via deviceremoved event
    }
  }
}

export function createScriptEngine({ videoEl, actions, getOffsetMs, devicesRef }) {
  let cursor = -1
  let rafId = null

  function tick() {
    if (!videoEl || videoEl.paused || videoEl.ended || videoEl.readyState < 2) {
      rafId = requestAnimationFrame(tick)
      return
    }

    const currentTimeMs = videoEl.currentTime * 1000 + getOffsetMs()
    const idx = findActionIndex(actions, currentTimeMs)

    if (idx !== -1 && idx !== cursor && idx + 1 < actions.length) {
      cursor = idx
      const durationMs = Math.max(1, actions[idx + 1].at - actions[idx].at)
      const targetPos = actions[idx + 1].pos / 99
      sendToDevices(devicesRef.current ?? [], durationMs, targetPos)
    }

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (rafId !== null) return
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function seek() {
    if (!videoEl) return
    const currentTimeMs = videoEl.currentTime * 1000 + getOffsetMs()
    cursor = findActionIndex(actions, currentTimeMs)
  }

  return { start, stop, seek }
}
