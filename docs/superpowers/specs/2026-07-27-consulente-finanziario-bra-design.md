# Landing “Consulente finanziario Bra” — Design

## Obiettivo

Creare la route indicizzabile `/consulente-finanziario-bra` come pagina locale principale per la ricerca “consulente finanziario Bra”. La pagina deve spiegare con chiarezza l’attività finanziaria e patrimoniale svolta da Sergio Contegiacomo a Bra, mantenendo la homepage visivamente e testualmente invariata e senza tecniche SEO nascoste.

## Architettura

- Creare `src/pages/consulente-finanziario-bra.astro` con `export const prerender = true`.
- Riutilizzare `BaseLayout`, `CTASection`, Tailwind, font, colori, spaziature, griglie e animazioni esistenti.
- Estendere `BaseLayout` con una prop per disabilitare i dati strutturati globali. Il valore predefinito manterrà invariato l’HTML delle route esistenti; solo la nuova landing userà l’opt-out.
- Passare alla landing un unico grafo JSON-LD specifico, evitando duplicati `Person` e `FinancialService`.
- Centralizzare in `siteConfig` gli URL ufficiali già verificati per profilo Allianz e indicazioni Google Maps.
- Aggiungere in `cosa-faccio.astro` un collegamento visibile con anchor “consulenza finanziaria e patrimoniale a Bra”.
- Non modificare `src/pages/index.astro`, `Header.astro`, `Footer.astro` o `Hero.astro`.

## Design visivo

La pagina seguirà il linguaggio delle pagine `chi-sono.astro`, `cosa-faccio.astro` e `contatti.astro`:

1. Breadcrumb visibile.
2. Hero a due colonne con eyebrow, unico H1, testo introduttivo, due CTA e ritratto professionale.
3. Sezione narrativa “Una consulenza costruita intorno alla persona”.
4. Griglia responsive di sei card per gli ambiti di consulenza.
5. Timeline responsive di quattro passaggi per il metodo.
6. Sezione esperienza con collegamento a `/chi-sono`.
7. Sezione locale con indirizzo e recapiti da `siteConfig`, link ufficiale alle indicazioni e nessun iframe.
8. Sei FAQ interamente visibili, con domande H3 e risposte identiche allo schema.
9. CTA finale tramite `CTASection`.

Le griglie passeranno a una colonna su mobile. Le immagini useranno `astro:assets`, con dimensioni generate e alt text naturale. Non verrà aggiunto JavaScript client-side.

## Contenuti e collegamenti

I testi, titoli e CTA saranno quelli forniti nel requisito. “Prenota una call”, “Contattami” e “Contatta lo studio” punteranno a `/contatti`, destinazione già usata dal sito per la prenotazione.

La landing conterrà link normali `<a href>` verso:

- `/`;
- `/chi-sono`;
- `/cosa-faccio`;
- `/contatti`;
- Google Maps, con URL già presente nella pagina contatti.

Il link in ingresso verrà aggiunto alla pagina Servizi, non a elementi globali.

## Metadata

- Title HTML: `Consulente finanziario a Bra | Sergio Contegiacomo`.
- Description: `Sergio Contegiacomo, consulente finanziario e patrimoniale a Bra con oltre 35 anni di esperienza. Consulenza per famiglie e imprenditori.`
- Canonical: `https://www.sergiocontegiacomo.it/consulente-finanziario-bra`.
- Robots: indicizzabile, `index, follow`.
- Open Graph: title e description coerenti, `website`, `it_IT`, URL canonico.
- Twitter Card: `summary_large_image`.
- Immagine social JPEG 1200×630 ricavata da un ritratto professionale già tracciato nel repository.
- Documento `lang="it"` ereditato da `BaseLayout`.

La convenzione URL sarà senza trailing slash, coerente con Astro e con le route esistenti.

## Dati strutturati

La landing userà un solo oggetto con `@context` e `@graph` contenente:

- `WebPage`;
- `Person`;
- `FinancialService`;
- `BreadcrumbList`;
- `FAQPage`.

Gli `@id` saranno stabili e basati sul dominio canonico. `WebPage` referenzierà `Person` con `about`, `FinancialService` con `provider` e `FAQPage` con `mainEntity`; tutte le entità di pagina useranno il canonical come base dei rispettivi frammenti. Verranno usati soltanto:

- nome, ruolo e oltre 35 anni di esperienza documentati;
- indirizzo, telefoni ed email da `siteConfig`;
- Bra e provincia di Cuneo come area servita, coerenti con il contenuto visibile;
- LinkedIn e profilo Allianz ufficiali verificati;
- fotografia e URL canonici.

Non verranno aggiunti prezzi, orari, coordinate, partita IVA, rating, recensioni, rendimenti, premi, clienti o qualifiche non documentate. `FAQPage` riprodurrà esattamente le FAQ visibili.

## SEO tecnica

- La route prerenderizzata sarà disponibile nell’HTML iniziale e inclusa dalla sitemap Astro.
- `public/robots.txt` già permette la route e dichiara `sitemap-index.xml`; verrà verificato, non modificato salvo errore emerso in build.
- Un solo H1 e title/description unici.
- Nessuna variante URL duplicata introdotta.
- Immagini con dimensioni definite per evitare layout shift.
- Nessuna dipendenza aggiunta.

## Test e verifica

Il lavoro seguirà red-green:

1. aggiungere un test contrattuale con `node:test` che fallisce perché route e requisiti non esistono;
2. implementare la pagina e le modifiche minime;
3. eseguire il test fino al passaggio;
4. eseguire `astro check`, build e test disponibili;
5. avviare il server compilato e verificare HTTP 200;
6. controllare nell’HTML title, description, canonical, robots, H1, JSON-LD, link e contenuti;
7. controllare sitemap e robots;
8. verificare desktop e mobile;
9. confrontare homepage prima e dopo e verificare che i file della homepage e i componenti globali visivi non siano cambiati.

## Vincoli

- Nessuna modifica visiva o testuale alla homepage.
- Nessun link tramite header o footer globale.
- Nessuna keyword nascosta o stuffing.
- Nessuna promessa economica o qualifica non verificata.
- Nessuna garanzia di ranking o rich result.
- Nessun commit automatico: il repository verrà modificato direttamente su `main` come richiesto, ma il commit resta a carico dell’utente salvo richiesta esplicita.

## Attività post-deploy

Il riepilogo finale ricorderà di:

- controllare il nuovo URL in Google Search Console;
- richiedere l’indicizzazione;
- reinviare la sitemap;
- verificare canonical e dati strutturati sul deploy;
- monitorare impressioni, clic e posizione per le quattro query indicate nel requisito.
