// PHOTO RESTORE: puts a photo backup folder back into Supabase Storage (or into Cloudflare R2 if you use it).
// Use it only into a NEW or scratch place, or after photos were lost. It needs SECRET keys that may write,
// so run it on your own computer (never on GitHub).
//
//   node --env-file=.env.local scripts/restore-photos.mjs <backup-folder> --yes
//
// Supabase: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (of the project you restore INTO; run migration 004 there first).
// R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in .env.local.
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { writeTarget } from './photo-source.mjs'

const folder = process.argv[2]
const confirmed = process.argv.includes('--yes')
const target = await writeTarget()

if (!folder || folder.startsWith('--')) {
  console.error('Usage: node --env-file=.env.local scripts/restore-photos.mjs <backup-folder> --yes')
  process.exit(2)
}
if (!target) {
  console.error('Missing settings in .env.local: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or the four R2 settings (they must belong to the place you are restoring INTO).')
  process.exit(2)
}

async function files(dir, base = '') {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...(await files(path.join(dir, entry.name), rel)))
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.jpg')) out.push(rel)
  }
  return out
}

try {
  await stat(folder)
} catch {
  console.error(`The folder "${folder}" does not exist.`)
  process.exit(2)
}

const list = await files(folder)
console.log(`Found ${list.length} photos in "${folder}".`)
console.log(`They will be uploaded to: ${target.name}`)
if (!confirmed) {
  console.log('Nothing was uploaded. Check that the address above is the project you want, then run again with --yes at the end.')
  process.exit(0)
}

let done = 0
let failed = 0
for (const rel of list) {
  const bytes = await readFile(path.join(folder, ...rel.split('/')))
  try {
    await target.put(rel, bytes)
    done++
  } catch (e) {
    failed++
    console.error(`FAILED ${rel}: ${e instanceof Error ? e.message : e}`)
  }
}
console.log(`Uploaded: ${done}. Failed: ${failed}.`)
process.exit(failed > 0 ? 1 : 0)
