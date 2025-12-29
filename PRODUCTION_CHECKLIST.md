# ✅ Checklist Pre-Produzione

## 📋 Configurazione Base

- [ ] **Dominio configurato**: `sergiocontegiacomo.it`
- [ ] **Variabili d'ambiente** configurate in Vercel:
  - [ ] `PUBLIC_SITE_URL=https://sergiocontegiacomo.it`
  - [ ] `PUBLIC_SUPABASE_URL`
  - [ ] `PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `PUBLIC_GA_MEASUREMENT_ID` (opzionale)

## 🗄️ Supabase

- [ ] **Bucket Storage creati**:
  - [ ] `images` (Public = true)
  - [ ] `audio` (Public = true)
  - [ ] `press` (Public = true)
- [ ] **Script SQL eseguiti**:
  - [ ] `supabase/schema.sql`
  - [ ] `supabase/podcasts.sql`
  - [ ] `supabase/storage-buckets.sql`
- [ ] **RLS Policies verificate** su tutte le tabelle
- [ ] **Test autenticazione admin** funzionante

## 🚀 Deploy

- [ ] **Build locale testata**: `npm run build` senza errori
- [ ] **Preview locale testata**: `npm run preview` funzionante
- [ ] **Repository Git** connesso a Vercel
- [ ] **Deploy automatico** configurato
- [ ] **Dominio aggiunto** in Vercel Settings → Domains
- [ ] **DNS records** configurati correttamente
- [ ] **SSL/HTTPS** attivo (automatico con Vercel)

## 🔍 Verifica Funzionalità

- [ ] **Homepage** caricata correttamente
- [ ] **Blog/Articoli** visualizzabili
- [ ] **Eventi** visualizzabili
- [ ] **AudioPillole** funzionanti
- [ ] **Podcast** funzionanti
- [ ] **Rassegna Stampa** funzionante
- [ ] **Form Contatti** funzionante
- [ ] **Newsletter** funzionante
- [ ] **Admin Panel** accessibile e funzionante
- [ ] **Upload file** su Supabase Storage funzionante

## 📊 SEO & Analytics

- [ ] **Sitemap** accessibile: `/sitemap-index.xml`
- [ ] **RSS Feed** accessibile: `/rss.xml`
- [ ] **Robots.txt** corretto: `/robots.txt`
- [ ] **Meta tags** presenti su tutte le pagine
- [ ] **Open Graph** tags configurati
- [ ] **Google Analytics** configurato (se necessario)
- [ ] **Structured Data** (JSON-LD) presente

## 🔐 Sicurezza

- [ ] **HTTPS** forzato
- [ ] **Admin panel** protetto con autenticazione
- [ ] **API endpoints** protetti
- [ ] **RLS** abilitato su Supabase
- [ ] **Service Role Key** solo lato server
- [ ] **Headers sicurezza** configurati (vercel.json)

## 📝 Contenuti

- [ ] **Contenuti base** inseriti
- [ ] **Immagini** ottimizzate
- [ ] **Link interni** funzionanti
- [ ] **Link esterni** verificati
- [ ] **Form di contatto** testato

## 🧪 Test Finali

- [ ] **Test su desktop** (Chrome, Firefox, Safari, Edge)
- [ ] **Test su mobile** (iOS, Android)
- [ ] **Test performance** (Lighthouse)
- [ ] **Test accessibilità** (WCAG)
- [ ] **Test SEO** (Google Search Console)

## 📧 Email & Notifiche

- [ ] **Email contatti** configurata
- [ ] **Newsletter** configurata
- [ ] **Notifiche eventi** testate (se presenti)

## 🔄 Backup & Monitoring

- [ ] **Backup database** configurato
- [ ] **Monitoring** attivo (Vercel Analytics)
- [ ] **Error tracking** configurato (opzionale)
- [ ] **Uptime monitoring** configurato (opzionale)

## 📚 Documentazione

- [ ] **README.md** aggiornato
- [ ] **DEPLOY.md** consultato
- [ ] **Credenziali** salvate in modo sicuro
- [ ] **Accessi admin** documentati

---

**Data completamento**: _______________

**Note aggiuntive**:
_______________________________________
_______________________________________

