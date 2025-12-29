# Guida al Deploy in Produzione

## Dominio: sergiocontegiacomo.it

Questa guida descrive come preparare e deployare il sito su **sergiocontegiacomo.it**.

## 📋 Pre-requisiti

1. **Account Vercel** (o altro hosting provider)
2. **Account Supabase** configurato
3. **Dominio** `sergiocontegiacomo.it` configurato
4. **Variabili d'ambiente** configurate

## 🔧 Configurazione Variabili d'Ambiente

### In Vercel Dashboard:

Vai su **Settings → Environment Variables** e aggiungi:

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

### ⚠️ Importante

- `PUBLIC_SITE_URL` deve essere `https://sergiocontegiacomo.it` (senza www)
- `SUPABASE_SERVICE_ROLE_KEY` è necessaria per le operazioni admin
- Non committare mai le chiavi nel repository

## 🗄️ Configurazione Supabase

### 1. Crea i Bucket Storage

Vai su **Storage → New Bucket** e crea:

- **`images`** - Public = true (per immagini articoli/eventi)
- **`audio`** - Public = true (per file audio/audiopillole/podcast)
- **`press`** - Public = true (per PDF rassegna stampa)

### 2. Esegui gli Script SQL

Nel **SQL Editor** di Supabase, esegui in ordine:

1. `supabase/schema.sql` - Tabelle base
2. `supabase/podcasts.sql` - Tabella podcasts
3. `supabase/storage-buckets.sql` - Policies storage

### 3. Verifica RLS (Row Level Security)

Assicurati che tutte le tabelle abbiano RLS abilitato e le policies corrette.

## 🚀 Deploy su Vercel

### Metodo 1: Deploy da Git (Consigliato)

1. **Connetti il repository** a Vercel
2. **Configura il progetto**:
   - Framework Preset: Astro
   - Root Directory: `.` (root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Aggiungi le variabili d'ambiente** (vedi sopra)
4. **Deploy**

### Metodo 2: Deploy Manuale

```bash
# Build locale
npm run build

# Deploy con Vercel CLI
npx vercel --prod
```

## 🌐 Configurazione Dominio

### In Vercel:

1. Vai su **Settings → Domains**
2. Aggiungi `sergiocontegiacomo.it`
3. Aggiungi anche `www.sergiocontegiacomo.it` (redirect automatico)
4. Configura i DNS records come indicato da Vercel:
   - **A Record**: `@` → IP di Vercel
   - **CNAME**: `www` → `cname.vercel-dns.com`

### Redirect www → non-www

Vercel gestisce automaticamente il redirect da `www.sergiocontegiacomo.it` a `sergiocontegiacomo.it`.

## ✅ Checklist Pre-Deploy

- [ ] Variabili d'ambiente configurate in Vercel
- [ ] Bucket Supabase Storage creati e configurati
- [ ] Script SQL eseguiti su Supabase
- [ ] RLS policies verificate
- [ ] Dominio configurato in Vercel
- [ ] DNS records configurati
- [ ] SSL/HTTPS attivo (automatico con Vercel)
- [ ] Google Analytics configurato (se necessario)
- [ ] Test di build locale: `npm run build`
- [ ] Test preview locale: `npm run preview`

## 🔍 Verifica Post-Deploy

Dopo il deploy, verifica:

1. **Homepage**: `https://sergiocontegiacomo.it`
2. **Sitemap**: `https://sergiocontegiacomo.it/sitemap-index.xml`
3. **RSS Feed**: `https://sergiocontegiacomo.it/rss.xml`
4. **Robots.txt**: `https://sergiocontegiacomo.it/robots.txt`
5. **Admin Panel**: `https://sergiocontegiacomo.it/admin`
6. **API Endpoints**: Testa gli upload e le funzionalità

## 🔐 Sicurezza

- ✅ RLS abilitato su tutte le tabelle Supabase
- ✅ Autenticazione richiesta per admin
- ✅ Service Role Key solo lato server
- ✅ HTTPS forzato (Vercel)
- ✅ Headers di sicurezza (Vercel automatici)

## 📊 Monitoring

- **Vercel Analytics**: Attivo automaticamente
- **Google Analytics**: Configura `PUBLIC_GA_MEASUREMENT_ID`
- **Supabase Dashboard**: Monitora query e storage

## 🐛 Troubleshooting

### Build Fallisce

- Verifica le variabili d'ambiente
- Controlla i log di build in Vercel
- Testa la build locale: `npm run build`

### Errori Supabase

- Verifica che le policies RLS siano corrette
- Controlla che i bucket storage esistano
- Verifica le credenziali Supabase

### Dominio Non Funziona

- Verifica i DNS records
- Attendi la propagazione DNS (fino a 48h)
- Controlla che il dominio sia verificato in Vercel

## 📝 Note Aggiuntive

- Il sito usa **SSR (Server-Side Rendering)** con Astro
- I file statici sono serviti da Vercel Edge Network
- Le immagini sono ottimizzate automaticamente
- Il sitemap è generato automaticamente

## 🔄 Aggiornamenti Futuri

Per aggiornare il sito:

1. Push su Git
2. Vercel deploy automatico
3. Verifica in produzione

---

**Supporto**: Per problemi tecnici, consulta la documentazione di [Astro](https://docs.astro.build) e [Vercel](https://vercel.com/docs).

