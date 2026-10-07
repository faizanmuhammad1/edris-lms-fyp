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

## Environments

| | Development | Preview / staging | Production |
| --- | --- | --- | --- |
| Database | Separate Neon branch recommended (dev currently shares prod) | Neon branch | Neon main |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | the preview URL | `https://www.edrislms.com` |
| Stripe | test keys | test keys | live keys + live webhook |
| Mux / Resend / OpenAI / Tigris | dev credentials or prod with care | same as dev | production credentials |
| Polygon | Amoy testnet | Amoy testnet | Amoy (or mainnet with a new contract) |

Only `NEXT_PUBLIC_*` variables reach the browser; never prefix a secret with it. `lib/env.ts`
validates every variable at startup, so a missing one fails fast with a clear error.

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

## Lesson transcription

Lesson videos are transcribed in-app with OpenAI Whisper (`whisper-1`, ~$0.006/min) when a
video is added or replaced, and teachers can retry per lesson or run "Transcribe Course".
The transcript's timestamped segments feed the AI tutor, and a summary is regenerated afterwards.
Limits: MP4/WebM (or common audio formats) up to 25 MB per video; larger files are marked
Failed with an explanation. Transcription runs within the page's 60-second function limit.

## Maintenance endpoints

- `GET /api/backfill-summaries` (admin only): generates missing AI lesson summaries, 5 per call.
