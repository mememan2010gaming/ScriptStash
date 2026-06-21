/* global FileReader, requestAnimationFrame, cancelAnimationFrame */
import { useState, useEffect, useRef, useCallback } from 'react'
import VideoPlayer from '../components/player/VideoPlayer'
import ScriptTimeline from '../components/player/ScriptTimeline'
import OffsetControl from '../components/player/OffsetControl'
import IntifacePanel from '../components/player/IntifacePanel'
import { createScriptEngine } from '../services/script-engine.js'

function parseFunscript(json) {
  const file = JSON.parse(json)
  if (!Array.isArray(file.actions)) throw new Error('funscript has no actions array')
  return {
    actions: file.actions
      .filter(a => typeof a.at === 'number' && a.at >= 0)
      .map(a => ({ at: Math.round(a.at), pos: Math.max(0, Math.min(99, Math.round(a.pos ?? 0))) }))
      .sort((a, b) => a.at - b.at),
  }
}

export default function PlayerView({ topic, goBack }) {
  const [streamUrl, setStreamUrl] = useState(null)
  const [streamError, setStreamError] = useState(null)
  const [actions, setActions] = useState([])
  const [scriptError, setScriptError] = useState(null)
  const [offsetMs, setOffsetMs] = useState(0)
  const [currentTimeMs, setCurrentTimeMs] = useState(0)

  const videoRef = useRef(null)
  const devicesRef = useRef([])
  const engineRef = useRef(null)
  const offsetRef = useRef(0)
  const rafDisplayRef = useRef(null)

  const funscripts = topic?.downloads?.funscripts ?? []
  const videos = topic?.downloads?.rankedVideos ?? topic?.downloads?.videos ?? []

  // Keep offsetRef current so the engine reads without closure staleness
  useEffect(() => {
    offsetRef.current = offsetMs
  }, [offsetMs])

  // Fetch stream URL
  useEffect(() => {
    if (!videos[0]?.url) {
      setStreamError('No video URL found for this topic.')
      return
    }
    window.electronAPI
      .getStreamUrl(videos[0].url)
      .then(result => {
        if (result.success) {
          setStreamUrl(result.data)
        } else {
          setStreamError(result.error ?? 'Failed to extract stream URL.')
        }
      })
      .catch(e => setStreamError(e.message))
  }, [videos[0]?.url])

  // Fetch funscript
  useEffect(() => {
    if (!funscripts[0]?.url) {
      setScriptError('No funscript URL found.')
      return
    }
    fetch(funscripts[0].url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        const parsed = parseFunscript(text)
        setActions(parsed.actions)
      })
      .catch(e => setScriptError(`Failed to load script: ${e.message}`))
  }, [funscripts[0]?.url])

  // Start/restart engine when actions change or video URL loads
  useEffect(() => {
    const video = videoRef.current
    if (!video || actions.length === 0) return

    engineRef.current?.stop()
    const engine = createScriptEngine({
      videoEl: video,
      actions,
      getOffsetMs: () => offsetRef.current,
      devicesRef,
    })
    engineRef.current = engine
    engine.start()

    return () => engine.stop()
  }, [actions, streamUrl])

  // Reset engine cursor when user seeks
  const handleSeeked = useCallback(() => {
    engineRef.current?.seek()
  }, [])

  // RAF display ticker — drives the timeline canvas
  useEffect(() => {
    function displayTick() {
      const video = videoRef.current
      if (video) setCurrentTimeMs(video.currentTime * 1000 + offsetRef.current)
      rafDisplayRef.current = requestAnimationFrame(displayTick)
    }
    rafDisplayRef.current = requestAnimationFrame(displayTick)
    return () => {
      if (rafDisplayRef.current) cancelAnimationFrame(rafDisplayRef.current)
    }
  }, [])

  // Wire seeked event to engine
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.addEventListener('seeked', handleSeeked)
    return () => video.removeEventListener('seeked', handleSeeked)
  }, [handleSeeked])

  function handleLocalFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseFunscript(ev.target.result)
        setActions(parsed.actions)
        setScriptError(null)
      } catch (err) {
        setScriptError(`Could not parse file: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px 20px',
        gap: 12,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={goBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            fontSize: 13,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'center',
            margin: '0 16px',
          }}
        >
          {topic?.title ?? ''}
        </div>
        <IntifacePanel onDevicesChange={list => (devicesRef.current = list)} />
      </div>

      {/* Video */}
      {streamError ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            border: '1px solid var(--glass-border)',
            color: 'var(--text)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Could not load video</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', wordBreak: 'break-all' }}>
            {streamError}
          </div>
          {videos[0]?.url && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-faint)' }}>
              Raw URL: <code style={{ userSelect: 'all' }}>{videos[0].url}</code>
            </div>
          )}
        </div>
      ) : (
        <VideoPlayer
          streamUrl={streamUrl}
          videoRef={videoRef}
          onError={msg => setStreamError(msg)}
        />
      )}

      {/* Timeline */}
      <div
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.04)',
          padding: '6px 0',
        }}
      >
        {scriptError ? (
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{scriptError}</span>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6c8eff', cursor: 'pointer' }}>
              Load local file
              <input
                type="file"
                accept=".funscript,.json"
                style={{ display: 'none' }}
                onChange={handleLocalFile}
              />
            </label>
          </div>
        ) : (
          <ScriptTimeline actions={actions} currentTimeMs={currentTimeMs} />
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <OffsetControl
            value={offsetMs}
            onChange={ms => {
              setOffsetMs(ms)
              engineRef.current?.seek()
            }}
          />
        </div>
      </div>
    </div>
  )
}
