/* ============================================================
   ScriptStash — Theme registry
   ------------------------------------------------------------
   Each theme is a COMPLETE palette applied as CSS custom
   properties on <html>. Picking a theme reskins the whole app:
   base background, glass surfaces, text, borders and accent.

   Token contract (every theme provides all of these):
     base     --bg --bg-deep --app-bg
     surface  --glass --glass-strong --glass-hover --glass-active
              --glass-border --glass-border-bright --glass-shadow
              --glass-specular --sheen --code-bg --toggle-off
     text     --text --text-muted --text-faint --text-primary
     accent   --accent --accent-2 --accent-alt --accent-deep
              --accent-soft --accent-glow --accent-gradient --primary
     misc     --overlay --on-accent --knob --scrollbar
              --scrollbar-hover --border-subtle
              --shadow-sm --shadow --shadow-lg
   ============================================================ */

// Tokens shared by every DARK theme (surface structure, scrims,
// specular, shadows). Per-theme objects override base/glass/text/accent.
const DARK_COMMON = {
  '--glass-border': 'rgba(255,255,255,0.09)',
  '--glass-border-bright': 'rgba(255,255,255,0.22)',
  '--glass-shadow':
    '0 1px 0 rgba(255,255,255,0.07) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 14px 44px rgba(0,0,0,0.38)',
  '--glass-specular':
    'linear-gradient(180deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.04) 1px, rgba(255,255,255,0) 40%, rgba(0,0,0,0.08) 100%)',
  '--sheen': 'rgba(255,255,255,0.11)',
  '--code-bg': 'rgba(0,0,0,0.4)',
  '--toggle-off': 'rgba(255,255,255,0.08)',
  '--overlay': 'rgba(0,0,0,0.6)',
  '--on-accent': '#ffffff',
  '--knob': '#ffffff',
  '--scrollbar': 'rgba(255,255,255,0.1)',
  '--scrollbar-hover': 'rgba(255,255,255,0.2)',
  '--border-subtle': 'rgba(255,255,255,0.05)',
  '--shadow-sm': '0 2px 8px rgba(0,0,0,0.32)',
  '--shadow': '0 12px 40px rgba(0,0,0,0.42)',
  '--shadow-lg': '0 28px 70px rgba(0,0,0,0.55)',
}

export const THEMES = {
  'rose-noir': {
    id: 'rose-noir',
    label: 'Rose Noir',
    desc: 'Dark pink-red glass',
    preview: {
      bg: 'radial-gradient(circle at 30% 25%, #ff3d72, transparent 62%), #120a0e',
      accent: '#ff4d79',
    },
    vars: {
      ...DARK_COMMON,
      '--bg': '#130d12',
      '--bg-deep': '#0b0709',
      '--app-bg': 'radial-gradient(125% 120% at 30% 0%, #1c0f16 0%, #120a0e 55%, #0a070a 100%)',
      '--glass': 'rgba(26,16,22,0.42)',
      '--glass-strong': 'rgba(34,21,29,0.58)',
      '--glass-hover': 'rgba(42,27,37,0.52)',
      '--glass-active': 'rgba(52,34,46,0.62)',
      '--text': '#f5ecf0',
      '--text-muted': 'rgba(245,236,240,0.58)',
      '--text-faint': 'rgba(245,236,240,0.34)',
      '--text-primary': '#f5ecf0',
      '--accent': '#ff4d79',
      '--accent-2': '#ff8aad',
      '--accent-alt': '#ff8aad',
      '--accent-deep': '#e22a63',
      '--accent-soft': 'rgba(255,77,121,0.14)',
      '--accent-glow': 'rgba(255,77,121,0.42)',
      '--accent-gradient': 'linear-gradient(135deg, #ff8fb1 0%, #ff3d72 55%, #e22a63 100%)',
      '--primary': '#ff4d79',
    },
  },

  ember: {
    id: 'ember',
    label: 'Ember',
    desc: 'Warm amber & gold',
    preview: {
      bg: 'radial-gradient(circle at 35% 25%, #ff8a3d, transparent 62%), #160d06',
      accent: '#ff9a3d',
    },
    vars: {
      ...DARK_COMMON,
      '--bg': '#160f08',
      '--bg-deep': '#0c0704',
      '--app-bg': 'radial-gradient(125% 120% at 35% 0%, #23130a 0%, #160d06 55%, #0c0704 100%)',
      '--glass': 'rgba(44,30,16,0.44)',
      '--glass-strong': 'rgba(54,37,20,0.58)',
      '--glass-hover': 'rgba(62,43,24,0.54)',
      '--glass-active': 'rgba(74,51,28,0.62)',
      '--text': '#f7ede0',
      '--text-muted': 'rgba(247,237,224,0.58)',
      '--text-faint': 'rgba(247,237,224,0.34)',
      '--text-primary': '#f7ede0',
      '--accent': '#ff9a3d',
      '--accent-2': '#ffc36b',
      '--accent-alt': '#ffc36b',
      '--accent-deep': '#e8821c',
      '--accent-soft': 'rgba(255,154,61,0.14)',
      '--accent-glow': 'rgba(255,154,61,0.4)',
      '--accent-gradient': 'linear-gradient(135deg, #ffc266 0%, #ff8a3d 55%, #e8821c 100%)',
      '--primary': '#ff9a3d',
    },
  },

  emerald: {
    id: 'emerald',
    label: 'Emerald',
    desc: 'Deep money-green',
    preview: {
      bg: 'radial-gradient(circle at 30% 25%, #22c997, transparent 62%), #08130d',
      accent: '#22c997',
    },
    vars: {
      ...DARK_COMMON,
      '--bg': '#0a1813',
      '--bg-deep': '#050f0b',
      '--app-bg': 'radial-gradient(125% 120% at 30% 0%, #0d1f1a 0%, #08130d 55%, #050f0b 100%)',
      '--glass': 'rgba(16,40,33,0.44)',
      '--glass-strong': 'rgba(20,50,41,0.58)',
      '--glass-hover': 'rgba(24,58,48,0.54)',
      '--glass-active': 'rgba(28,68,56,0.62)',
      '--text': '#e0f5ee',
      '--text-muted': 'rgba(224,245,238,0.58)',
      '--text-faint': 'rgba(224,245,238,0.34)',
      '--text-primary': '#e0f5ee',
      '--accent': '#22c997',
      '--accent-2': '#5fe3bd',
      '--accent-alt': '#5fe3bd',
      '--accent-deep': '#0d9c78',
      '--accent-soft': 'rgba(34,201,151,0.14)',
      '--accent-glow': 'rgba(34,201,151,0.4)',
      '--accent-gradient': 'linear-gradient(135deg, #5fe3bd 0%, #22c997 55%, #0d9c78 100%)',
      '--primary': '#22c997',
    },
  },

  'cyan-ice': {
    id: 'cyan-ice',
    label: 'Cyan Ice',
    desc: 'Cool electric teal',
    preview: {
      bg: 'radial-gradient(circle at 30% 25%, #2bc4e0, transparent 62%), #06121a',
      accent: '#2bc4e0',
    },
    vars: {
      ...DARK_COMMON,
      '--bg': '#08161c',
      '--bg-deep': '#040d12',
      '--app-bg': 'radial-gradient(125% 120% at 30% 0%, #0a1a22 0%, #06121a 55%, #040d12 100%)',
      '--glass': 'rgba(14,38,46,0.44)',
      '--glass-strong': 'rgba(18,48,58,0.58)',
      '--glass-hover': 'rgba(22,56,67,0.54)',
      '--glass-active': 'rgba(26,66,78,0.62)',
      '--text': '#e0f4fa',
      '--text-muted': 'rgba(224,244,250,0.58)',
      '--text-faint': 'rgba(224,244,250,0.34)',
      '--text-primary': '#e0f4fa',
      '--accent': '#2bc4e0',
      '--accent-2': '#6fe4f5',
      '--accent-alt': '#6fe4f5',
      '--accent-deep': '#129fbd',
      '--accent-soft': 'rgba(43,196,224,0.14)',
      '--accent-glow': 'rgba(43,196,224,0.4)',
      '--accent-gradient': 'linear-gradient(135deg, #6fe4f5 0%, #2bc4e0 55%, #129fbd 100%)',
      '--primary': '#2bc4e0',
    },
  },

  indigo: {
    id: 'indigo',
    label: 'Indigo Night',
    desc: 'Deep nocturnal blue',
    preview: {
      bg: 'radial-gradient(circle at 30% 25%, #6d8bff, transparent 62%), #090e1f',
      accent: '#6d8bff',
    },
    vars: {
      ...DARK_COMMON,
      '--bg': '#0b1024',
      '--bg-deep': '#060912',
      '--app-bg': 'radial-gradient(125% 120% at 30% 0%, #0e1430 0%, #090e1f 55%, #060912 100%)',
      '--glass': 'rgba(20,28,56,0.46)',
      '--glass-strong': 'rgba(26,36,70,0.6)',
      '--glass-hover': 'rgba(30,42,80,0.56)',
      '--glass-active': 'rgba(36,50,94,0.64)',
      '--text': '#e6ebff',
      '--text-muted': 'rgba(230,235,255,0.58)',
      '--text-faint': 'rgba(230,235,255,0.34)',
      '--text-primary': '#e6ebff',
      '--accent': '#6d8bff',
      '--accent-2': '#a9bcff',
      '--accent-alt': '#a9bcff',
      '--accent-deep': '#4a64e0',
      '--accent-soft': 'rgba(109,139,255,0.16)',
      '--accent-glow': 'rgba(109,139,255,0.42)',
      '--accent-gradient': 'linear-gradient(135deg, #93a8ff 0%, #6d8bff 55%, #4a64e0 100%)',
      '--primary': '#6d8bff',
    },
  },

  sunset: {
    id: 'sunset',
    label: 'Sunset',
    desc: 'Warm multi-hue gradient',
    preview: { bg: 'linear-gradient(150deg, #ffb86b, #ff5c7a 55%, #c44bff)', accent: '#ff6a6a' },
    vars: {
      ...DARK_COMMON,
      '--bg': '#1a0e16',
      '--bg-deep': '#100810',
      '--app-bg': 'linear-gradient(155deg, #2a1018 0%, #3a1220 45%, #22101e 100%)',
      '--glass': 'rgba(48,26,36,0.46)',
      '--glass-strong': 'rgba(60,33,45,0.6)',
      '--glass-hover': 'rgba(70,39,52,0.56)',
      '--glass-active': 'rgba(82,46,61,0.64)',
      '--text': '#ffe8ec',
      '--text-muted': 'rgba(255,232,236,0.58)',
      '--text-faint': 'rgba(255,232,236,0.34)',
      '--text-primary': '#ffe8ec',
      '--accent': '#ff6a6a',
      '--accent-2': '#ffb38a',
      '--accent-alt': '#ffb38a',
      '--accent-deep': '#e23d72',
      '--accent-soft': 'rgba(255,106,106,0.15)',
      '--accent-glow': 'rgba(255,90,122,0.42)',
      '--accent-gradient': 'linear-gradient(135deg, #ffb86b 0%, #ff5c7a 50%, #c44bff 100%)',
      '--primary': '#ff6a6a',
    },
  },

  carbon: {
    id: 'carbon',
    label: 'Carbon',
    desc: 'Near-black monochrome',
    grain: true,
    preview: {
      bg: 'radial-gradient(circle at 50% 0%, #2a2a2e, transparent 60%), #0e0e10',
      accent: '#d4d6da',
    },
    vars: {
      ...DARK_COMMON,
      '--bg': '#121214',
      '--bg-deep': '#0a0a0b',
      '--app-bg': 'radial-gradient(130% 120% at 50% 0%, #161618 0%, #0e0e10 55%, #0a0a0b 100%)',
      '--glass': 'rgba(255,255,255,0.045)',
      '--glass-strong': 'rgba(255,255,255,0.07)',
      '--glass-hover': 'rgba(255,255,255,0.08)',
      '--glass-active': 'rgba(255,255,255,0.11)',
      '--text': '#ededee',
      '--text-muted': 'rgba(237,237,238,0.56)',
      '--text-faint': 'rgba(237,237,238,0.32)',
      '--text-primary': '#ededee',
      '--accent': '#d4d6da',
      '--accent-2': '#eceef0',
      '--accent-alt': '#eceef0',
      '--accent-deep': '#a8abb0',
      '--accent-soft': 'rgba(255,255,255,0.07)',
      '--accent-glow': 'rgba(255,255,255,0.16)',
      '--accent-gradient': 'linear-gradient(135deg, #eceef0 0%, #d4d6da 55%, #a8abb0 100%)',
      '--primary': '#d4d6da',
      // near-white accent → dark text/knob on filled accent surfaces
      '--on-accent': '#161618',
      '--knob': '#161618',
    },
  },

  frost: {
    id: 'frost',
    label: 'Frost',
    desc: 'Bright frosted glass · light',
    light: true,
    preview: { bg: 'linear-gradient(160deg, #eef1f7, #dde3ee)', accent: '#3d6bff' },
    vars: {
      '--bg': '#eef1f7',
      '--bg-deep': '#e2e7f0',
      '--app-bg': 'linear-gradient(160deg, #eef1f7 0%, #e3e8f1 100%)',
      '--glass': 'rgba(255,255,255,0.58)',
      '--glass-strong': 'rgba(255,255,255,0.72)',
      '--glass-hover': 'rgba(255,255,255,0.66)',
      '--glass-active': 'rgba(255,255,255,0.82)',
      '--glass-border': 'rgba(20,30,60,0.1)',
      '--glass-border-bright': 'rgba(20,30,60,0.2)',
      '--glass-shadow':
        '0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(20,30,60,0.05) inset, 0 14px 40px rgba(20,30,60,0.12)',
      '--glass-specular':
        'linear-gradient(180deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.2) 1px, rgba(255,255,255,0) 42%, rgba(20,30,60,0.03) 100%)',
      '--sheen': 'rgba(255,255,255,0.55)',
      '--code-bg': 'rgba(20,30,60,0.06)',
      '--toggle-off': 'rgba(20,30,60,0.18)',
      '--overlay': 'rgba(30,40,70,0.35)',
      '--on-accent': '#ffffff',
      '--knob': '#ffffff',
      '--scrollbar': 'rgba(20,30,60,0.18)',
      '--scrollbar-hover': 'rgba(20,30,60,0.3)',
      '--border-subtle': 'rgba(20,30,60,0.06)',
      '--shadow-sm': '0 2px 8px rgba(20,30,60,0.12)',
      '--shadow': '0 12px 40px rgba(20,30,60,0.14)',
      '--shadow-lg': '0 28px 70px rgba(20,30,60,0.18)',
      '--text': '#1a2233',
      '--text-muted': 'rgba(26,34,51,0.6)',
      '--text-faint': 'rgba(26,34,51,0.38)',
      '--text-primary': '#1a2233',
      '--accent': '#3d6bff',
      '--accent-2': '#6a8dff',
      '--accent-alt': '#6a8dff',
      '--accent-deep': '#2b50d6',
      '--accent-soft': 'rgba(61,107,255,0.1)',
      '--accent-glow': 'rgba(61,107,255,0.28)',
      '--accent-gradient': 'linear-gradient(135deg, #6a8dff 0%, #3d6bff 55%, #2b50d6 100%)',
      '--primary': '#3d6bff',
    },
  },
}

// Ordered list for the picker UI.
export const THEME_LIST = [
  THEMES['rose-noir'],
  THEMES.ember,
  THEMES.emerald,
  THEMES['cyan-ice'],
  THEMES.indigo,
  THEMES.sunset,
  THEMES.carbon,
  THEMES.frost,
]

export const DEFAULT_THEME = 'rose-noir'

// Map legacy ss_env values onto the new themes (one-time migration).
const LEGACY_ENV_MAP = { aurora: 'rose-noir', mesh: 'rose-noir', stealth: 'carbon' }

export function resolveInitialThemeId() {
  try {
    const saved = localStorage.getItem('ss_theme')
    if (saved && THEMES[saved]) return saved
    const legacyEnv = localStorage.getItem('ss_env')
    if (legacyEnv && LEGACY_ENV_MAP[legacyEnv]) return LEGACY_ENV_MAP[legacyEnv]
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_THEME
}

// Apply a theme's full token map to <html>. Returns the resolved id.
export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME]
  const root = document.documentElement.style
  for (const [key, value] of Object.entries(theme.vars)) {
    root.setProperty(key, value)
  }
  document.documentElement.dataset.theme = theme.id
  document.documentElement.dataset.grain = theme.grain ? 'on' : 'off'
  return theme.id
}
