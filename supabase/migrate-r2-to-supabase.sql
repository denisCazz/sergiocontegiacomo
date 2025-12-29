-- =============================================
-- SCRIPT DI ANALISI E MIGRAZIONE URL R2 -> SUPABASE
-- =============================================
-- Questo script ti aiuta a identificare i record che hanno ancora URL R2
-- e fornisce query per monitorare la migrazione
-- =============================================

-- =============================================
-- PARTE 1: ANALISI - Verifica quanti record hanno URL R2
-- =============================================

-- Conta articoli con URL R2
SELECT 
  'Articoli' as tabella,
  COUNT(*) as totale,
  COUNT(*) FILTER (WHERE cover_image LIKE '%r2.dev%' OR cover_image LIKE '%r2.cloudflarestorage.com%') as con_r2,
  COUNT(*) FILTER (WHERE cover_image LIKE '%supabase.co%') as con_supabase,
  COUNT(*) FILTER (WHERE cover_image IS NULL OR cover_image = '') as senza_immagine
FROM public.articles;

-- Conta eventi con URL R2
SELECT 
  'Eventi' as tabella,
  COUNT(*) as totale,
  COUNT(*) FILTER (WHERE cover_image LIKE '%r2.dev%' OR cover_image LIKE '%r2.cloudflarestorage.com%') as con_r2,
  COUNT(*) FILTER (WHERE cover_image LIKE '%supabase.co%') as con_supabase,
  COUNT(*) FILTER (WHERE cover_image IS NULL OR cover_image = '') as senza_immagine
FROM public.events;

-- Conta audiopillole con URL R2
SELECT 
  'AudioPillole' as tabella,
  COUNT(*) as totale,
  COUNT(*) FILTER (WHERE file_url LIKE '%r2.dev%' OR file_url LIKE '%r2.cloudflarestorage.com%') as con_r2,
  COUNT(*) FILTER (WHERE file_url LIKE '%supabase.co%') as con_supabase
FROM public.audio_pillole;

-- Conta podcast con URL R2
SELECT 
  'Podcast' as tabella,
  COUNT(*) as totale,
  COUNT(*) FILTER (WHERE file_url LIKE '%r2.dev%' OR file_url LIKE '%r2.cloudflarestorage.com%') as con_r2,
  COUNT(*) FILTER (WHERE file_url LIKE '%supabase.co%') as con_supabase
FROM public.podcasts;

-- Conta rassegna stampa con URL R2
SELECT 
  'Rassegna Stampa' as tabella,
  COUNT(*) as totale,
  COUNT(*) FILTER (WHERE file_url LIKE '%r2.dev%' OR file_url LIKE '%r2.cloudflarestorage.com%') as con_r2,
  COUNT(*) FILTER (WHERE file_url LIKE '%supabase.co%') as con_supabase
FROM public.press;

-- =============================================
-- PARTE 2: LISTA DETTAGLIATA - Record con URL R2
-- =============================================

-- Articoli con URL R2
SELECT 
  id,
  title,
  slug,
  cover_image,
  'Articolo' as tipo
FROM public.articles
WHERE cover_image LIKE '%r2.dev%' OR cover_image LIKE '%r2.cloudflarestorage.com%'
ORDER BY created_at DESC;

-- Eventi con URL R2
SELECT 
  id,
  title,
  slug,
  cover_image,
  'Evento' as tipo
FROM public.events
WHERE cover_image LIKE '%r2.dev%' OR cover_image LIKE '%r2.cloudflarestorage.com%'
ORDER BY created_at DESC;

-- AudioPillole con URL R2
SELECT 
  id,
  title,
  file_url,
  'AudioPillola' as tipo
FROM public.audio_pillole
WHERE file_url LIKE '%r2.dev%' OR file_url LIKE '%r2.cloudflarestorage.com%'
ORDER BY created_at DESC;

-- Podcast con URL R2
SELECT 
  id,
  title,
  file_url,
  'Podcast' as tipo
FROM public.podcasts
WHERE file_url LIKE '%r2.dev%' OR file_url LIKE '%r2.cloudflarestorage.com%'
ORDER BY created_at DESC;

-- Rassegna Stampa con URL R2
SELECT 
  id,
  title,
  file_url,
  'Rassegna Stampa' as tipo
FROM public.press
WHERE file_url LIKE '%r2.dev%' OR file_url LIKE '%r2.cloudflarestorage.com%'
ORDER BY created_at DESC;

-- =============================================
-- PARTE 3: MIGRAZIONE MANUALE
-- =============================================
-- NOTA: La migrazione automatica richiederebbe:
-- 1. Scaricare i file da R2
-- 2. Ricaricarli su Supabase Storage
-- 3. Aggiornare gli URL nel database
-- 
-- Questo processo è complesso e richiede accesso a entrambi i servizi.
-- 
-- Per ora, gli URL R2 esistenti continueranno a funzionare.
-- I nuovi upload andranno automaticamente su Supabase Storage.
-- 
-- Se vuoi migrare manualmente un record specifico:
-- 1. Scarica il file da R2
-- 2. Caricalo su Supabase Storage tramite l'admin
-- 3. Aggiorna l'URL nel database con una query come questa:
--
-- UPDATE public.articles 
-- SET cover_image = 'NUOVO_URL_SUPABASE'
-- WHERE id = ID_RECORD;
--
-- =============================================

