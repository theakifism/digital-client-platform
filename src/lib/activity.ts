// The last N calendar days in India time, oldest first, as 'YYYY-MM-DD'.
export function lastDaysIST(n: number, now: number = Date.now()): string[] {
  const ist = now + 5.5 * 60 * 60 * 1000
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(new Date(ist - i * 86400000).toISOString().slice(0, 10))
  return out
}
