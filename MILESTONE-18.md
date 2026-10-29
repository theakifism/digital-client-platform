# Milestone 18: Safe photo uploads with strict size limits (storage stays on Supabase; Cloudflare R2 is optional)

You do not need a card or PayPal for this milestone. Photos STAY in Supabase Storage (1 GB free). What changes:
every upload now goes through OUR server, which checks it. The browser still shrinks the photo first, but the server no longer
trusts the browser: a photo over the size limit, or a file that is not really a photo, is refused.
The code can also store photos in Cloudflare R2 (10 GB free) later. That needs a card or PayPal only to verify the Cloudflare account,
so it is optional: do it only when you have one and your photos start to fill the 1 GB (see "Later: moving to R2" at the end).

## The photo sizes (sharp, but small)
| | Profile photo | Gallery photo |
|---|---|---|
| Shown on the card at | about 112 px wide | phone width (about 400 px), a little wider on a computer |
| Shrunk in the browser to | 480 x 480 px (square crop) | 1200 px on the long side |
| Target file size | about 150 KB | about 300 KB |
| Server refuses over | 250 KB or over 600 px | 450 KB or over 1600 px |
| Typical real size | 60 to 100 KB | 150 to 300 KB |

Why this is enough: a photo only needs about 3 times the pixels it is shown at to look sharp on the best phone screens (336 px for the profile
photo, 1200 px for the gallery). JPEG quality around 80 to 85 looks the same to the eye as the original but is 5 to 10 times smaller.
Anything bigger would use storage and make cards load slower on mobile data without looking better.
## Automatic shrinking (the person does nothing)
The client just presses "Choose photo" and picks any photo from the phone or computer. The website shrinks it by itself, in about a quarter of a second, and says for example
"Photo ready: shrunk from 4.2 MB to 43 KB." How it works (`src/lib/image-shrink.ts`):
- It cuts the profile photo to a square from the middle, or keeps the whole gallery picture, and sets the size to 480 px or 1200 px (never bigger than the original).
- It saves as JPEG at the best quality that fits. If the file is still over the target it lowers the quality a little, then the number of pixels, step by step, until it fits. A very detailed photo may end up a little smaller than 1200 px, never over the hard limit.
- It fixes phone photos that were taken sideways (the camera's rotation note), gives transparent PNGs a white background, and removes camera location data (GPS).
- Any photo type the browser can open works (JPG, PNG, WebP). Files up to 30 MB are accepted. A file that is not a picture, a picture under 100 pixels, or a file over 30 MB gets a friendly message instead.
- iPhone photos in the HEIC format: Safari on the iPhone turns them into JPG by itself when you choose them. On other browsers a HEIC file cannot be opened and the person sees a message to save it as JPG.
Tested in a real Chromium browser on a 4 MB photo, a 12 MB very detailed photo, a 13 MB PNG, a sideways phone photo, a WebP and a transparent PNG: every result came out at 480 x 480 (profile) or up to 1200 px (gallery),
between 3 KB and 300 KB, and every one was accepted by the server's rules. A tiny picture, a text file renamed .jpg and a 31 MB file were refused with a clear message.
Also limited: 8 photos per gallery (as before) and 40 uploads per 10 minutes per login.
Rough capacity of the free 1 GB: about 3,500 gallery photos, or about 10,000 profile photos. For a pilot and the first clients this is plenty.

## Step 1: Apply the files
Unzip into your project and click Merge (replace the changed files when asked). Then:
```powershell
npm install
npm run build
npm run dev
```
`npm install` is needed: one small new package (`aws4fetch`). It is only used if you move to R2 later, but it must be installed for the build.
No new settings are needed. Your `.env.local` already has everything.

## Step 2: Test on your computer
- [ ] Dashboard -> Choose photo: pick a big phone photo (5 MB or more). The message says "Photo ready: shrunk from X MB to NN KB" with NN under 150. Press Save.
- [ ] Take a photo with the phone camera held sideways (landscape) and one upright: both show the right way up on the card.
- [ ] Reload: the photo shows. Open the public card in another tab: the photo shows.
- [ ] Website editor -> Gallery -> add 3 photos including one very large one: each is under about 300 KB, all appear after Save. Remove one and Save: its file disappears from the Supabase Storage bucket `card-photos`.
- [ ] Choose a PDF or a text file renamed to .jpg: the person sees a friendly message and nothing is uploaded.
- [ ] Make a post (post maker): the photo shows in the picture and Download works.
- [ ] Admin -> Overview: "Photos and files (Supabase Storage)" shows a small size. Admin -> Photo storage opens normally.
- [ ] Photo backup by hand: `node --env-file=.env.local scripts/backup-photos.mjs` -> "Photos found: N. Saved: N. Failed: 0."

## Step 3: Deploy, then lock the old way (LAST)
1. Deploy the new code (git push, as usual) and test one upload on the LIVE site.
2. Only then: Supabase -> SQL Editor -> paste `supabase/migrations/014_server_only_photo_uploads.sql` -> Run.
   It stops clients from writing to the Supabase photo bucket by themselves, so the server's size check cannot be bypassed.
   If you run it too early, uploads from the OLD code stop working until the new code is live. Order matters: code first, migration second.
3. Run the security check: the `!!` warning about the photo bucket is gone and a new PASS line appears.

## What changed in the code
- NEW `src/lib/photo-rules.ts` (sizes, file name shapes, JPEG check), `photo-url.ts`, `photo-store.ts`, `photo-admin.ts`, `r2.ts`,
  `src/app/api/upload/route.ts`, `src/app/dashboard/upload-photo.ts`, `scripts/photo-source.mjs`, `scripts/r2-lib.mjs`.
- CHANGED the two photo editors and shrink helpers, the save actions (card and website), `src/lib/blocks.ts`, `next.config.ts` (an R2 address may be allowed for images),
  admin overview and `/admin/storage`, the daily admin e-mail, the photo backup and restore scripts and workflow, `scripts/security-check.mjs`, docs.
- A photo link is accepted only if it starts with the public address of the storage place and has the exact path shape of that client's own card.
- Photos that clients upload and never save stay in storage until the admin cleans them up at `/admin/storage` (photos under a day old are never listed).

## Good to know
- The security rule is the same as before for who sees what; only HOW the file gets in changed (through the server, with checks).
- Supabase Storage has no automatic backups on the free plan. The weekly photo backup (GitHub) keeps the last 30 days. Keep it running.
- The admin e-mail warns you when photo storage passes 80% of the free 1 GB.
- What was tested here: the photo rules with real JPEG files, the backup script against a fake Supabase storage server, and the upload endpoint on a running server
  (no login = 401, too large = 413). I could not test with your real Supabase project, so Step 2 is the first real test.

## Later: moving to Cloudflare R2 (optional, needs a card or PayPal only to verify the account)
Only if the 1 GB bar passes about 80%. R2 gives 10 GB free and no charge for visitors loading photos. Cloudflare asks for a card or PayPal before you can create the first bucket;
it does not charge anything inside the free tier. Steps, when you are ready:
1. Cloudflare account -> R2 -> Create bucket (for example `card-photos`). Note the Account ID.
2. Bucket -> Settings -> Public access: for a pilot enable the "Public Development URL" (a pub-xxxx.r2.dev address; Cloudflare says it is rate limited and for testing only).
   For real use connect a custom domain like `photos.yourcompany.com` (your domain must use Cloudflare's DNS, the free plan is enough).
3. Bucket -> Settings -> CORS policy (so the post maker can draw photos), with your real site address:
```json
[{ "AllowedOrigins": ["https://YOUR-SITE", "http://localhost:3000"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
```
4. R2 -> Manage API tokens: make a token "Object Read & Write" for this bucket only (for the website) and a second token "Object Read only" (for the GitHub backup).
5. Set the five settings `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` (all five or none) in `.env.local` and on Netlify, deploy again.
   GitHub secrets for the backup: `R2_ACCOUNT_ID`, `R2_BUCKET` and the READ-ONLY token as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.
6. New uploads then go to R2 and the admin meter shows the 10 GB bar. Photos already in Supabase are NOT copied; clients upload them again (or ask me for a copy tool).
   If you ever switch back, remove the five settings and deploy again.
