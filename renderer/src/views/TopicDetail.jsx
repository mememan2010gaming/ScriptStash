import { useState, useEffect, useRef } from 'react'
import { formatDate } from '../utils/formatters'
import MegaFolderPicker from '../components/MegaFolderPicker'
import { useDownloads } from '../contexts/DownloadContext'
import { useToast } from '../contexts/ToastContext'
import { useIpcListener } from '../hooks/useIpc'
import Icon from '../design-system/components/Icon'
import CountUp from '../design-system/components/CountUp'
import Skeleton from '../design-system/components/Skeleton'
import ProgressBar from '../design-system/components/ProgressBar'

const VIDEO_HOSTS = [
  'pixeldrain',
  'bunkr',
  'gofile',
  'mega.nz',
  'pornhub',
  'spankbang',
  'xvideos',
  'rule34video',
  'iwara.tv',
  'iwara.ai',
  'eporner',
  'pmvhaven',
  'hqporner',
  'faptap.net',
  'hstream.moe',
  'noodlemagazine',
  'e621.net',
  'boosty.to',
  'bilibili.com',
  'vk.com',
  'pixiv.net',
  'subscribestar',
  'fanbox.cc',
  'redgifs.com',
  'erome.com',
  'coomer.party',
  'kemono.party',
  'cyberdrop.me',
  'thisvid.com',
  'fantia.jp',
]

function useLiquidGlass() {
  const ref = useRef(null)
  const onMouseMove = e => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }
  return { ref, onMouseMove }
}

function Panel({ title, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 11,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function DownloadRow({ file, progress, onDownload, done }) {
  const liquid = useLiquidGlass()
  const isDownloading = progress !== undefined && !done
  return (
    <div
      {...liquid}
      className="glass glass-hover glass-sheen"
      style={{ padding: 12, borderRadius: 14 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginBottom: isDownloading ? 10 : 0,
        }}
      >
        <span
          style={{
            color: done ? 'var(--green)' : 'var(--accent-2)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={done ? 'check' : 'file'} size={16} />
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {file.filename}
        </span>
        {!isDownloading && !done && (
          <button
            onClick={onDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 99,
              cursor: 'pointer',
              background: 'var(--accent-soft)',
              border: '1px solid rgba(255,77,121,0.3)',
              color: 'var(--accent-2)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Icon name="download" size={13} /> Get
          </button>
        )}
        {done && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 9px',
              borderRadius: 99,
              background: 'var(--green-soft)',
              color: 'var(--green)',
              border: '1px solid rgba(59,224,160,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Saved
          </span>
        )}
      </div>
      {isDownloading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar value={progress} height={5} />
          </div>
          <span
            className="num"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent-2)',
              minWidth: 34,
              textAlign: 'right',
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment }) {
  const liquid = useLiquidGlass()
  const hasVideo = VIDEO_HOSTS.some(h => comment.cooked?.toLowerCase().includes(h))
  return (
    <div {...liquid} className="glass glass-sheen" style={{ padding: 16, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        {comment.avatar && (
          <img
            src={comment.avatar}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--glass-border)',
            }}
          />
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {comment.username}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
          {comment.createdAt ? formatDate(comment.createdAt) : ''}
        </span>
        {hasVideo && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 9px',
              borderRadius: 99,
              background: 'var(--green-soft)',
              color: 'var(--green)',
              border: '1px solid rgba(59,224,160,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginLeft: 'auto',
            }}
          >
            Updated link
          </span>
        )}
      </div>
      <div className="post-content" dangerouslySetInnerHTML={{ __html: comment.cooked }} />
    </div>
  )
}

function RightPanel({ topic, navigateTo }) {
  const { downloadFile } = useDownloads()
  const { addToast } = useToast()
  const [progress, setProgress] = useState({})
  const [done, setDone] = useState({})
  const [verified, setVerified] = useState({})
  const [failed, setFailed] = useState({})
  const [megaFolder, setMegaFolder] = useState(null)

  const funscripts = topic.downloads?.funscripts || []
  const rankedVideos = topic.downloads?.rankedVideos || topic.downloads?.videos || []
  const canPlay = funscripts.length > 0 && rankedVideos.length > 0

  useEffect(() => {
    setVerified({})
    rankedVideos.forEach(v => {
      if (!v.downloadable) return
      window.electronAPI
        ?.verifyUrl?.(v.url)
        .then(r => setVerified(prev => ({ ...prev, [v.url]: !!r?.success })))
        .catch(() => setVerified(prev => ({ ...prev, [v.url]: false })))
    })
  }, [topic.id])

  useIpcListener('download-progress', data => {
    setProgress(prev => ({ ...prev, [data.url]: data.progress }))
  })
  useIpcListener('download-complete', data => {
    setProgress(prev => {
      const n = { ...prev }
      delete n[data.url]
      return n
    })
    setDone(prev => ({ ...prev, [data.url]: true }))
    addToast(`Downloaded: ${data.filename}`, 'success')
  })
  useIpcListener('download-error', data => {
    setProgress(prev => {
      const n = { ...prev }
      delete n[data.url]
      return n
    })
    setFailed(prev => ({ ...prev, [data.url]: data.error }))
    addToast(`Failed: ${data.error}`, 'error')
  })

  const handleDownload = async (url, filename) => {
    setFailed(prev => {
      const n = { ...prev }
      delete n[url]
      return n
    })

    if (url.toLowerCase().includes('mega.nz')) {
      const result = await window.electronAPI?.getMegaFolderFiles?.(url)
      if (result?.success) {
        const data = result.data
        if (!data.isSingleFile) {
          setMegaFolder({ url, folderName: data.folderName, files: data.files })
          return
        }
        const fname = data.filename || filename
        downloadFile(url, fname, data.nodeId || null)
        addToast(`Downloading: ${fname}`, 'info')
        return
      }
    }

    downloadFile(url, filename)
    addToast(`Downloading: ${filename}`, 'info')
  }

  const handleDownloadPaired = async (videoUrl, videoFilename) => {
    setFailed(prev => {
      const n = { ...prev }
      delete n[videoUrl]
      return n
    })
    const funscriptUrl = funscripts[0]?.url ?? null
    if (funscriptUrl) {
      addToast(`Downloading video + script together…`, 'info')
      window.electronAPI
        ?.downloadPaired?.(videoUrl, funscriptUrl, topic.title)
        .catch(e => addToast(`Paired download failed: ${e.message}`, 'error'))
    } else {
      handleDownload(videoUrl, videoFilename)
    }
  }

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid var(--glass-border)',
        overflow: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {canPlay && navigateTo && (
        <button
          onClick={() => navigateTo('player', { topic })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            width: '100%',
            padding: '10px 0',
            borderRadius: 10,
            border: 'none',
            background: '#6c8eff',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ▶ Play
        </button>
      )}
      <Panel title="Scripts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {funscripts.length ? (
            funscripts.map((f, i) => (
              <DownloadRow
                key={i}
                file={f}
                progress={progress[f.url]}
                done={done[f.url]}
                onDownload={() => handleDownload(f.url, f.filename)}
              />
            ))
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>No scripts found</div>
          )}
        </div>
      </Panel>

      {rankedVideos.length > 0 && (
        <Panel title="Videos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {rankedVideos.map((v, i) => {
              const isVerifying = v.downloadable && verified[v.url] === undefined
              const isUnavailable = v.downloadable && verified[v.url] === false
              const hasFailed = !!failed[v.url]
              const isDownloading = !!progress[v.url]
              const isDone = done[v.url]
              const btnDisabled = isDownloading || isDone || isUnavailable || isVerifying

              let btnBg = 'var(--accent-soft)'
              let btnColor = 'var(--accent-2)'
              if (isDone) {
                btnBg = 'var(--green-soft)'
                btnColor = 'var(--green)'
              } else if (hasFailed) {
                btnBg = 'rgba(255,80,80,0.12)'
                btnColor = '#ff7070'
              } else if (isUnavailable) {
                btnBg = 'rgba(255,255,255,0.05)'
                btnColor = 'var(--text-faint)'
              }

              return (
                <div
                  key={i}
                  className="glass"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    borderColor: v.isBest ? 'rgba(59,224,160,0.35)' : 'var(--glass-border)',
                    background: v.isBest ? 'var(--green-soft)' : 'var(--glass)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {v.isBest && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: 99,
                          background: 'var(--green-soft)',
                          color: 'var(--green)',
                          border: '1px solid rgba(59,224,160,0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Best
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {v.service}
                    </span>
                    {v.fromReply && (
                      <span
                        style={{ fontSize: 10.5, color: 'var(--text-faint)', marginLeft: 'auto' }}
                      >
                        {v.postDate ? new Date(v.postDate).toLocaleDateString() : 'from reply'}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11.5,
                      color: 'var(--text-faint)',
                      overflow: 'hidden',
                      marginBottom: 10,
                    }}
                  >
                    <Icon name="link" size={12} />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {v.url}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        padding: '7px 10px',
                        borderRadius: 99,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        background: 'var(--glass-strong)',
                        border: '1px solid var(--glass-border-bright)',
                        color: 'var(--text)',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon name="external" size={12} /> Open
                    </a>
                    <button
                      onClick={() =>
                        handleDownloadPaired(v.url, `${topic.title} - ${v.service}.mp4`)
                      }
                      disabled={btnDisabled}
                      title={hasFailed ? failed[v.url] : undefined}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        padding: '7px 10px',
                        borderRadius: 99,
                        cursor: btnDisabled ? 'default' : 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        background: btnBg,
                        color: btnColor,
                        opacity: isVerifying || isDownloading ? 0.6 : 1,
                      }}
                    >
                      <Icon name={isDone ? 'check' : 'download'} size={12} />
                      {isDone
                        ? 'Saved'
                        : isDownloading
                          ? `${Math.round(progress[v.url])}%`
                          : isVerifying
                            ? 'Checking…'
                            : isUnavailable
                              ? 'Unavailable'
                              : hasFailed
                                ? 'Failed'
                                : 'Download'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {topic.tags?.length > 0 && (
        <Panel title="Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {topic.tags.map((t, i) => {
              const label = typeof t === 'string' ? t : (t?.name ?? String(i))
              return (
                <span
                  key={label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 9px',
                    borderRadius: 99,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    background: 'var(--toggle-off)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  {label}
                </span>
              )
            })}
          </div>
        </Panel>
      )}

      {megaFolder && (
        <MegaFolderPicker
          folderName={megaFolder.folderName}
          files={megaFolder.files}
          onConfirm={selected => {
            setMegaFolder(null)
            selected.forEach(file => {
              downloadFile(megaFolder.url, file.name, file.nodeId)
              addToast(`Downloading: ${file.name}`, 'info')
            })
          }}
          onCancel={() => setMegaFolder(null)}
        />
      )}
    </div>
  )
}

function ReplyBox({ topicId, onReply }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  async function handleSend() {
    const raw = text.trim()
    if (!raw || sending) return
    setSending(true)
    setError(null)
    const result = await window.electronAPI?.createPost?.(topicId, raw)
    setSending(false)
    if (result?.success) {
      setText('')
      onReply?.()
    } else {
      setError(result?.error || 'Failed to send reply')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
        background: 'var(--glass-bg, rgba(255,255,255,0.03))',
      }}
    >
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply… (Ctrl+Enter to send)"
        rows={3}
        style={{
          width: '100%',
          resize: 'none',
          background: 'var(--glass-strong)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 13.5,
          color: 'var(--text)',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.5,
        }}
      />
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        {error ? (
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>{error}</span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {text.length > 0 ? `${text.length} chars` : 'Ctrl+Enter to send'}
          </span>
        )}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            padding: '6px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: text.trim() && !sending ? 'var(--accent)' : 'var(--glass-strong)',
            color: text.trim() && !sending ? 'var(--on-accent)' : 'var(--text-faint)',
            cursor: text.trim() && !sending ? 'pointer' : 'default',
            transition: 'all var(--t)',
            border: 'none',
            flexShrink: 0,
          }}
        >
          {sending ? 'Sending…' : 'Reply'}
        </button>
      </div>
    </div>
  )
}

export default function TopicDetail({ topicId, goBack, navigateTo }) {
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)

  function loadTopic() {
    if (!topicId) return
    setLoading(true)
    setTopic(null)
    window.electronAPI
      ?.getTopicDetails?.(topicId)
      .then(r => {
        if (r?.success) {
          setTopic(r.data)
          setLiked(r.data.mainPost?.currentUserLiked ?? false)
          setLikeCount(r.data.likeCount ?? 0)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTopic()
  }, [topicId]) // loadTopic is stable per topicId — intentionally omitted

  async function handleLike() {
    const postId = topic?.mainPost?.id
    if (!postId || liking) return
    setLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => c + (wasLiked ? -1 : 1))
    try {
      if (wasLiked) {
        await window.electronAPI.unlikePost(postId)
      } else {
        await window.electronAPI.likePost(postId)
      }
    } catch {
      setLiked(wasLiked)
      setLikeCount(c => c + (wasLiked ? 1 : -1))
    } finally {
      setLiking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={240} radius={20} />
          <Skeleton height={30} width="60%" />
          <Skeleton height={16} width="35%" />
          <Skeleton height={16} />
          <Skeleton height={16} width="85%" />
          <Skeleton height={16} width="72%" />
        </div>
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderLeft: '1px solid var(--glass-border)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Skeleton height={14} width="55%" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={52} radius={14} />
          ))}
        </div>
      </div>
    )
  }

  if (!topic) return null

  const hue = topic.hue ?? topic.id % 360
  const heroBg = topic.imageUrl
    ? `url(${topic.imageUrl}) center/cover no-repeat`
    : `linear-gradient(135deg, hsl(${hue},45%,24%), hsl(${(hue + 50) % 360},40%,16%))`

  const stats = [
    { label: 'Scripts', value: topic.downloads?.funscripts?.length ?? 0 },
    {
      label: 'Videos',
      value: topic.downloads?.rankedVideos?.length ?? topic.downloads?.videos?.length ?? 0,
    },
    { label: 'Replies', value: topic.comments?.length ?? Math.max(0, (topic.postsCount ?? 1) - 1) },
    { label: 'Likes', value: likeCount },
    { label: 'Views', value: topic.views ?? 0 },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Sticky back bar */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              padding: '10px 18px',
              background: 'var(--glass-strong)',
              backdropFilter: 'blur(18px)',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <button
              onClick={goBack}
              className="glass glass-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 99,
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Icon name="back" size={15} /> Back
            </button>
          </div>

          {/* Hero — only when there's an actual image */}
          {topic.imageUrl && (
            <div style={{ height: 220, background: heroBg, position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to bottom, transparent 0%, transparent 32%, var(--bg) 100%)',
                }}
              />
              {topic.tags?.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 18,
                    left: 30,
                    right: 30,
                    display: 'flex',
                    gap: 7,
                    flexWrap: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {topic.tags.slice(0, 5).map((t, i) => {
                    const label = typeof t === 'string' ? t : (t?.name ?? String(i))
                    return (
                      <span
                        key={label}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 99,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          flexShrink: 0,
                          maxWidth: 110,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          background: 'rgba(0,0,0,0.45)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.18)',
                          color: 'rgba(255,255,255,0.9)',
                        }}
                      >
                        {label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '0 36px 56px' }}>
            <h1
              className="display"
              style={{
                fontSize: 27,
                fontWeight: 700,
                color: 'var(--text)',
                margin: '26px 0 16px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {topic.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              {topic.mainPost?.avatar && (
                <img
                  src={topic.mainPost.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--glass-border)',
                  }}
                />
              )}
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>{topic.mainPost?.username}</span>
              {topic.createdAt && (
                <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                  · {new Date(topic.createdAt).toLocaleDateString()}
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={handleLike}
                disabled={liking || !topic.mainPost?.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: liking ? 'wait' : 'pointer',
                  border: '1px solid',
                  transition: 'all 0.15s ease',
                  background: liked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  borderColor: liked ? 'rgba(239,68,68,0.5)' : 'var(--glass-border)',
                  color: liked ? '#ef4444' : 'var(--text-faint)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}
              </button>
            </div>

            {/* Stats with count-ups */}
            <div
              className="glass"
              style={{
                display: 'flex',
                gap: 8,
                padding: '18px 24px',
                borderRadius: 18,
                marginBottom: 30,
                flexWrap: 'wrap',
              }}
            >
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: '1 1 auto',
                    minWidth: 80,
                    paddingRight: 16,
                    borderRight: i < stats.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  }}
                >
                  <div
                    className="num"
                    style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}
                  >
                    <CountUp to={s.value} />
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-faint)',
                      marginTop: 3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {topic.mainPost && (
              <div
                className="post-content"
                style={{ marginBottom: 36 }}
                dangerouslySetInnerHTML={{ __html: topic.mainPost.cooked }}
              />
            )}

            {topic.comments?.length > 0 && (
              <div>
                <div
                  className="display"
                  style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}
                >
                  Replies{' '}
                  <span style={{ color: 'var(--text-faint)' }}>({topic.comments.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topic.comments.map((c, i) => (
                    <CommentItem key={c.id ?? i} comment={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <ReplyBox topicId={topic.id} onReply={loadTopic} />
      </div>

      <RightPanel topic={topic} navigateTo={navigateTo} />
    </div>
  )
}
