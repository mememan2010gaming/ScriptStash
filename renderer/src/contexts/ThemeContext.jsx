import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { THEMES, THEME_LIST, applyTheme, resolveInitialThemeId } from '../design-system/themes'

const DENSITY_VALUES = ['mosaic', 'list', 'compact']

function resolveInitialDensity() {
  try {
    const saved = localStorage.getItem('ss_density')
    if (saved && DENSITY_VALUES.includes(saved)) return saved
  } catch {
    /* localStorage unavailable */
  }
  return 'list'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialThemeId)
  const [density, setDensityState] = useState(resolveInitialDensity)

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

  const setDensity = useCallback(id => {
    if (!DENSITY_VALUES.includes(id)) return
    setDensityState(id)
    try {
      localStorage.setItem('ss_density', id)
    } catch {
      /* localStorage unavailable */
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEME_LIST, density, setDensity }}>
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
