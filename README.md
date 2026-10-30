# The Saint's TechNet

The store behind **[buyfromsaint.com](https://www.buyfromsaint.com)**: custom PC builds, laptops and tech accessories, sold to customers in Nigeria and beyond.

*The Saint's Technology Networks · CAC BN 9245886 · Lagos, Nigeria*

## What's inside

- **Storefront** – product catalogue managed in Sanity, search and filters, wishlist, cart, ₦ / $ pricing.
- **AI shopping help** – "Ask AI", Build My Setup, and AI-assisted price negotiation.
- **Quotations** – customers request a quote and receive it by email.
- **Payments** – Paystack (cards and transfers) and NOWPayments (crypto), confirmed by signed webhooks.
- **Admin** (`/admin`, protected by a 6-digit PIN) – dashboard, inventory, orders, negotiations, and **receipt issuance** for walk-in customers.
- **Notifications** – email (Resend), SMS (Termii) and web push alerts for the owner.

## Stack

Next.js 16 (App Router, React 19) · TypeScript · Tailwind CSS 4 · shadcn/ui · Sanity (content and data) · Clerk (customer accounts) · Resend · Vercel (hosting, cron) · Biome (lint and format) · pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`, `pnpm typegen`.

### Environment variables

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | Sanity project and dataset |
| `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN` | Server-side reads and writes (never expose these to the browser) |
| `SANITY_REVALIDATE_SECRET` | Signs Sanity's on-demand revalidation webhook |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Customer sign-in |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (defaults to https://www.buyfromsaint.com) |
| `PAYSTACK_SECRET_KEY` | Paystack payments and webhook verification |
| `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` | Crypto payments |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email (the sender domain must be verified in Resend) |
| `TERMII_API_KEY`, `TERMII_SENDER_ID` | SMS |
| `ANTHROPIC_API_KEY` | AI features that call Anthropic directly |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web push |
| `OWNER_EMAIL` | Where owner alerts are sent |
| `CRON_SECRET` | Authorises Vercel cron calls and internal server-to-server calls (such as push) |
| `ADMIN_PIN_HASH` | bcrypt hash of the admin PIN (see below) |
| `ADMIN_SESSION_SECRET` | *Optional.* Signs the admin session cookie. Falls back to `ADMIN_PIN_HASH` |
| `RECEIPT_BUSINESS_ADDRESS`, `RECEIPT_BUSINESS_TIN` | *Optional.* Printed on receipts |
| `RECEIPT_FROM_EMAIL`, `RECEIPT_REPLY_TO`, `RECEIPT_BCC_EMAIL` | *Optional.* Receipt email sender, reply-to, and a private copy to you |
| `NEXT_PUBLIC_META_PIXEL_ID`, `META_CONVERSIONS_API_ACCESS_TOKEN`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Analytics and address lookup |

## Admin and the PIN

`/admin` asks for a 6-digit PIN. The server checks it against `ADMIN_PIN_HASH` and, if correct, sets a signed, `httpOnly` session cookie that lasts 8 hours. **Every admin API route and every server-rendered admin page checks that cookie**, so the data behind the screens is protected, not just the screens.

Create the hash once and put it in your environment (never store the PIN itself):

```bash
node -e "require('bcryptjs').hash('123456', 12).then(console.log)"
```

In a local `.env.local` file, escape every `$` in the hash as `\$` (otherwise the file loader mangles it); in Vercel's Environment Variables screen paste it as-is. Changing the PIN changes the hash, which signs everyone out. Repeated wrong guesses are limited across the whole site (10 per 15 minutes), so the gate pauses rather than letting someone keep guessing.

## Receipt issuance (`/admin/receipt_issuance`)

Issue a numbered PDF receipt for a walk-in sale.

- **Numbering**: `STN-2026-0001`, restarting each year (Lagos time). Numbers are allocated atomically, so two receipts can never share one.
- **Contents**: customer, items (with serial or IMEI, condition and warranty), discount, payment method and reference, part payments with balance due, amount in words, signature lines.
- **Delivery**: download, open, share through the phone's share sheet (WhatsApp etc.), or email the PDF straight from the page. Every email attempt is logged on the receipt.
- **Tracking**: the History tab searches by number, name, phone or email, filters paid / part payment / void / not emailed, and shows who was emailed and when.
- **Never edited, never deleted**: a mistake is *voided* (it stays in the history and later copies are stamped VOID), then a corrected receipt is issued.
- **Storage**: receipts are Sanity documents with ids like `receipts.STN-2026-0001`. An id containing a dot is private, so receipts are not readable without a token even if the dataset is public.

The PDF is drawn in `lib/receipts/pdf.ts` with Plus Jakarta Sans (fonts in `lib/receipts/assets/fonts`, SIL Open Font License). Business details live in `lib/receipts/config.ts`.

## Deployment

Deployed on Vercel from `main`. `vercel.json` schedules the daily birthday-greeting cron, which authenticates with `CRON_SECRET`. Point the Paystack, NOWPayments and Sanity webhooks at the matching `/api/webhooks/*` and `/api/revalidate` routes.

## Credits

Started from the open-source `ai-ecommerce-sanity-clerk` tutorial project by Sonny Sangha and the PAPAFAM community. See `LICENSE.md`.
