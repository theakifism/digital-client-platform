# Putting the website online (free)

Recommended host: **Netlify, free plan**. Netlify says commercial projects are allowed on its free plan.
Vercel's free plan is NOT allowed for business use, so do not use it. Netlify's free plan has monthly limits: if
you go over, the site is switched off for the rest of that calendar month, so keep an eye on usage (step 9).
Hosting terms change, so read the current terms on netlify.com/pricing before you launch.

## 1. Before you start
- Everything works on your computer (`npm run dev`), and `npm run build` finishes without errors.
  Run `npm run build` now. If it prints an error, paste it into the chat and we fix it before deploying.
- You have bought the domain (or will use the free Netlify address for the pilot).

## 2. Put the code on GitHub (private)
Easiest way, no commands: install **GitHub Desktop**, then File -> Add local repository -> choose the project folder ->
Publish repository -> TICK "Keep this code private".
Check on github.com that `.env.local` is NOT in the repository (it must not be: it is listed in `.gitignore`).

## 3. Create the Netlify site
1. netlify.com -> sign up with your GitHub account (use the company one).
2. Add new project -> Import an existing project -> GitHub -> choose the repository.
3. Netlify detects Next.js by itself. Leave the build settings as they are.
4. Before pressing Deploy, open "Environment variables" and add the ones below.

## 4. Environment variables (copy the values from your `.env.local` and the notes in the milestone files)
| Name | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon / publishable key (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret server key. Mark it as a SECRET value. |
| `NEXT_PUBLIC_SITE_URL` | the final website address, e.g. `https://cards.yourcompany.com` (no slash). QR codes and links use it. |
| `NEXT_PUBLIC_SAMPLE_CARD` | `demo-card` (or a real sample card's link) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | optional, shown on the privacy page |
| `RESEND_API_KEY`, `RESEND_FROM`, `REQUEST_NOTIFY_EMAIL` | optional, request and message emails, and the admin alert e-mails |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | OPTIONAL (Milestone 18). Only if you move the photos to Cloudflare R2. Leave all five out to keep photos in Supabase Storage. The two keys are SECRET values. |
| `CRON_SECRET` | optional, 24+ random characters. Switches on the daily admin e-mail check. Same value as the GitHub secret `CRON_SECRET`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | spam check. Set BOTH before going live: since Milestone 19 a live site without the secret key blocks every form (Admin -> Overview -> Setup check tells you). |
| `TURNSTILE_DISABLED` | optional. `true` = run the live site without the spam check on purpose (not recommended). |
| `CLIENT_IP_HEADER` | optional. Which header holds the visitor's address, for the rate limits. Default fits Netlify. On Cloudflare Pages use `cf-connecting-ip`. |
| `LEAD_EMAIL_DAILY_CAP` | optional. Most "you got a message" e-mails per day for all cards together (default 80). |
| `NEXT_PUBLIC_BRAND_NAME` | optional. The company name (default Orion Teleservices). Use it to switch the spelling without editing code. |
| `NEXT_PUBLIC_INDEX_CARDS` | no longer used (Milestone 12). Each client now chooses in their dashboard whether search engines may list their card. Cards start hidden. |

Important:
- Names starting with `NEXT_PUBLIC_` are copied into the website while it is built. If you change one, deploy again.
- Do NOT mark the `NEXT_PUBLIC_` ones as secret. If Netlify's secret scanner stops a build because it finds one of
  these public values in the website files, tell me the message; there is a setting to tell it to ignore those names.
- The first time, you may not know the final address yet. Use the temporary `something.netlify.app` address for
  `NEXT_PUBLIC_SITE_URL`, deploy, then change it to the real domain later and deploy again.

## 5. Deploy and test
Press Deploy. When it finishes, open the address and go through the test checklists of milestones 2 to 6 on the live site
(login, card page, Save to contacts, message form, dashboard edits, small website, admin panel).
Also open `/api/health`: it should show `"ok":true`.

## 6. Your own domain
Netlify -> Domain management -> Add a domain -> follow the instructions to change the DNS records at the place you bought
the domain. HTTPS is set up automatically. Then set `NEXT_PUBLIC_SITE_URL` to the new address and deploy again.

## 7. Tell Supabase and Turnstile about the new address
- Supabase -> Authentication -> URL Configuration -> Site URL = your website address.
- Cloudflare Turnstile -> your widget -> add the domain to the allowed hostnames.
- Resend (if used): verify your domain so emails can go to anyone, and use an address on that domain in `RESEND_FROM`.

## 8. GitHub jobs
Add the three secrets and run the two jobs once (see BACKUP-AND-RESTORE.md).

## 9. After launch: watch the limits
- Netlify -> Usage: look at it weekly during the pilot. The free plan warns you as you approach the limits.
- Supabase -> Reports, plus the usage bars in your admin Overview (photos, database).
- Plan to move to paid plans (Netlify Pro, Supabase Pro at about $25 a month) BEFORE you pass 80% of any limit, and before
  a card has to be reliable for many people.

## If a deploy breaks the site
Netlify -> Deploys -> pick the last good deploy -> "Publish deploy". The old version is back in seconds.
