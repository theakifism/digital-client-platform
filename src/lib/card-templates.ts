// The card TEMPLATES (layouts) a card can use (Milestone 22). Safe to import anywhere (no React, no server code).
// The colours still come from the card's theme (src/app/dashboard/themes.ts). The look of each template is in src/app/[slug]/templates.css
// and its markup in src/app/[slug]/templates.tsx. To add a template: add it here, add its component and its CSS. No migration needed.
export const TEMPLATES = [
  { id: 'classic', label: 'Classic', description: 'The simple centered card: round photo, name and buttons.' },
  { id: 'wave', label: 'Wave', description: 'Large photo with a curved edge, a round badge and contact rows with coloured icons.' },
  { id: 'overlap', label: 'Overlap', description: 'Photo with a name panel that floats over it, then an About section and contact rows.' },
  { id: 'band', label: 'Band', description: 'Wide photo band with a colour line, a clean name block and contact rows.' },
  { id: 'midnight', label: 'Midnight', description: 'Dark, full-height photo that fades into deep colour, round glass icons and an Add to contact bar.' },
  { id: 'neon', label: 'Neon', description: 'Bold black style: grayscale photo, big capital name and bright highlight colour.' },
  { id: 'deep', label: 'Deep Wave', description: 'Grayscale photo with a big curved colour block, a round badge and bright round icons.' },
  { id: 'paper', label: 'Paper', description: 'Soft page with a torn-paper edge, a round photo and rounded cards.' },
  { id: 'formal', label: 'Formal', description: 'Flat, plain and still. No effects. Suited to banks and offices.' },
] as const

export type TemplateId = (typeof TEMPLATES)[number]['id']
export const TEMPLATE_IDS: string[] = TEMPLATES.map((t) => t.id)

// An empty or unknown value means Classic, so every card made before templates existed looks exactly as before.
export function resolveTemplate(value: string | null | undefined): TemplateId {
  return (TEMPLATES.find((t) => t.id === value)?.id ?? 'classic') as TemplateId
}
