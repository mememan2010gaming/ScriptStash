import { createContext, useContext, useEffect, useReducer } from 'react'

const NotificationsContext = createContext(null)

const initialState = { notifications: [], unreadCount: 0 }

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE':
      return {
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
      }
    default:
      return state
  }
}

export function NotificationsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    api.getNotifications().then(result => {
      if (result?.success) dispatch({ type: 'UPDATE', payload: result.data })
    })

    api.onNotificationsUpdated(data => dispatch({ type: 'UPDATE', payload: data }))

    return () => {
      api.removeNotificationsListener?.()
    }
  }, [])

  return <NotificationsContext.Provider value={state}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
