# Checklist Pre-Produzione

## Configurazione

- [ ] Dominio `sergiocontegiacomo.it`
- [ ] `DATABASE_URL` punta al Postgres VPS
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `AUTH_SECRET`
- [ ] `PUBLIC_SITE_URL`
- [ ] `PUBLIC_GA_MEASUREMENT_ID`
- [ ] Credenziali R2 (`R2_*`) + `R2_PUBLIC_URL`

## Database & media

- [ ] Eseguito `sql/schema.sql`
- [ ] Dati importati (se migrazione)
- [ ] Eseguito `npm run check:media` (tutti gli URL su R2)
- [ ] Login admin funzionante
- [ ] Upload immagine/audio/PDF su R2

## Deploy

- [ ] `npm run build` senza errori
- [ ] Processo Node standalone avviato / reverse proxy
- [ ] HTTPS attivo
- [ ] Homepage / sitemap / RSS / admin OK

## Funzionalità

- [ ] Blog, eventi, press, audio, podcast
- [ ] Commenti articoli
- [ ] RSVP eventi
- [ ] Form contatti / newsletter / testimonianze
