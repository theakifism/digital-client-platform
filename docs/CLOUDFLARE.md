# Hosting the site on Cloudflare (free plan)

This replaces Vercel (and the Netlify steps in DEPLOY.md). The database, photos, email and GitHub jobs do not change.

## The one honest warning
The free Cloudflare plan gives each page request only 10 milliseconds of computer work (waiting for Supabase does not count) and 100,000 requests a day. Cloudflare says pages with login or server rendering often need 10 to 20 ms. So on the free plan some pages may sometimes fail with "Error 1102 / exceeded CPU". If that happens, the fix is the Workers Paid plan: $5 a month, no code change. Static files (pictures, scripts) are free and unlimited. Try free first and watch.

## 1. On your PC (PowerShell, inside the project folder)
Do NOT build or deploy from the Windows PC: the adapter is not fully supported on Windows. Cloudflare builds it on its own Linux servers.
```
npm install --save-exact next@15.5.28 eslint-config-next@15.5.28
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
npm run typecheck
npm run build
```
(Next.js moves up by one small version because the adapter needs 15.5.28 or newer.)

Open `package.json` and add these three lines inside "scripts" (keep the commas right):
```
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```
Open `.gitignore` and add these three lines at the end:
```
.open-next
.wrangler
.dev.vars
```
Then commit and push to your GitHub repository.

## 2. Connect Cloudflare to GitHub (once)
1. Sign up at cloudflare.com with the company email and turn on two-step verification.
2. Dashboard > Workers & Pages > Create application > Import a repository (GitHub) > choose this repository.
3. Project name: `orian-cards` (it must match "name" in wrangler.jsonc).
4. Build command: `npx opennextjs-cloudflare build`
5. Deploy command: `npx opennextjs-cloudflare deploy`
6. Open "Build variables and secrets" and add the PUBLIC values (they are baked into the site while it is built):
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL (see step 4),
   NEXT_PUBLIC_TURNSTILE_SITE_KEY, NEXT_PUBLIC_SAMPLE_CARD, NEXT_PUBLIC_CONTACT_EMAIL,
   NEXT_PUBLIC_AUTH_EMAIL_DOMAIN and NEXT_PUBLIC_BRAND_NAME (only if you use them),
   R2_PUBLIC_URL and CSP_ENFORCE (the security rules in next.config.ts are worked out at build time).
   If the first build stops with a "missing" message, add the value it names here too.
7. Save and Deploy.

## 3. Private settings (the Worker's "Secrets")
After the first deploy: Workers & Pages > orian-cards > Settings > Variables and Secrets > Add. Choose type **Secret** for each (secrets survive new deploys):
SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET (24+ characters), TURNSTILE_SECRET_KEY, RESEND_API_KEY, RESEND_FROM, REQUEST_NOTIFY_EMAIL,
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL, and LEAD_EMAIL_DAILY_CAP if you use it.
Do not set TURNSTILE_DISABLED.
`CLIENT_IP_HEADER` is already set in wrangler.jsonc (it makes the rate limits use Cloudflare's trusted visitor address).

## 4. Your live address
The first deploy gives you `https://orian-cards.<your-name>.workers.dev` (Cloudflare asks you to pick the `<your-name>` part).
Put exactly that into the build variable NEXT_PUBLIC_SITE_URL, then run the build again (Deployments > Retry, or push any small change). QR codes and links use this value.
This free address is fine for a pilot, but every card link and QR code contains it. Decide the final address BEFORE you share cards widely. A custom domain is added later under the Worker's Settings > Domains and Routes, and then NEXT_PUBLIC_SITE_URL is changed and the site rebuilt.

## 5. Update these places with the new address
- GitHub > Settings > Secrets > SITE_URL (the keep-alive, digest and backup jobs use it).
- Cloudflare Turnstile: add the new hostname to your widget, or every form stays blocked.
- Supabase > Authentication > URL Configuration: Site URL.

## 6. Test checklist
- [ ] The build in Cloudflare finishes green.
- [ ] The home page, /contact and /privacy open.
- [ ] /login works: log in as admin, you land on /admin.
- [ ] A client login lands on /dashboard; editing the card and saving works.
- [ ] Upload a profile photo: it shows on the card.
- [ ] The public card /<slug> opens, Save to contacts downloads, the QR code shows the new address.
- [ ] Send a message from the card's form (Turnstile passes) and see it in the client's dashboard.
- [ ] Switch a card off in /admin: its public link shows "not available" within seconds.
- [ ] GitHub: run "Keep alive" once; it must be green.
- [ ] Cloudflare > the Worker > Observability: no red CPU-limit errors after a few minutes of clicking around.

## 7. Turn Vercel off
Only after the checklist passes: Vercel dashboard > the project > Settings > Delete Project. Also remove the Vercel app from GitHub (GitHub > Settings > Applications). You can delete the local `.vercel` folder.

## If something goes wrong
- Build fails: copy the red error text from Cloudflare's build log and send it.
- Error 1102 or "exceeded CPU": see the warning at the top (Workers Paid, $5 a month).
- Everything else keeps working: Supabase, photos, emails and backups do not depend on where the site is hosted.
