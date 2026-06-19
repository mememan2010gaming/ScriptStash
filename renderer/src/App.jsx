import { useState, useCallback, useRef, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { DownloadProvider } from './contexts/DownloadContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import AppShell from './layout/AppShell'
import ToastContainer from './design-system/components/Toast'
import UpdateNotification from './design-system/components/UpdateNotification'

const snap = (view, category, topicId, query) => ({ view, category, topicId, query })

function AppInner() {
  const [currentView, setCurrentView] = useState('topics')
  const [currentCategory, setCurrentCategory] = useState('free')
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsSection, setSettingsSection] = useState('general')

  const history = useRef([snap('topics', 'free', null, '')])
  const cursor = useRef(0)
  const navigating = useRef(false)

  const { addToast } = useToast()

  const applySnap = useCallback(s => {
    setCurrentView(s.view)
    setCurrentCategory(s.category)
    setSelectedTopicId(s.topicId)
    setSearchQuery(s.query)
  }, [])

  const navigateTo = useCallback(
    (view, options = {}) => {
      const category = options.category ?? currentCategory
      const topicId = options.topicId ?? (view === 'detail' ? selectedTopicId : null)
      const query = options.query ?? (view === 'search' ? searchQuery : '')

      setCurrentView(view)
      if (options.category !== undefined) setCurrentCategory(options.category)
      if (options.topicId !== undefined) setSelectedTopicId(options.topicId)
      if (options.query !== undefined) setSearchQuery(options.query)
      if (options.settingsSection !== undefined) setSettingsSection(options.settingsSection)

      if (navigating.current) return
      const s = snap(view, category, topicId, query)
      history.current = history.current.slice(0, cursor.current + 1)
      history.current.push(s)
      cursor.current = history.current.length - 1
    },
    [currentCategory, selectedTopicId, searchQuery]
  )

  const goBack = useCallback(() => {
    if (cursor.current <= 0) return
    cursor.current -= 1
    navigating.current = true
    applySnap(history.current[cursor.current])
    navigating.current = false
  }, [applySnap])

  const goForward = useCallback(() => {
    if (cursor.current >= history.current.length - 1) return
    cursor.current += 1
    navigating.current = true
    applySnap(history.current[cursor.current])
    navigating.current = false
  }, [applySnap])

  // Side mouse buttons: 3 = back, 4 = forward
  useEffect(() => {
    const handler = e => {
      if (e.button === 3) {
        e.preventDefault()
        goBack()
      }
      if (e.button === 4) {
        e.preventDefault()
        goForward()
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [goBack, goForward])

  // Update event listeners
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    if (api.onUpdateAvailable) {
      api.onUpdateAvailable(() => {
        addToast('A new update is downloading in the background.', 'info', 8000, {
          label: 'View',
          fn: () => navigateTo('settings', { settingsSection: 'updates' }),
        })
      })
    }

    if (api.onUpdateReady) {
      api.onUpdateReady(() => {
        addToast(
          'Update ready to install.',
          'info',
          0, // persistent until dismissed
          {
            label: 'Install',
            fn: () => navigateTo('settings', { settingsSection: 'updates' }),
          }
        )
      })
    }

    return () => {
      if (api.removeAllListeners) {
        api.removeAllListeners('update-available')
        api.removeAllListeners('update-ready')
      }
    }
  }, [addToast, navigateTo])

  return (
    <>
      <AppShell
        currentView={currentView}
        currentCategory={currentCategory}
        selectedTopicId={selectedTopicId}
        searchQuery={searchQuery}
        navigateTo={navigateTo}
        goBack={goBack}
        settingsSection={settingsSection}
        setSettingsSection={setSettingsSection}
      />
      <ToastContainer />
      <UpdateNotification />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DownloadProvider>
          <NotificationsProvider>
            <AppInner />
          </NotificationsProvider>
        </DownloadProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
