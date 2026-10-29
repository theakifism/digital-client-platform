# Milestone 11: Content-Security-Policy

A Content-Security-Policy (CSP) is a rule the browser follows: "this site may only load things from these places".
If an attacker ever managed to inject a script or a picture from their own server into a page, the browser refuses it.
No database change. Nothing changes for clients when the policy is in report-only mode.

## What the policy allows
- The site itself.
- Your Supabase address (client photos and the login/data connection).
- Cloudflare Turnstile (the optional spam check on the forms).
- Nothing else: no outside scripts, no plugins, no other site may frame your pages, forms can only post to your own site.
Honest limit: scripts and styles still allow "inline" code, because Next.js needs it to start a page. So this policy stops
loading things from other sites and sending data to other sites, but it is not a complete shield against every kind of injected code.

## What is new
- CHANGED `next.config.ts`: adds the header. It is sent only by a production build, never by `npm run dev`.
- NEW `scripts/csp-check.mjs`: checks that the header is sent on the main pages of a running site.
- CHANGED `PROJECT-HANDOFF.md`.

## Step 1: Apply and build
Unzip into your project and click Merge (replace `next.config.ts` and `PROJECT-HANDOFF.md`).
```powershell
npm run build
npm run start
```
(`npm run start` runs the real build on http://localhost:3000. `npm run dev` does not send the policy, so it cannot be used for this test.)

## Step 2: Check the header (30 seconds)
In a second PowerShell window:
```powershell
node scripts/csp-check.mjs
```
Every line should say PASS and the mode should say REPORT ONLY.

## Step 3: Test in the browser (REPORT ONLY, it blocks nothing)
Open Chrome, press F12, open the Console tab, and visit each page below. A problem shows as a message that starts with
`[Report Only] Refused to ...`. Visit:
- [ ] Home page `/`, the request form `/contact` (if Turnstile keys are set, the check box must appear)
- [ ] A card page with a photo and QR code, then "Our website" with a photo gallery
- [ ] Login, then your dashboard: upload a photo, save, open "Make a post" and press Download picture
- [ ] Admin: Overview, Cards, Photo storage
No `Refused` messages = the policy fits your site. If you see one, copy the whole message and send it to me.

## Step 4: Turn blocking on (only after Step 3 is clean, ideally after a few days on the live site)
The setting is read when the site is BUILT:
- On the host (Netlify): add the variable `CSP_ENFORCE` = `true`, then deploy again.
- On your computer to test: `$env:CSP_ENFORCE="true"; npm run build; npm run start`, then repeat Steps 2 and 3. The mode now says ENFORCING, and
  the console messages no longer say "[Report Only]".
To go back: remove the variable and deploy again.

## Good to know
- If you ever add a new outside service (analytics, a map, a font, a chat widget), its address must be added to the list in `next.config.ts`,
  or the browser will block it once enforcing. Ask me and I will do it.
- If you change the Supabase project, build again so the new address is put into the policy.
