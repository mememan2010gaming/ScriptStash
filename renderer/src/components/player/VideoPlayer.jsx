import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function VideoPlayer({ streamUrl, videoRef, onError }) {
  const hlsRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return

    // Tear down any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onError('HLS stream error: ' + (data.details ?? 'unknown'))
        }
      })
    } else {
      // Direct URL or native HLS support
      video.src = streamUrl
      video.load()
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [streamUrl, videoRef, onError])

  function handleError() {
    onError('Video failed to load. The stream URL may have expired or be unsupported.')
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        background: '#000',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', display: 'block', maxHeight: '60vh' }}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  )
}
