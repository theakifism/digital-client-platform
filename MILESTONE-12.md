# Milestone 12: Each client chooses whether search engines may list their card

Before: every card was hidden from Google (one switch for the whole site, or all cards visible).
Now: every card starts hidden, and each client can switch on "Let search engines list my card and website" in their dashboard.
Their card and small website then say "you may list me" to Google and others. The sitemap lists only those cards.
Search engines decide on their own whether and when to list a page. It can take weeks, and nobody can promise it.

## What is new
- NEW `supabase/migrations/009_search_index_choice.sql`: one new yes/no column on cards, starting as NO.
- NEW `src/app/dashboard/search-choice.tsx`, `search-actions.ts`, `search-state.ts`: the "Search engines" box on the client dashboard.
- NEW `src/app/sitemap.ts`: the list of opted-in cards for search engines.
- CHANGED `src/lib/card.ts`, `src/app/[slug]/page.tsx`, `src/app/[slug]/site/page.tsx` (each page says index or noindex by the choice),
  `src/app/dashboard/page.tsx` (shows the box), `src/app/robots.ts`, `next.config.ts` (the old all-or-nothing switch is gone),
  `docs/DEPLOY.md`, `PROJECT-HANDOFF.md`.

## Step 1: Database (do this FIRST)
Supabase -> SQL Editor -> New query -> paste the whole of `supabase/migrations/009_search_index_choice.sql` -> Run. "Success" is the answer.
If you forget this step the site still works and every card simply stays hidden, but the new box is not shown.

## Step 2: Apply the files
Unzip into your project and click Merge. Replace the changed files when asked. Then:
```powershell
npm run build
npm run dev
```

## Step 3: Test checklist
- [ ] Log in as a test client. On the dashboard, below your card editor, you see the "Search engines" box, unticked.
- [ ] Tick it and press Save. You see "Saved. Search engines may now list your card..." Reload the page: the box is still ticked.
- [ ] Open your card in the browser, then right-click -> View page source and search (Ctrl+F) for `robots`. You see `index, follow`.
- [ ] Untick, Save, view the source again: `noindex, nofollow`.
- [ ] Open http://localhost:3000/sitemap.xml. With the box ticked your card address is in the list. With it unticked, it is not.
- [ ] A different test client's card (never ticked) says `noindex, nofollow`.
- [ ] Open http://localhost:3000/robots.txt. The last line points to the sitemap.
- [ ] The "Save to contacts" file address (`/your-card/vcard`) is never listed (the site sends a noindex header for it).

## Good to know
- Switching it on makes the name, business, photo, phone number and email on the card findable by anyone. The box says so in plain words.
  Make sure each client understands before they tick it.
- Switching a card OFF in the admin panel (the on/off switch) still hides it completely, whatever the search choice says.
- Set the real address in `NEXT_PUBLIC_SITE_URL` before going live, or the sitemap will list localhost addresses.
- The home page, request form and privacy page can be listed by search engines (they are your company's own pages).
- `NEXT_PUBLIC_INDEX_CARDS` is no longer used. You can remove it from the host's settings.
