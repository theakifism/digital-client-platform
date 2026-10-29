// PHOTO BACKUP: downloads every photo (from Supabase Storage, or from Cloudflare R2 if you use it) into a folder.
// Run by GitHub every week (.github/workflows/photo-backup.yml). You can also run it by hand:
//   node --env-file=.env.local scripts/backup-photos.mjs
// Supabase: needs only SUPABASE_URL and SUPABASE_ANON_KEY (public values). R2: needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY and R2_BUCKET (use a READ-ONLY token on GitHub, see MILESTONE-18.md).
// Output: the folder photo-backup/ (the photos, with the same folder names) and photo-backup/manifest.tsv
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { readSource, retry } from './photo-source.mjs'

const OUT = process.env.OUT_DIR || 'photo-backup'
const source = readSource()

if (!source) {
  console.error('Missing settings: SUPABASE_URL and SUPABASE_ANON_KEY, or the four R2 settings (in GitHub: Settings -> Secrets and variables -> Actions).')
  process.exit(2)
}
console.log(`Reading the photos from ${source.name}.`)

// Only safe-looking paths are written to disk (letters, numbers, dash, underscore, dot, slash; no "..").
const safe = (p) => /^[A-Za-z0-9._\-\/]+$/.test(p) && !p.split('/').some((part) => part === '..' || part === '')

async function download(p) {
  return retry(`downloading ${p}`, async () => {
    const buf = await source.get(p)
    if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG file')
    return buf
  })
}

const paths = await source.listKeys()
const wanted = paths.filter((p) => {
  if (!safe(p)) console.warn(`Skipping a file with an unusual name: ${p}`)
  return safe(p)
})

await mkdir(OUT, { recursive: true })
const manifest = []
let total = 0
let failed = 0
const queue = [...wanted]
async function worker() {
  while (queue.length > 0) {
    const p = queue.shift()
    try {
      const buf = await download(p)
      const file = path.join(OUT, ...p.split('/'))
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, buf)
      total += buf.length
      manifest.push(`${p}\t${buf.length}\t${createHash('sha256').update(buf).digest('hex')}`)
    } catch (e) {
      failed++
      console.error(`FAILED: ${e instanceof Error ? e.message : e}`)
    }
  }
}
await Promise.all(Array.from({ length: 5 }, worker))

manifest.sort()
await writeFile(path.join(OUT, 'manifest.tsv'), 'path\tbytes\tsha256\n' + manifest.join('\n') + (manifest.length ? '\n' : ''))

const mb = (total / 1024 / 1024).toFixed(1)
console.log(`Photos found: ${wanted.length}. Saved: ${manifest.length} (${mb} MB). Failed: ${failed}.`)
if (wanted.length === 0) console.warn('WARNING: no photos were found. That is normal for a new project; if you expect photos, check the settings.')
if (total > 150 * 1024 * 1024) console.warn('WARNING: the photo backup is over 150 MB. GitHub gives only 500 MB of artifact space on a free private repository. Plan a different place to keep backups.')
if (failed > 0) process.exit(1)
