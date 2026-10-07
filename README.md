# Edris LMS

Learning management system built with Next.js 15 (App Router), Prisma + Neon Postgres,
better-auth (Google + email OTP), Stripe, Mux/Tigris video, OpenAI (tutor, summaries,
quiz generation, assignment grading) and blockchain-anchored certificates on Polygon Amoy.

## Local setup

```bash
pnpm install          # also runs `prisma generate`
cp .env.example .env  # fill in the values
pnpm dev
```

Useful checks:

```bash
npx tsc --noEmit      # type check
pnpm lint
pnpm build
npx prisma migrate status
```

## Database migrations

Migrations live in `prisma/migrations` and fully reproduce the schema on an empty database:

```bash
npx prisma migrate deploy
```

`20260324070000_catch_up_db_push_tables` captures tables that were originally created with
`prisma db push`. A database that already has those tables must mark it as applied once,
before running `migrate deploy`:

```bash
npx prisma migrate resolve --applied 20260324070000_catch_up_db_push_tables
```

Always create schema changes with `prisma migrate dev` (never `db push`) so migrations stay complete.

## Deploying (Vercel)

1. Set every variable from `.env.example` in the project settings. For production use one
   canonical origin (e.g. `https://www.edrislms.com`) for `BETTER_AUTH_URL` and
   `NEXT_PUBLIC_APP_URL`, and redirect the other host (apex ↔ www) to it.
2. Build command: `prisma migrate deploy && next build` (or run `migrate deploy` as a
   separate release step).
3. Google OAuth: add `https://YOUR_DOMAIN/api/auth/callback/google` as an authorized redirect URI.
4. Stripe: create a webhook endpoint `https://YOUR_DOMAIN/api/webhook/stripe` for
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and set
   `STRIPE_WEBHOOK_SECRET` from it. Use live keys for production.
5. Mux: webhook endpoint `https://YOUR_DOMAIN/api/webhooks/mux` → `MUX_WEBHOOK_SECRET`.
6. Resend: `EMAIL_FROM` must be on a verified domain; otherwise OTP login emails fail.
7. Blockchain: keep the issuer wallet (`BLOCKCHAIN_PRIVATE_KEY`) funded with POL for gas.

## Maintenance endpoints

- `GET /api/backfill-summaries` (admin only): generates missing AI lesson summaries, 5 per call.
