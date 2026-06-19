import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook to call IPC methods exposed via preload.js (window.electronAPI)
 * Provides consistent error handling and loading state management.
 */
const api = typeof window !== 'undefined' && window.electronAPI ? window.electronAPI : null

export function useIpc() {
  return api
}

/**
 * Hook to invoke a specific IPC method with error handling.
 * Returns [invoke, pending] where invoke is a function that calls the IPC
 * method and returns the result, and pending is a ref indicating if a call
 * is currently in flight (for non-React tracking).
 */
export function useIpcInvoke(method) {
  const pending = useRef(false)

  const invoke = useCallback(
    async (...args) => {
      if (!api || !api[method]) {
        console.warn(`IPC method "${method}" not available`)
        return { success: false, error: `IPC method "${method}" not available` }
      }
      pending.current = true
      try {
        const result = await api[method](...args)
        return result
      } catch (err) {
        return { success: false, error: err.message || String(err) }
      } finally {
        pending.current = false
      }
    },
    [method]
  )

  return [invoke, pending]
}

/**
 * Subscribe to an IPC event from the main process.
 * Automatically cleans up on unmount.
 */
export function useIpcListener(event, callback) {
  // Keep a ref to the latest callback so the effect doesn't need to re-run
  // when the callback identity changes (e.g. inline arrows on every render).
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!api) return

    const listenerMap = {
      'download-progress': 'onDownloadProgress',
      'download-complete': 'onDownloadComplete',
      'download-error': 'onDownloadError',
      'download-queued': 'onDownloadQueued',
      'download-log': 'onDownloadLog',
      'login-complete': 'onLoginComplete',
      'window-maximized': 'onMaximizeChange',
    }

    let mounted = true
    const methodName = listenerMap[event]
    if (methodName && api[methodName]) {
      api[methodName](data => {
        if (mounted) callbackRef.current(data)
      })
    }

    return () => {
      mounted = false
      // Do NOT call removeAllListeners here — that wipes every handler on the
      // channel globally, including handlers registered by DownloadContext.
    }
  }, [event]) // stable: only re-runs if the event name itself changes
}

export default useIpc
