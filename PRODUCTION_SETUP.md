# Setup Produzione - sergiocontegiacomo.it

## Stack

- **Database:** Postgres sulla VPS (`DATABASE_URL`)
- **Storage media:** Cloudflare R2
- **Auth admin:** unico utente via `ADMIN_EMAIL` / `ADMIN_PASSWORD` + cookie firmato (`AUTH_SECRET`)
- **Runtime:** Astro SSR (`@astrojs/node`)

## Variabili d'ambiente

Vedi [`.env.example`](.env.example). Minimo richiesto:

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
```

## Database (VPS)

1. Crea il database Postgres
2. Esegui lo schema: `psql "$DATABASE_URL" -f sql/schema.sql`
3. Verifica gli URL media: `npm run check:media`

## Deploy

1. Build: `npm run build`
2. Output: `dist/` (adapter Node standalone)
3. Assicurati che l'app raggiunga Postgres (idealmente stessa VPS → localhost)
4. Configura R2 bucket pubblico / custom domain per `R2_PUBLIC_URL`

## Verifica post-deploy

- [ ] Homepage
- [ ] Sitemap / RSS
- [ ] Admin login `/admin/login`
- [ ] Upload immagine/audio/PDF da admin
- [ ] Commenti blog e RSVP eventi

## Sicurezza

- Cookie admin httpOnly + HMAC (`AUTH_SECRET`)
- Credenziali R2 solo server-side
- Nessuna key storage pubblica nel browser
