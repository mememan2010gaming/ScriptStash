import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { THEMES, THEME_LIST, applyTheme, resolveInitialThemeId } from '../design-system/themes'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialThemeId)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem('ss_theme', theme)
      // Retire legacy keys once migrated.
      localStorage.removeItem('ss_env')
      localStorage.removeItem('ss_accent')
    } catch {
      /* localStorage unavailable */
    }
  }, [theme])

  const setTheme = useCallback(id => {
    if (THEMES[id]) setThemeState(id)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEME_LIST }}>
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
