import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'

const DownloadContext = createContext(null)

const initialState = {
  active: [], // { downloadId, url, filename, progress, bytesReceived, totalBytes }
  queued: [], // { downloadId, url, filename, queuePosition }
  history: [], // { filename, url, path, size, completedAt }
  errors: [], // { downloadId, url, filename, error }
}

function downloadReducer(state, action) {
  switch (action.type) {
    case 'PROGRESS': {
      const existing = state.active.find(d => d.url === action.payload.url)
      if (existing) {
        return {
          ...state,
          active: state.active.map(d =>
            d.url === action.payload.url ? { ...d, ...action.payload } : d
          ),
        }
      }
      return {
        ...state,
        active: [...state.active, action.payload],
        queued: state.queued.filter(d => d.url !== action.payload.url),
      }
    }

    case 'COMPLETE':
      return {
        ...state,
        active: state.active.filter(d => d.url !== action.payload.url),
        history: [
          { ...action.payload, completedAt: new Date().toISOString() },
          ...state.history,
        ].slice(0, 100),
      }

    case 'ERROR':
      return {
        ...state,
        active: state.active.filter(d => d.url !== action.payload.url),
        errors: [action.payload, ...state.errors].slice(0, 50),
      }

    case 'QUEUED':
      return {
        ...state,
        queued: [...state.queued, action.payload],
      }

    case 'SET_HISTORY':
      return { ...state, history: action.payload }

    case 'CLEAR_HISTORY':
      return { ...state, history: [] }

    case 'CLEAR_ERRORS':
      return { ...state, errors: [] }

    default:
      return state
  }
}

export function DownloadProvider({ children }) {
  const [state, dispatch] = useReducer(downloadReducer, initialState)
  const api = typeof window !== 'undefined' && window.electronAPI ? window.electronAPI : null
  const initialized = useRef(false)

  // Set up IPC listeners
  useEffect(() => {
    if (!api || initialized.current) return
    initialized.current = true

    api.onDownloadProgress(data => {
      dispatch({ type: 'PROGRESS', payload: data })
    })

    api.onDownloadComplete(data => {
      dispatch({ type: 'COMPLETE', payload: data })
    })

    api.onDownloadError(data => {
      dispatch({ type: 'ERROR', payload: data })
    })

    api.onDownloadQueued(data => {
      dispatch({ type: 'QUEUED', payload: data })
    })

    // Load history on mount
    api.getDownloadHistory().then(result => {
      if (result?.success && result.data) {
        dispatch({ type: 'SET_HISTORY', payload: result.data })
      }
    })

    return () => {
      if (api.removeAllListeners) {
        api.removeAllListeners('download-progress')
        api.removeAllListeners('download-complete')
        api.removeAllListeners('download-error')
        api.removeAllListeners('download-queued')
      }
    }
  }, [api])

  const downloadFile = useCallback(
    async (url, filename) => {
      if (!api) return { success: false, error: 'API not available' }
      return api.downloadFile(url, filename)
    },
    [api]
  )

  const downloadBatch = useCallback(
    async files => {
      if (!api) return { success: false, error: 'API not available' }
      const results = []
      for (const file of files) {
        const result = await api.downloadFile(file.url, file.filename)
        results.push(result)
      }
      return results
    },
    [api]
  )

  const clearHistory = useCallback(async () => {
    if (api) await api.clearDownloadHistory()
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [api])

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' })
  }, [])

  const activeCount = state.active.length + state.queued.length

  return (
    <DownloadContext.Provider
      value={{
        ...state,
        activeCount,
        downloadFile,
        downloadBatch,
        clearHistory,
        clearErrors,
      }}
    >
      {children}
    </DownloadContext.Provider>
  )
}

export function useDownloads() {
  const ctx = useContext(DownloadContext)
  if (!ctx) throw new Error('useDownloads must be used within DownloadProvider')
  return ctx
}

export default DownloadContext
