# Sito web Sergio Contegiacomo

Sito istituzionale sviluppato con **Astro 5** e **TailwindCSS**, integrato con un headless CMS (Strapi) per la gestione autonoma di blog ed eventi.

## Requisiti

- Node.js 18+
- npm 9+
- Strapi 5.x (vedi `docs/cms-setup.md` per la configurazione)

## Installazione

```bash
npm install
```

Configura le variabili d'ambiente creando un file `.env` alla radice:

```bash
STRAPI_BASE_URL=https://cms.sergiocontegiacomo.it
STRAPI_API_TOKEN=xxxxxxxxxxxxxxxx
PUBLIC_EVENT_EMAIL=eventi@sergiocontegiacomo.it

# (server-only) integrazione Bitora CRM (lead da contatti/newsletter)
BITORA_CRM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# opzionale (default: https://www.bitora-crm.it/api/leads)
BITORA_CRM_LEADS_ENDPOINT=https://www.bitora-crm.it/api/leads

# (server-only) API esterna contatti (CRM/Supabase) - endpoint /contact
CONTACT_LEADS_ENDPOINT=https://tuo-dominio.tld/contact
CONTACT_LEADS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Se non imposti le variabili, il sito userà i contenuti di fallback definiti in `src/lib/dataFallback.ts`.

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
├─ lib/                 # Configurazioni e integrazione CMS
├─ pages/
│  ├─ blog/             # Lista articoli + pagina dettaglio
│  ├─ eventi/           # Calendario eventi + pagina dettaglio
│  └─ api/              # Endpoint serverless (newsletter, contatti)
└─ styles/              # File Tailwind base
```

Documentazione operativa aggiuntiva:

- `docs/cms-setup.md` — setup tecnico di Strapi.
- `docs/training-guide.md` — guida rapida per la gestione contenuti da parte di Sergio.

## Deploy

1. Eseguire `npm run build`.
2. Pubblicare la cartella `dist/` su hosting statico (Netlify, Vercel, Cloudflare Pages, ecc.).
3. Configurare webhook dal CMS per rigenerare il sito alla pubblicazione di nuovi contenuti.

## Licenza

Progetto proprietario, utilizzo riservato al cliente Sergio Contegiacomo.
