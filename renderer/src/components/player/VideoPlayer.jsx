export default function VideoPlayer({ streamUrl, videoRef, onError }) {
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
        onError={() => onError('Video failed to load.')}
        crossOrigin="anonymous"
      />
    </div>
  )
}
