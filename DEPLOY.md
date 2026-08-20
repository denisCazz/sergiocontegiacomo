# Guida al Deploy

## Dominio: sergiocontegiacomo.it

## Pre-requisiti

1. Postgres sulla VPS con schema applicato (`sql/schema.sql`)
2. Cloudflare R2 configurato (bucket pubblico o custom domain)
3. Variabili d'ambiente (vedi `.env.example`)
4. Dominio DNS puntato all'hosting

## Variabili d'ambiente

```bash
DATABASE_URL=postgres://user:password@localhost:5432/sergio
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
AUTH_SECRET=long-random-string
PUBLIC_SITE_URL=https://www.sergiocontegiacomo.it
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=sergio-media
R2_PUBLIC_URL=
RESEND_API_KEY=
```

## Database

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

## Build / run (Node adapter)

```bash
npm run build
node ./dist/server/entry.mjs
```

Assicurati che l'app possa raggiungere Postgres (stessa VPS → `localhost` preferibile).

## Verifica

- Homepage, blog, eventi
- Login admin `/admin/login`
- Upload file da admin verso R2
- Commenti e RSVP
