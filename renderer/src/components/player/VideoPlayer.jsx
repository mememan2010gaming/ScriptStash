export default function VideoPlayer({ streamUrl, videoRef, onError }) {
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
        src={streamUrl}
        controls
        style={{ width: '100%', display: 'block', maxHeight: '60vh' }}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  )
}
