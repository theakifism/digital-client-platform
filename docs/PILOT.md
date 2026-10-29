# Pilot plan: 5 to 10 friendly clients

## Goal
Find the problems with real people before every client sees them. Success means: clients can log in, finish
their card without help, share it, and nothing leaks or breaks.

## Before you start (all must be done)
- [ ] The security check passes with 0 FAILED, on the live database.
- [ ] The site is deployed, the domain works, and `/api/health` shows ok.
- [ ] Turnstile keys are set. Request and message emails reach a real inbox.
- [ ] The first backup ran and you downloaded the file once. The restore was practised once.
- [ ] The privacy notice (/privacy) was read and approved by your company.
- [ ] One person is named to handle requests and support, with a phone number clients can call.

## Choose the clients
5 to 10 clients you know well and who will tell you the truth. Mix them: a shop, a professional, someone who is
not good with phones. Avoid clients who would be upset by a few bugs.

## Onboarding (for each client)
1. Admin panel -> New card. Create the login. Fill in what you already know so the card is not empty.
2. Send the generated message (it contains the link, username and password).
3. Offer a 10-minute call or visit to watch them log in and edit their card. Do NOT help unless they are stuck.
   Write down where they hesitate; that is where the screens need to be clearer.
4. Ask them to share their card with two real people and to open it on their own phone.

## Daily, for 10 minutes
- Admin Overview: new requests, usage bars.
- Look at each pilot card on a phone.
- Check that emails arrived.
- Write every problem in the table below.

| Date | Client | What happened | How bad (1 to 3) | Fixed? |
|---|---|---|---|---|

## After one week, ask each client
1. What did you try to do first, and was it easy?
2. What confused you?
3. Did anyone contact you through your card?
4. What would you add or remove?
5. Would you use it and show it to others? (yes / maybe / no, and why)

## Go or no-go
GO if: no data leaked, no problem rated 3 is still open, most clients finished their card alone and shared it,
the site had no long outage, and the backup and restore work.
NO-GO if any of those is not true. Fix, then run a second small round.

## If something goes badly wrong
1. Admin panel -> Cards -> switch the affected cards OFF (visitors then see "Card not found").
2. Tell the affected clients plainly what happened.
3. Fix it, run the security check, switch the cards ON.
4. If data was exposed, write down what, to whom and for how long, and speak to your company's management about whether people must be told.
