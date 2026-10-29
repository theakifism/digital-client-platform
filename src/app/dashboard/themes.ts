// The card themes a client can choose. The ids must match the ones in src/app/[slug]/card.css.
export const THEMES = [
  { id: 'light', label: 'Light', swatch: '#ffffff' },
  { id: 'dark', label: 'Dark', swatch: '#132430' },
  { id: 'teal', label: 'Teal', swatch: '#0b6e62' },
  { id: 'orion', label: 'Orion blue', swatch: '#1a6fae' },
]

export const THEME_IDS = THEMES.map((t) => t.id)
