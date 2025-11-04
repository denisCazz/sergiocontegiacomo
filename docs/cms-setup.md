# Configurazione CMS (Strapi 5.x)

Questa guida descrive come predisporre Strapi come headless CMS per gestire articoli del blog ed eventi.

## 1. Creazione progetto Strapi

1. Installare Strapi localmente oppure su un hosting gestito (ad esempio Render, DigitalOcean, Heroku, Railway).
2. Avviare la creazione di un nuovo progetto:
   ```bash
   npx create-strapi-app@latest sergio-cms --quickstart
   ```
3. Accedere al pannello admin (`http://localhost:1337/admin`) e creare l'utente amministratore principale.

## 2. Content type `Articolo`

Configurare il content type **Articolo** con i seguenti campi:

| Campo | Tipo | Note |
| --- | --- | --- |
| `titolo` | Text (short) | Obbligatorio |
| `slug` | UID | Basato su `titolo`, unico |
| `data_pubblicazione` | DateTime | Utilizzato per l'ordinamento |
| `autore` | Text (short) | |
| `immagine_in_evidenza` | Media (single) | Consigliato |
| `estratto` | Text (long) | Usato come anteprima e meta description |
| `contenuto` | Rich Text (Markdown consigliato) | |
| `tags` | Relation many-to-many con `Tag` **oppure** campo `Repeatable Component` con text |

> Suggerimento: creare un Content Type `Tag` (solo campo `nome` + `slug`) per facilitare filtri e tassonomia.

## 3. Content type `Evento`

| Campo | Tipo | Note |
| --- | --- | --- |
| `titolo` | Text (short) | Obbligatorio |
| `slug` | UID | Basato su `titolo`, unico |
| `data` | Date | |
| `orario` | Time | opzionale |
| `luogo` | Text (short) | |
| `immagine` | Media (single) | |
| `descrizione` | Rich Text / Markdown | |
| `costo` | Text (short) | opzionale |
| `tags` | Relation con `Tag` | opzionale |
| `stato` | Enumeration (`upcoming`, `past`) | opzionale (il front-end gestisce anche in automatico tramite data) |

## 4. Permessi API

1. Dal pannello admin Strapi → *Settings → Users & Permissions Plugin → Roles*.
2. Nella sezione **Public**, consentire l'accesso `find` e `findOne` per Articoli ed Eventi.
3. Salvare.

Per endpoint protetti creare un **API Token** (Settings → API Tokens) da usare in produzione con ruolo `Custom` (solo lettura).

## 5. Configurazione ambienti

Nel progetto Astro definire le seguenti variabili (file `.env`):

```
STRAPI_BASE_URL=https://<dominio-strapi>
STRAPI_API_TOKEN=<token_lettura_opzionale>
```

Il file `src/lib/config.ts` legge automaticamente questi valori.

## 6. Gestione anteprime (Preview)

Strapi consente di definire un link di anteprima:

1. In *Content Manager*, aprire Articolo → impostazioni → *Configure the view* → abilitare il campo `Anteprima` con URL: `https://www.sergiocontegiacomo.it/blog/{slug}?preview=true`.
2. Nel front-end implementare la modalità preview se necessario (attivabile passando `?preview=true` e usando un token `draft`).

## 7. Automatizzare stato eventi

Per spostare automaticamente eventi passati:

- Creare una **Lifecycle hook** su Evento (`/src/api/eventi/content-types/evento/lifecycles.ts`) che imposti `stato = 'past'` quando `data < today`.
- In alternativa, programmare un cron Strapi (plugin `strapi-plugin-cron`) che aggiorni gli eventi ogni notte.

## 8. Media & Upload

- Attivare un provider S3/Cloudinary per gestire asset se l'hosting non consente filesystem persistente.
- Configurare dimensioni consigliate: 1600×900 px per cover, 1200×675 px per evento.

## 9. Sicurezza & accessi

- Creare un ruolo *Editor* dedicato a Sergio con permessi limitati ai content type rilevanti.
- Abilitare 2FA per l'account admin se disponibile.
- Effettuare backup periodici del database (schedule automatico con il provider scelto).

## 10. Deploy

- Per ambienti production/staging utilizzare database gestiti (PostgreSQL consigliato).
- Impostare le variabili d'ambiente corrispondenti all'hosting (Render, Railway, ecc.).

Una volta completata la configurazione, Sergio potrà gestire articoli ed eventi direttamente da Strapi; il sito Astro rigenererà le pagine statiche durante la build (o via webhook). In alternativa configurare `astro sync` con Incremental Static Regeneration via adattatore SSR.
