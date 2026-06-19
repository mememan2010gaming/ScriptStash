import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ThemeContext = createContext(null)

const THEMES = ['ocean', 'crimson', 'violet', 'emerald', 'sunset', 'custom']
const MODES = ['dark', 'light']

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('ss-theme') || 'ocean')
  const [mode, setModeState] = useState(() => localStorage.getItem('ss-mode') || 'dark')

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-mode', mode)
    localStorage.setItem('ss-theme', theme)
    localStorage.setItem('ss-mode', mode)
  }, [theme, mode])

  // Load custom theme CSS from localStorage
  useEffect(() => {
    if (theme === 'custom') {
      const customCSS = localStorage.getItem('ss-custom-theme-css')
      if (customCSS) {
        let styleEl = document.getElementById('custom-theme-vars')
        if (!styleEl) {
          styleEl = document.createElement('style')
          styleEl.id = 'custom-theme-vars'
          document.head.appendChild(styleEl)
        }
        styleEl.textContent = customCSS
      }
    }
  }, [theme])

  const setTheme = useCallback(t => {
    if (THEMES.includes(t)) setThemeState(t)
  }, [])

  const setMode = useCallback(m => {
    if (MODES.includes(m)) setModeState(m)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setCustomThemeCSS = useCallback(css => {
    localStorage.setItem('ss-custom-theme-css', css)
    let styleEl = document.getElementById('custom-theme-vars')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-theme-vars'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        themes: THEMES,
        setTheme,
        setMode,
        toggleMode,
        setCustomThemeCSS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default ThemeContext
