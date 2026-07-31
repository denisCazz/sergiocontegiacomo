# Sito web Sergio Contegiacomo

Sito istituzionale con **Astro 5** e **TailwindCSS**.

- **Database:** Postgres (VPS)
- **Media:** Cloudflare R2
- **Admin:** unico utente (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

**Dominio produzione**: https://sergiocontegiacomo.it

## Requisiti

- Node.js 22.x
- npm 9+
- Postgres raggiungibile (`DATABASE_URL`)
- Bucket Cloudflare R2

## Installazione

```bash
npm install
```

Copia `.env.example` in `.env` e compila i valori (DB, admin, R2).

## Comandi utili

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Dev server (`http://localhost:4321`) |
| `npm run build` | Build produzione in `dist/` |
| `npm run preview` | Anteprima build |
| `npm run migrate:media` | Migra URL Supabase Storage → R2 |

## Documentazione

- **`PRODUCTION_SETUP.md`** — setup produzione
- **`DEPLOY.md`** — guida deploy
- **`sql/schema.sql`** — schema Postgres

## Licenza

Progetto proprietario, utilizzo riservato al cliente Sergio Contegiacomo.
