# Sito web Sergio Contegiacomo

Sito istituzionale sviluppato con **Astro 5** e **TailwindCSS**, integrato con **Supabase** per database, autenticazione e storage.

**Dominio produzione**: https://sergiocontegiacomo.it

## Requisiti

- Node.js 22.x
- npm 9+
- Account Supabase (per database, autenticazione e storage)

## Installazione

```bash
npm install
```

Configura le variabili d'ambiente creando un file `.env` alla radice (vedi `.env.example`):

```bash
# URL del sito
PUBLIC_SITE_URL=https://sergiocontegiacomo.it

# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Analytics (opzionale)
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> Per la configurazione completa, vedi il file `.env.example` e `DEPLOY.md`.

## Comandi utili

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Avvia il dev server (`http://localhost:4321`) |
| `npm run build` | Effettua la build di produzione nella cartella `dist/` |
| `npm run preview` | Esegue l'anteprima della build |
| `npm run astro check` | Lancia i controlli di tipo ed eventuali warning |

## Struttura di progetto

```
src/
├─ components/          # UI atomiche e sezioni riutilizzabili
├─ layouts/             # Layout principali
├─ lib/                 # Configurazioni e integrazione Supabase
├─ pages/
│  ├─ admin/           # Pannello amministrazione
│  ├─ blog/            # Lista articoli + pagina dettaglio
│  ├─ eventi/          # Calendario eventi + pagina dettaglio
│  └─ api/             # Endpoint serverless (newsletter, contatti, upload)
└─ styles/              # File Tailwind base
```

## Documentazione

- **`DEPLOY.md`** — Guida completa al deploy in produzione
- **`PRODUCTION_CHECKLIST.md`** — Checklist pre-produzione
- **`supabase/`** — Script SQL per configurazione database

## Deploy

Il progetto è configurato per **Vercel** con SSR (Server-Side Rendering).

1. **Configura le variabili d'ambiente** in Vercel (vedi `.env.example`)
2. **Connetti il repository** a Vercel
3. **Aggiungi il dominio** `sergiocontegiacomo.it` in Vercel
4. **Deploy automatico** ad ogni push su main

Per dettagli completi, consulta **`DEPLOY.md`**.

## Licenza

Progetto proprietario, utilizzo riservato al cliente Sergio Contegiacomo.
