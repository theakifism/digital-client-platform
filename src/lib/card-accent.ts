export const DEFAULT_ACCENTS: Record<string, string> = {
  light: '#0b6e62',
  dark: '#3ccbb4',
  teal: '#0b6e62',
  orion: '#1a6fae',
}

export function isHexAccent(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function accentTextColor(value: string): '#ffffff' | '#10202e' {
  if (!isHexAccent(value)) return '#ffffff'
  const luminance = accentLuminance(value)
  return luminance > 0.179 ? '#10202e' : '#ffffff'
}

export function accentTextOnSurface(value: string, darkSurface: boolean): string {
  if (!isHexAccent(value)) return value
  const accent = accentLuminance(value)
  const surface = darkSurface ? 0.018 : 1
  const ratio = (Math.max(accent, surface) + 0.05) / (Math.min(accent, surface) + 0.05)
  if (ratio >= 4.5) return value
  return darkSurface ? '#ffffff' : '#10202e'
}

function accentLuminance(value: string): number {
  const linear = (offset: number) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  return linear(1) * 0.2126 + linear(3) * 0.7152 + linear(5) * 0.0722
}
