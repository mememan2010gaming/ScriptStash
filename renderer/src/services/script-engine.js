import { DeviceOutput, OutputType } from 'buttplug'

let _diagCount = 0

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
  const diag = _diagCount < 3
  if (diag) {
    _diagCount++
    console.log(
      `[script-engine] sendToDevices called: ${devices.length} device(s), pos=${position.toFixed(3)}, dur=${durationMs}ms`
    )
  }
  for (const device of devices) {
    try {
      const supportsHwPos = device.hasOutput(OutputType.HwPositionWithDuration)
      const supportsPos = device.hasOutput(OutputType.Position)
      if (diag) {
        const featureTypes = [...(device.features?.values() ?? [])].map(f =>
          JSON.stringify(f._feature?.Output ?? {})
        )
        console.log(
          `[script-engine] device "${device.name}": HwPos=${supportsHwPos}, Pos=${supportsPos}, features=${featureTypes.join(' | ')}`
        )
      }
      if (supportsHwPos) {
        await device.runOutput(DeviceOutput.HwPositionWithDuration.value(position, durationMs))
      } else if (supportsPos) {
        await device.runOutput(DeviceOutput.Position.value(position))
      } else if (diag) {
        console.warn(
          `[script-engine] device "${device.name}" has no supported linear output type — no command sent`
        )
      }
    } catch (err) {
      console.warn(`[script-engine] device "${device.name}" error:`, err)
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
      const devs = devicesRef.current ?? []
      if (_diagCount < 3) {
        console.log(
          `[script-engine] tick firing: idx=${idx}, devices=${devs.length}, pos=${targetPos.toFixed(3)}, dur=${durationMs}ms`
        )
      }
      sendToDevices(devs, durationMs, targetPos)
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
