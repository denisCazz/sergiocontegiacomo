# Guida operativa per Sergio

Questa guida riassume le azioni principali da svolgere all'interno del CMS (Strapi) per gestire articoli del blog ed eventi.

## 1. Accesso
- Vai su `https://<dominio-cms>/admin`.
- Inserisci email e password ricevute.
- Se abilitata, completa la verifica a due fattori.

## 2. Creare o modificare un articolo
1. Nel menu laterale seleziona **Content Manager → Articoli**.
2. Premi **Create new entry** (o apri l'articolo da modificare).
3. Compila i campi:
   - **Titolo**: frase chiara (max ~75 caratteri).
   - **Slug**: generato automaticamente; modificabile se necessario.
   - **Data pubblicazione**: imposta la data effettiva del post (usa il futuro per programmazione).
   - **Estratto**: 2‐3 frasi riassuntive (serve anche per la card e i meta tag).
   - **Contenuto**: usa l'editor Markdown, inserisci anche immagini o box di approfondimento.
   - **Tags**: scegli esistenti o creane di nuovi (max 3 consigliato).
   - **Immagine in evidenza**: drag & drop di un'immagine orizzontale.
4. Premi **Save**. Per pubblicare scegli **Publish** (o **Schedule** per programmare).

## 3. Creare o aggiornare un evento
1. Vai su **Content Manager → Eventi**.
2. Clicca **Create new entry** oppure apri un evento esistente.
3. Compila:
   - **Titolo** e **Slug**.
   - **Data** e **Orario** (24h).
   - **Luogo**: città + sala o "Online".
   - **Descrizione**: dettagli completi (programma, destinatari, call to action).
   - **Costo**: opzionale.
   - **Immagine**: banner in 16:9.
   - **Tags**: usa parole chiave per filtrare (es. "milano", "workshop").
   - **Stato**: `upcoming` per eventi futuri, `past` per archivio (viene aggiornato automaticamente anche in base alla data).
4. Salva e pubblica.

Gli eventi con data inferiore a oggi vengono mostrati come *Evento terminato*; puoi lasciarli pubblici per archivio oppure impostare `past` per nasconderli dalla vista principale.

## 4. Eliminare contenuti
- Apri l'entry → clicca sul menù (•••) → **Delete**.
- Conferma. L'elemento finirà nel cestino e sarà escluso dalle build successive.

## 5. Anteprime
- Nella pagina dell'articolo premi **Preview** per aprire la bozza nel sito (se configurato).
- Per verificare un evento, usa il link `https://www.sergiocontegiacomo.it/eventi/<slug>?preview=true` (necessita implementazione lato Astro se richiesta).

## 6. Aggiornare immagini
- Dal menu **Media Library** carica nuove immagini.
- Ottimizza i file prima dell'upload (formato JPG/WEBP, max 300 KB).
- Compila sempre il campo *Alternative text*.

## 7. Newsletter & CRM
- Le richieste arrivate dal modulo contatti vengono registrate nel log server (o nel servizio esterno integrato). Controlla la inbox dedicata o il CRM.
- Le iscrizioni alla newsletter vengono inviate all'integrazione configurata (Mailchimp/Brevo). Puoi esportare la lista dal provider.

## 8. Pianificazione editoriale
- Suggerimento: mantieni almeno 3 articoli programmati e aggiorna il calendario eventi una volta al mese.
- Segna le date importanti (chiusura trimestri, eventi macroeconomici) per contenuti tematici.

## 9. Checklist finale prima della pubblicazione
- [ ] Titolo chiaro e coerente.
- [ ] URL (slug) privo di spazi o caratteri speciali.
- [ ] Meta description (estratto) presente.
- [ ] Contenuto formattato con heading (H2/H3) e paragrafi brevi.
- [ ] Immagine ottimizzata con alt text.
- [ ] Tag corretti (massimo 3).
- [ ] Per gli eventi: data/orario corretti, call to action definita.

## 10. Supporto
- Per problemi tecnici scrivi a `supporto@tuaagenzia.it`.
- Per modifiche strutturali del sito apri un ticket su GitHub/Linear.

Con questa guida puoi gestire in autonomia blog ed eventi, mantenendo il sito sempre aggiornato.
