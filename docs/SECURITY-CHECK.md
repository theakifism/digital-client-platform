# Security check: prove one client can never see another's data

The script `scripts/security-check.mjs` logs in as two TEST clients and tries about 40 things they must NOT be
able to do (read each other's messages, edit each other's cards, make themselves admin, upload into each
other's photo folder, and so on). It also checks what a visitor who is not logged in cannot do.
Run it before the pilot, before going live, and again after any change to the database rules.

## Set up once (about 10 minutes)
1. Admin panel -> New card: create two TEST clients, for example `secdemo-a` and `secdemo-b`, each with its own card
   and a password you choose (type one in; do not leave it empty, so you know it). Use fake names.
2. Send one message through EACH test card on the website ("Send me a message"), so there is something to protect.
3. Send one request through the "Request a card" form, so the admin has something to protect too.
4. Copy `scripts/security.env.example` to a new file called `.env.security` in the project folder
   and fill in the two logins. (Add your admin login too if you like.)

## Run
In the project folder:

    node --env-file=.env.local --env-file=.env.security scripts/security-check.mjs

## Read the result
- `PASS` lines are good. The last line should say 0 FAILED.
- `FAIL` means a real person could do something they must not. Do NOT go live. Paste the whole output into the chat.
- `!!` lines are warnings (for example "no messages to protect"): do the missing set-up step and run again.
- It must be run against test accounts only. If a check ever fails, it may have changed the test data.
- It does not replace a professional security review. It checks the rules we wrote; it cannot find mistakes in rules we forgot to write.
  Before you take real clients' data, it is worth having the database rules reviewed by someone experienced in Supabase.

## After Milestone 14 (message follow-up)
Run migration 011 first. The check then also proves that a client can change only the status and note of their own
messages (never what the visitor wrote, never another client's messages) and that a visitor who is not logged in cannot
change anything. Until 011 is run, these checks are skipped and the output shows a `!!` warning. For the "can change
their own message" check, each test card needs at least one message (set-up step 2 above).
