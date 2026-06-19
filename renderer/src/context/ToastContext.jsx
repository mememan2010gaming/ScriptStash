import { createContext, useContext, useReducer, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload].slice(-5) // Max 5 toasts
    case 'REMOVE':
      return state.filter(t => t.id !== action.payload)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  const idCounter = useRef(0)

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter.current
    dispatch({
      type: 'ADD',
      payload: { id, message, type, duration },
    })
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE', payload: id })
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback(id => {
    dispatch({ type: 'REMOVE', payload: id })
  }, [])

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast])
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast])
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast])
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext
