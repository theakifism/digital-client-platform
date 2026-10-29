# Milestone 8: Social media post maker

Clients can make a ready-to-share picture (festival wishes, offers, announcements) with their own business name,
phone number and photo. There is no database change and no new key, so nothing to do in Supabase.

## What is new
- `src/lib/post-templates.ts`: 47 original templates (23 festivals, 14 offers, 10 general), 8 colour sets, 5 layouts.
- `src/lib/post-render.ts`: draws the picture on a canvas in the browser (square 1080x1080 and tall 1080x1920).
- `src/app/dashboard/posts/page.tsx`, `post-maker.tsx`, `posts.css`: the page at `/dashboard/posts`.
- `src/app/dashboard/page.tsx` (CHANGED): a "Social media posts" box with a "Make a post" button.
- `PROJECT-HANDOFF.md` (CHANGED): status updated.

## Step 1: Apply the files
Stop the server. Unzip into your project and click Merge. REPLACE these when asked:
`src/app/dashboard/page.tsx` and `PROJECT-HANDOFF.md`. Everything else is new.
Then run `npm run build` (it must finish without errors) and `npm run dev`.


## Step 2: Test checklist
- [ ] Log in as a test client. The dashboard shows "Social media posts" with a "Make a post" button.
- [ ] The post page opens. Business name, phone and photo are already filled in from the card.
- [ ] Click each tab (Festivals, Offers, General) and a few designs. The preview changes each time.
- [ ] Change the heading, message, offer, name and phone. The preview follows. A very long text shrinks to fit.  
- [ ] Choose "Tall (story or status)". The preview becomes tall.
- [ ] Untick "Show my photo". The photo disappears from the picture.
- [ ] Click "Download picture". A PNG file is saved. Open it: it is sharp and the words are correct.
- [ ] On a phone: "Share" appears, and WhatsApp can receive the picture.
- [ ] Type some Hindi (or another language) in the heading. Check it shows correctly in the picture.
- [ ] Log out and open /dashboard/posts: you are sent to the login page.

## Good to know
- Fonts: the picture uses fonts already on the person's device (Segoe UI on Windows, the system font on phones).
  It may look slightly different on different devices, but always readable.
- Festival dates are not built in. The client chooses the design when they need it.
- Offer designs start with sample offer text such as "FLAT 20% OFF". Tell clients to put their REAL offer in
  the big offer box before sharing.
- If a photo cannot be loaded into the picture (rare), the post is made without it and a message says so.
- To add a template: add one `t(...)` line at the bottom of the list in `src/lib/post-templates.ts`.
