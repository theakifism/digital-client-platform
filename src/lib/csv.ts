// A small CSV reader and writer (works with files saved from Excel as "CSV").

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '')
  const first = text.split(/\r?\n/, 1)[0] ?? ''
  const count = (ch: string) => first.split(ch).length - 1
  const delim = [',', ';', '\t'].reduce((best, d) => (count(d) > count(best) ? d : best), ',')

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === delim) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else field += c
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

export function csvToRecords(rows: string[][]) {
  if (rows.length === 0) return { headers: [] as string[], records: [] as { line: number; values: Record<string, string> }[] }
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const records = rows.slice(1).map((r, i) => {
    const values: Record<string, string> = {}
    headers.forEach((h, j) => { values[h] = (r[j] ?? '').trim() })
    return { line: i + 1, values } // number among the client rows (blank rows are skipped)
  })
  return { headers, records }
}

export function toCsv(rows: string[][]): string {
  // International phone numbers such as "+91 98765 43210" start with "+" but are not formulas, so they stay as they are.
  const phoneLike = /^\+[\d\s().-]{6,}$/
  const cell = (v: string) => {
    const safe = /^[=+\-@\t\r]/.test(v) && !phoneLike.test(v) ? `'${v}` : v // stops Excel from running formulas
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
