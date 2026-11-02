# Milestone 22: Card templates (nine different layouts)

The public card now has NINE templates. Each one arranges the same card data in its own way, so they look completely different from each other.
The colour theme (Light, Dark, Teal, Orian blue) still chooses the colours; the template chooses the layout and style. So a card has 9 designs x 4 colour themes.
Existing cards do not change: an empty template means Classic, the look every card has today.
ONE database change (`018_card_templates.sql`). No new packages.
**Needs Milestone 21 (migration 017) first.** The reference pictures you sent were used for LAYOUT IDEAS only (nothing copied: no photos, logos or artwork).

## The nine templates
| Template | Look (inspired by your references) |
|---|---|
| Classic | The original centered card. Unchanged. |
| Wave | Big photo, curved edge with a round badge, contact rows with coloured round icons |
| Overlap | Photo with a curved bottom; a name panel floats over it; About section; contact rows |
| Band | Wide photo band with a colour line, round badge, clean left-aligned text |
| Midnight | Dark full-height photo fading into deep colour, glass round icons, About panel, floating "Add to contact" bar |
| Neon | Black, grayscale photo, big capital name with a bright highlight colour, bright About block |
| Deep Wave | Grayscale photo, big colour wave with a stroke, round badge, bright round icons, white cards, floating bar |
| Paper | Torn-paper edge, round photo overlapping it, rounded soft cards, floating bar |
| Formal | Flat and still: small square photo, a plain details list, outlined buttons, no effects |
Motion (not in Formal or Classic): the name rises in, the photo drifts deeper as you scroll, and blocks rise into place (browsers that support scroll-driven animation; others just show the page). Everything stops for people who set "reduce motion" on their device.

## Who chooses the design (as decided)
- **Individual cards** (no organization): the owner chooses the design and colours in the dashboard (Card look). Orian's admin can change it too (Admin -> Cards -> Edit).
- **Organization cards:** only the organization administrator chooses (Org panel -> Staff cards -> Design, or when adding a staff card) and Orian's admin. Staff see "The design and colours of your card are chosen by your organization".
  The DATABASE enforces this (a trigger), not only the screen: staff cannot change it even by calling the database directly.

## Files
New: `supabase/migrations/018_card_templates.sql`, `src/lib/card-templates.ts` (the list), `src/app/[slug]/templates.tsx` (the nine layouts), `src/app/[slug]/card-parts.tsx` (shared pieces, icons), `src/app/[slug]/templates.css` (their styles), `MILESTONE-22.md`
Changed: `src/app/[slug]/page.tsx`, `src/lib/card.ts`, `src/lib/provision.ts`, `src/app/dashboard/{page.tsx,card-editor.tsx,validate.ts,actions.ts,dashboard.css}`, `src/app/admin/cards/[id]/{page.tsx,admin-card-form.tsx}`, `src/app/org/{actions.ts,staff/page.tsx,staff/new/new-staff-form.tsx}`, `scripts/security-check.mjs`, `PROJECT-HANDOFF.md`
To add a template later: add it to `card-templates.ts`, add a component in `templates.tsx`, add CSS in `templates.css`. No migration.

## Order (important)
1. Migration 017 already run.
2. Run `018_card_templates.sql` in Supabase -> SQL Editor BEFORE deploying the new code. It must say Success.
3. Copy the files in, `npm run build` on your PC (it must pass), push to GitHub so Cloudflare builds it.
4. Run the security check.
If you deploy the code first: public cards still open (they fall back to Classic), but the dashboard card editor, the admin card edit page and the organization staff list cannot read the new column until the migration is run.

## Test list (I have NOT seen these rendered: please look at every one on a real phone)
1. As an individual client: Dashboard -> Card look. Pick Wave, Save, open your card. Repeat for each of the nine templates and for each of the four colour themes. Tell me which combinations look wrong (text hard to read, photo badly cropped, buttons overlapping).
2. Test each template with: no photo, a long name, a long bio, no phone/email/etc. (a nearly empty card), and with every contact filled in.
3. Tap Call, WhatsApp, Email, Directions, Website, Save to contacts, "Our website", a social link; send a test message with the form; check the QR code and Share. Then check Dashboard -> Activity: the taps and views are still counted.
4. Scroll each dark template (Midnight, Neon, Deep Wave) to the bottom: the floating "Add to contact" bar must stay visible and the message form must be readable.
5. Organization: Org panel -> Add staff card (choose a design), then Staff cards -> change that card's design and colours -> open the card. Log in as that staff member: Card look shows only the "chosen by your organization" note, and saving the card does not change the design.
6. Try to cheat: as a staff member, edit the form in the browser to send `template=neon` and save. The design must NOT change.
7. Orian admin: Admin -> Cards -> Edit a card -> change Design -> Save -> open the card.
8. Open an old card made before this milestone: it must look exactly like before (Classic).
9. `node scripts/security-check.mjs`: the new Milestone 22 lines pass.

## Known limits
- Round badges show the company's (or name's) initials. A real logo needs the organization brand settings (not built yet).
- Profile photos are saved at 480 x 480 pixels (photo rules), so the big photos at the top of Wave, Midnight, Neon and Deep Wave can look slightly soft on very sharp phones, and a square photo is cropped to a tall shape (the face should be near the top-centre). If this matters we raise the saved photo size in a later milestone (more storage used).
- The small website (`/[slug]/site`) still uses the old look. Redesigning it is a separate step.
- There is no per-organization default design yet: the organization administrator picks it card by card.
- Template previews in the picker are text descriptions, not pictures yet.
- Not yet tested against a real database or a real build. Only syntax was checked here; the colour contrast of each theme in each template has not been measured.
