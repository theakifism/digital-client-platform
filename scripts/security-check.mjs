// SECURITY CHECK: proves what a visitor and a client can and cannot do in your database.
// It logs in as two TEST clients (A and B) and tries things they must NOT be able to do.
// Use TEST accounts only, never a real client's.
//
// Run from the project folder:
//   node --env-file=.env.local --env-file=.env.security scripts/security-check.mjs
//
// Set up first: see docs/SECURITY-CHECK.md (two test clients, each with a card, and one message on each card).
import { createClient } from '@supabase/supabase-js'

const need = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SEC_USER_A', 'SEC_PASS_A', 'SEC_USER_B', 'SEC_PASS_B']
const missing = need.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error('Missing settings: ' + missing.join(', '))
  console.error('See docs/SECURITY-CHECK.md for how to set them up.')
  process.exit(2)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'example.com'
const OFF_SLUG = process.env.SEC_OFF_SLUG || 'demo-off'
const MARK = 'SECURITY-TEST-DO-NOT-KEEP'
const rand = Math.random().toString(36).slice(2, 8)

let passed = 0
let failed = 0
let warnings = 0

const say = (icon, text) => console.log(`${icon} ${text}`)
const warn = (text) => { warnings++; say('!!', text) }

async function check(name, fn) {
  try {
    const ok = await fn()
    if (ok === true) { passed++; say('PASS', name) } else { failed++; say('FAIL', name + '   <-- FIX THIS BEFORE GOING LIVE') }
  } catch (e) {
    failed++
    say('FAIL', `${name} (error: ${e.message})`)
  }
}

// "gone" = the database gave back nothing (an error, no data, or an empty list)
const gone = (r) => !!r.error || r.data == null || (Array.isArray(r.data) && r.data.length === 0)

const mk = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function login(username, password) {
  const c = mk()
  const email = `${username.trim().toLowerCase()}@${domain}`
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error || !data?.user) throw new Error(`Could not log in as "${username}": ${error?.message ?? 'no user'}`)
  return { c, id: data.user.id }
}

async function ownCard(who) {
  const { data, error } = await who.c.from('cards').select('id, slug, owner_id, is_active, name, bio').eq('owner_id', who.id).limit(1)
  if (error || !data?.length) throw new Error(`Test client ${who.id} owns no card. Create one in the admin panel first.`)
  return data[0]
}

const anon = mk()
let A, B, cardA, cardB
try {
  A = await login(process.env.SEC_USER_A, process.env.SEC_PASS_A)
  B = await login(process.env.SEC_USER_B, process.env.SEC_PASS_B)
  cardA = await ownCard(A)
  cardB = await ownCard(B)
} catch (e) {
  console.error('SETUP PROBLEM: ' + e.message)
  process.exit(2)
}
if (A.id === B.id) { console.error('SETUP PROBLEM: test clients A and B must be two different logins.'); process.exit(2) }

// Are there messages to protect? Without any, "cannot see them" proves nothing.
const ownLeadsA = await A.c.from('leads').select('id').eq('card_id', cardA.id)
const ownLeadsB = await B.c.from('leads').select('id').eq('card_id', cardB.id)
const countB = ownLeadsB.data?.length ?? 0
if ((ownLeadsA.data?.length ?? 0) === 0 || countB === 0) {
  warn('A test client has no messages. Send one through each test card on the website, then run again. Some checks below prove less without them.')
}

console.log('\n--- A visitor who is not logged in ---')
await check('cannot read messages (leads)', async () => gone(await anon.from('leads').select('id').limit(5)))
await check('cannot read activity numbers (events)', async () => gone(await anon.from('events').select('id').limit(5)))
await check('cannot read card requests', async () => gone(await anon.from('requests').select('id').limit(5)))
await check('cannot read logins (profiles)', async () => gone(await anon.from('profiles').select('id').limit(5)))
await check('cannot read website sections that are switched off', async () => gone(await anon.from('card_blocks').select('id').eq('is_visible', false)))
if (cardA.is_active) {
  await check('CAN read an active card (cards must be public)', async () => (await anon.from('cards').select('id').eq('id', cardA.id)).data?.length === 1)
} else warn(`Test card A is switched off, so the "public card" check was skipped.`)
await check(`cannot read the switched-off card "${OFF_SLUG}"`, async () => gone(await anon.from('cards').select('id').eq('slug', OFF_SLUG)))
await check('cannot change a card', async () => gone(await anon.from('cards').update({ bio: MARK }).eq('id', cardA.id).select('id')))
await check('cannot create a card', async () => gone(await anon.from('cards').insert({ slug: 'sec-test-' + rand, name: 'x' }).select('id')))
await check('cannot write a message straight into the database', async () => gone(await anon.from('leads').insert({ card_id: cardA.id, name: 'x', consent: true }).select('id')))
await check('cannot write activity numbers straight into the database', async () => gone(await anon.from('events').insert({ card_id: cardA.id, type: 'view' }).select('id')))
await check('cannot write a card request straight into the database', async () => gone(await anon.from('requests').insert({ name: 'x', email: 'x@example.com', consent: true }).select('id')))
await check('cannot open the admin usage numbers', async () => !!(await anon.rpc('admin_usage')).error)
await check('cannot open a card\'s activity numbers', async () => gone(await anon.rpc('card_activity', { p_card: cardA.id, p_days: 30 })))

console.log('\n--- Client A (logged in) tries to reach Client B\'s data ---')
await check('cannot read B\'s messages', async () => gone(await A.c.from('leads').select('id').eq('card_id', cardB.id)))
await check('cannot read B\'s activity events', async () => gone(await A.c.from('events').select('id').eq('card_id', cardB.id)))
await check('cannot read B\'s activity through the helper function', async () => gone(await A.c.rpc('card_activity', { p_card: cardB.id, p_days: 30 })))
await check('cannot read B\'s switched-off website sections', async () => gone(await A.c.from('card_blocks').select('id').eq('card_id', cardB.id).eq('is_visible', false)))
await check('sees only their own login (profiles)', async () => {
  const r = await A.c.from('profiles').select('id')
  return !r.error && r.data.length >= 1 && r.data.every((p) => p.id === A.id)
})
await check('cannot read card requests', async () => gone(await A.c.from('requests').select('id').limit(5)))
await check('cannot open the admin usage numbers', async () => !!(await A.c.rpc('admin_usage')).error)

await check('cannot change B\'s card', async () => {
  const r = await A.c.from('cards').update({ bio: MARK }).eq('id', cardB.id).select('id')
  const after = await B.c.from('cards').select('bio').eq('id', cardB.id).single()
  if (after.data?.bio === MARK) { await B.c.from('cards').update({ bio: cardB.bio }).eq('id', cardB.id); return false }
  return gone(r)
})
await check('cannot delete B\'s card', async () => {
  const r = await A.c.from('cards').delete().eq('id', cardB.id).select('id')
  const still = await B.c.from('cards').select('id').eq('id', cardB.id)
  return still.data?.length === 1 && gone(r)
})
await check('cannot add website sections to B\'s card', async () =>
  gone(await A.c.from('card_blocks').insert({ card_id: cardB.id, type: 'about', position: 0, is_visible: true, content: { text: MARK } }).select('id')))
await check('cannot delete B\'s messages', async () => {
  const r = await A.c.from('leads').delete().eq('card_id', cardB.id).select('id')
  const after = await B.c.from('leads').select('id').eq('card_id', cardB.id)
  return (after.data?.length ?? 0) === countB && gone(r)
})

console.log('\n--- Client A tries to break the rules on their OWN card ---')
await check('cannot give their card to someone else', async () => {
  await A.c.from('cards').update({ owner_id: B.id }).eq('id', cardA.id)
  const after = await A.c.from('cards').select('owner_id').eq('id', cardA.id).maybeSingle()
  return after.data?.owner_id === A.id
})
await check('cannot change the card link (slug)', async () => {
  await A.c.from('cards').update({ slug: 'sec-test-' + rand }).eq('id', cardA.id)
  const after = await A.c.from('cards').select('slug').eq('id', cardA.id).maybeSingle()
  return after.data?.slug === cardA.slug
})
await check('cannot switch their own card on or off', async () => {
  await A.c.from('cards').update({ is_active: !cardA.is_active }).eq('id', cardA.id)
  const after = await A.c.from('cards').select('is_active').eq('id', cardA.id).maybeSingle()
  return after.data?.is_active === cardA.is_active
})
await check('cannot make themselves an admin', async () => {
  const r = await A.c.from('profiles').update({ role: 'admin' }).eq('id', A.id).select('role')
  const after = await A.c.from('profiles').select('role').eq('id', A.id).single()
  return after.data?.role === 'client' && gone(r)
})
await check('cannot create a new card', async () => gone(await A.c.from('cards').insert({ owner_id: A.id, slug: 'sec-test-' + rand, name: 'x' }).select('id')))
await check('cannot delete their own card (only the admin can)', async () => {
  const r = await A.c.from('cards').delete().eq('id', cardA.id).select('id')
  const still = await A.c.from('cards').select('id').eq('id', cardA.id)
  return still.data?.length === 1 && gone(r)
})
await check('cannot write a message straight into the database', async () => gone(await A.c.from('leads').insert({ card_id: cardA.id, name: 'x', consent: true }).select('id')))
await check('cannot write activity numbers straight into the database', async () => gone(await A.c.from('events').insert({ card_id: cardA.id, type: 'view' }).select('id')))
await check('cannot write a card request straight into the database', async () => gone(await A.c.from('requests').insert({ name: 'x', email: 'x@example.com', consent: true }).select('id')))

console.log('\n--- Pilot tools (feedback, adoption numbers, photo list) ---')
await check('a visitor who is not logged in cannot read feedback', async () => gone(await anon.from('feedback').select('id').limit(5)))
await check('a visitor who is not logged in cannot write feedback', async () => gone(await anon.from('feedback').insert({ owner_id: A.id, message: 'x' }).select('id')))
await check('a visitor cannot open the adoption numbers', async () => !!(await anon.rpc('admin_adoption')).error)
await check('a visitor cannot open the unused-photo list', async () => !!(await anon.rpc('admin_unused_photos')).error)
await check('client A cannot open the adoption numbers', async () => !!(await A.c.rpc('admin_adoption')).error)
await check('client A cannot open the unused-photo list', async () => !!(await A.c.rpc('admin_unused_photos')).error)
await check('client A sees only their own feedback', async () => {
  const r = await A.c.from('feedback').select('owner_id')
  return !r.error && r.data.every((f) => f.owner_id === A.id)
})
await check('client A cannot write feedback in B\'s name', async () => gone(await A.c.from('feedback').insert({ owner_id: B.id, message: 'x' }).select('id')))

console.log('\n--- Photo storage (Milestone 18: uploads only through the server) ---')
const tiny = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
await check('cannot upload into B\'s photo folder in the Supabase photo bucket', async () => {
  const path = `${B.id}/gallery/security-test-${rand}.jpg`
  const r = await A.c.storage.from('card-photos').upload(path, tiny(), { contentType: 'image/jpeg' })
  if (!r.error) await A.c.storage.from('card-photos').remove([path])
  return !!r.error
})
// After migration 014 a client cannot write to the old bucket at all. Before 014 this is only a warning.
{
  const path = `${A.id}/security-test-${rand}.jpg`
  const r = await A.c.storage.from('card-photos').upload(path, tiny(), { contentType: 'image/jpeg' })
  if (r.error) {
    await check('a client cannot write to the Supabase photo bucket directly (migration 014)', async () => true)
  } else {
    await A.c.storage.from('card-photos').remove([path])
    warn('A client can still write to the Supabase photo bucket directly: run migration 014 (after the server upload works on the live site) to close it.')
  }
}

// Milestone 14: follow-up status and private note on messages. Skipped (with a warning) until migration 011 is run.
const followUpReady = !(await A.c.from('leads').select('status').eq('card_id', cardA.id).limit(1)).error
if (!followUpReady) {
  warn('Message follow-up checks skipped: migration 011 has not been run yet.')
} else {
  console.log('\n--- Message follow-up (status and note) ---')
  await check('a visitor who is not logged in cannot change a message status', async () =>
    gone(await anon.from('leads').update({ status: 'won' }).eq('card_id', cardA.id).select('id')))
  await check('A cannot change the status or note on B\'s messages', async () => {
    const before = await B.c.from('leads').select('id, status, note').eq('card_id', cardB.id).order('id')
    const r = await A.c.from('leads').update({ status: 'won', note: MARK }).eq('card_id', cardB.id).select('id')
    const after = await B.c.from('leads').select('id, status, note').eq('card_id', cardB.id).order('id')
    return JSON.stringify(before.data) === JSON.stringify(after.data) && gone(r)
  })
  const mine = ownLeadsA.data?.[0]
  if (!mine) {
    warn('Client A has no message, so the "can update own message" checks were skipped.')
  } else {
    await check('A cannot rewrite what a visitor wrote (name or message) on their own message', async () => {
      const before = await A.c.from('leads').select('name, message').eq('id', mine.id).single()
      await A.c.from('leads').update({ name: MARK }).eq('id', mine.id)
      await A.c.from('leads').update({ message: MARK }).eq('id', mine.id)
      const after = await A.c.from('leads').select('name, message').eq('id', mine.id).single()
      return !before.error && before.data?.name === after.data?.name && before.data?.message === after.data?.message
    })
    await check('A cannot set a status that is not in the list', async () => {
      const r = await A.c.from('leads').update({ status: 'hacked' }).eq('id', mine.id).select('id')
      return gone(r)
    })
    await check('A CAN change the status and note on their own message (and it is put back afterwards)', async () => {
      const before = await A.c.from('leads').select('status, note').eq('id', mine.id).single()
      if (before.error) return false
      const r = await A.c.from('leads').update({ status: 'contacted', note: MARK }).eq('id', mine.id).select('id, status, note')
      const worked = !r.error && r.data?.length === 1 && r.data[0].status === 'contacted' && r.data[0].note === MARK
      await A.c.from('leads').update({ status: before.data.status, note: before.data.note }).eq('id', mine.id)
      return worked
    })
  }
}

// Milestone 17: only the admin can change a client's password. Needs migration 013.
// This check tries to change A's own password as A. If it unexpectedly works, it puts the old password back and reports FAIL.
console.log('\n--- Passwords can only be changed by the admin (Milestone 17) ---')
await check('a logged-in client CANNOT change their own password', async () => {
  const attempt = await A.c.auth.updateUser({ password: 'Check-' + Math.random().toString(36).slice(2) + '-Zz9' })
  if (attempt.error) return true
  await A.c.auth.updateUser({ password: process.env.SEC_PASS_A }) // it worked: put the old password back
  return false
})

console.log('\n--- Client B, the other way round ---')
await check('cannot read A\'s messages', async () => gone(await B.c.from('leads').select('id').eq('card_id', cardA.id)))
await check('cannot read A\'s activity events', async () => gone(await B.c.from('events').select('id').eq('card_id', cardA.id)))

// Optional: an admin login makes the "cannot" checks above meaningful (the data really exists).
if (process.env.SEC_USER_ADMIN && process.env.SEC_PASS_ADMIN) {
  console.log('\n--- Admin (for comparison: these SHOULD work) ---')
  try {
    const Z = await login(process.env.SEC_USER_ADMIN, process.env.SEC_PASS_ADMIN)
    const reqs = await Z.c.from('requests').select('id').limit(1)
    if (!reqs.error && reqs.data?.length) { passed++; say('PASS', 'admin can read card requests (so the "cannot" checks above are meaningful)') }
    else warn('The admin sees no card requests. Send one through the Request a card form so the "cannot read card requests" checks prove something.')
    await check('admin can open the usage numbers', async () => !(await Z.c.rpc('admin_usage')).error)
    const oc = await Z.c.from('organizations').select('id').limit(1)
    if (oc.error) warn('Organizations not available (run migration 017): ' + oc.error.message)
    else await check('admin can read organizations', async () => !oc.error)
    const lc = await Z.c.rpc('admin_lead_counts')
    if (lc.error) warn('Admin message counts not available (run migration 016): ' + lc.error.message)
    else {
      await check('admin message counts hold numbers only (no names, phones, e-mails or message text)', async () => {
        const keys = Object.keys(lc.data?.[0] ?? {})
        return keys.length === 0 || !keys.some((k) => ['name', 'email', 'phone', 'message', 'note'].includes(k))
      })
    }
  } catch (e) { warn('Admin checks skipped: ' + e.message) }
}

console.log('\n--- Milestone 19 hardening (these FAIL until migration 015 is run) ---')
await check('a visitor who is not logged in cannot read who owns a card (owner_id)', async () => !!(await anon.from('cards').select('owner_id').limit(1)).error)
await check('a client cannot change the card link, owner or on/off switch with a direct database call', async () => {
  const r1 = await A.c.from('cards').update({ slug: 'sec-test-' + rand }).eq('id', cardA.id)
  const r2 = await A.c.from('cards').update({ owner_id: B.id }).eq('id', cardA.id)
  const r3 = await A.c.from('cards').update({ is_active: !cardA.is_active }).eq('id', cardA.id)
  return !!r1.error && !!r2.error && !!r3.error
})
await check('a client cannot store an over-long name straight in the database', async () => !!(await A.c.from('cards').update({ name: 'x'.repeat(200) }).eq('id', cardA.id)).error)
await check('a client cannot store an unknown theme straight in the database', async () => !!(await A.c.from('cards').update({ theme: 'bogus' }).eq('id', cardA.id)).error)
await check('a client cannot store a huge social links object straight in the database', async () => !!(await A.c.from('cards').update({ social_links: { instagram: 'x'.repeat(5000) } }).eq('id', cardA.id)).error)
await check('visitors and clients cannot use the rate-limit counter', async () => {
  const args = { p_key: 'security-test', p_window_seconds: 60, p_max: 1 }
  return !!(await anon.rpc('hit_rate_limit', args)).error && !!(await A.c.rpc('hit_rate_limit', args)).error
})
await check('visitors and clients cannot delete old activity numbers', async () =>
  !!(await anon.rpc('purge_old_events', { p_days: 400 })).error && !!(await A.c.rpc('purge_old_events', { p_days: 400 })).error)

console.log('\n--- Milestone 20 admin message counts (these FAIL until migration 016 is run) ---')
await check('a visitor cannot open the admin message counts', async () => !!(await anon.rpc('admin_lead_counts')).error)
await check('client A cannot open the admin message counts', async () => !!(await A.c.rpc('admin_lead_counts')).error)

console.log('\n--- Milestone 21 organizations (these FAIL until migration 017 is run; test clients A and B must NOT belong to an organization) ---')
await check('a visitor cannot read organizations', async () => gone(await anon.from('organizations').select('id').limit(5)))
await check('a visitor cannot open the organization message counts', async () => !!(await anon.rpc('org_staff_counts')).error)
await check('client A cannot read any organization', async () => gone(await A.c.from('organizations').select('id').limit(5)))
await check('client A cannot open the organization message counts', async () => !!(await A.c.rpc('org_staff_counts')).error)
await check('a client cannot move their own card into an organization', async () => gone(await A.c.from('cards').update({ organization_id: '00000000-0000-4000-8000-000000000001' }).eq('id', cardA.id).select('id')))
await check('a client cannot create an organization', async () => gone(await A.c.from('organizations').insert({ name: 'sec test', slug: 'sec-test-' + rand }).select('id')))
await check('a visitor cannot see which organization a card belongs to', async () => { const r = await anon.from('cards').select('organization_id').eq('id', cardA.id); return !!r.error || (r.data ?? []).every((x) => x.organization_id === undefined) })

console.log('\n--- Milestone 22 card templates (these FAIL until migration 018 is run; test client A must NOT belong to an organization) ---')
await check('anyone can read the template of a card', async () => !(await anon.from('cards').select('template').eq('id', cardA.id)).error)
await check('a client can change the template of their own card', async () => {
  const before = await A.c.from('cards').select('template').eq('id', cardA.id).single()
  const r = await A.c.from('cards').update({ template: 'wave' }).eq('id', cardA.id).select('template')
  const ok = !r.error && r.data?.[0]?.template === 'wave'
  await A.c.from('cards').update({ template: before.data?.template ?? null }).eq('id', cardA.id)
  return ok
})
await check('a client cannot save a template name with strange characters', async () => !!(await A.c.from('cards').update({ template: 'Bad Name!' }).eq('id', cardA.id).select('id')).error)
await check('a visitor cannot change a template', async () => gone(await anon.from('cards').update({ template: 'neon' }).eq('id', cardA.id).select('id')))

console.log(`\n${passed} passed, ${failed} FAILED, ${warnings} warning(s).`)
if (failed > 0) {
  console.log('\nA FAILED line means a real person could do something they must not. Do NOT go live. Paste this whole output into the chat for help.')
  process.exit(1)
}
console.log('Everything the checks tried was blocked, and everything that should work did.')
