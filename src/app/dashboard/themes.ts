// The card themes a client can choose. The ids must match the ones in src/app/[slug]/card.css.
export const THEMES = [
  { id: 'light', label: 'Light', swatch: '#ffffff' },
  { id: 'dark', label: 'Dark', swatch: '#132430' },
  { id: 'teal', label: 'Teal mist', swatch: '#eaf3f1' },
  { id: 'orion', label: 'Blue mist', swatch: '#eaf1f6' },
]

export const THEME_IDS = THEMES.map((t) => t.id)
