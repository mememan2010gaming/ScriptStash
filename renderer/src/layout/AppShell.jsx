import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import Background from '../components/Background'
import Titlebar from './Titlebar'
import Sidebar from './Sidebar'
import TopicsView from '../views/TopicsView'
import TopicDetail from '../views/TopicDetail'
import PlayerView from '../views/PlayerView'
import SearchView from '../views/SearchView'
import DownloadsView from '../views/DownloadsView'
import SettingsView from '../views/SettingsView'
import NotificationsView from '../views/NotificationsView'
import LibraryView from '../views/LibraryView'
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Transient views — mount/unmount normally (no scroll state to preserve)
function TransientContent(props) {
  const { currentView, selectedTopicId, searchQuery, navigateTo, goBack } = props
  switch (currentView) {
    case 'player':
      return (
        <PlayerView topic={props.playerTopic} localFile={props.playerLocalFile} goBack={goBack} />
      )
    case 'library':
      return <LibraryView navigateTo={navigateTo} />
    case 'detail':
      return <TopicDetail topicId={selectedTopicId} navigateTo={navigateTo} goBack={goBack} />
    case 'search':
      return <SearchView query={searchQuery} navigateTo={navigateTo} />
    case 'downloads':
      return <DownloadsView />
    case 'notifications':
      return <NotificationsView navigateTo={navigateTo} />
    case 'settings':
      return (
        <SettingsView
          activeSection={props.settingsSection}
          onSectionChange={props.setSettingsSection}
        />
      )
    default:
      return null
  }
}

export default function AppShell(props) {
  const contentRef = useRef(null)
  const prevKey = useRef(`${props.currentView}:${props.currentCategory}`)

  useEffect(() => {
    const key = `${props.currentView}:${props.currentCategory}`
    if (prevKey.current === key || !contentRef.current) return
    prevKey.current = key
    if (reduceMotion) return
    animate(contentRef.current, {
      translateY: [12, 0],
      duration: 440,
      ease: 'outExpo',
    })
  }, [props.currentView, props.currentCategory])

  return (
    <>
      <Background />
      <div className="app-root">
        <Titlebar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <Sidebar
            currentView={props.currentView}
            currentCategory={props.currentCategory}
            navigateTo={props.navigateTo}
          />
          <main
            style={{
              flex: 1,
              overflow: 'hidden',
              minWidth: 0,
              padding: '8px 14px 14px 8px',
              display: 'flex',
            }}
          >
            <div
              ref={contentRef}
              className="glass"
              style={{
                flex: 1,
                overflow: 'hidden',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              {/* Persistent topic views — kept mounted so loaded pages + scroll survive navigation */}
              {['free', 'paid'].map(cat => (
                <div
                  key={cat}
                  style={{
                    display:
                      props.currentView === 'topics' && props.currentCategory === cat
                        ? 'flex'
                        : 'none',
                    flex: 1,
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <TopicsView category={cat} navigateTo={props.navigateTo} />
                </div>
              ))}
              {/* Transient views render normally */}
              {props.currentView !== 'topics' && (
                <div
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                  <TransientContent {...props} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
