-- =============================================
-- TABELLE E STORAGE PER AUDIOPILLOLE E RASSEGNA STAMPA
-- Esegui questo SQL nel SQL Editor di Supabase
-- =============================================

-- =============================================
-- PARTE 1: STORAGE BUCKETS
-- =============================================
-- NOTA: I bucket devono essere creati dalla Dashboard Supabase
-- Storage > New Bucket:
-- 1. Bucket "audio" - Public = true
-- 2. Bucket "press" - Public = true

-- Policy per Storage bucket "audio"
-- Vai su Storage > audio > Policies e aggiungi:

-- Policy: "Allow public access to audio files"
-- CREATE POLICY "Allow public access to audio files"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'audio');

-- Policy: "Allow authenticated uploads to audio"
-- CREATE POLICY "Allow authenticated uploads to audio"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'audio');

-- Policy: "Allow authenticated delete from audio"
-- CREATE POLICY "Allow authenticated delete from audio"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'audio');

-- Stesso per bucket "press"
-- CREATE POLICY "Allow public access to press files"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'press');

-- CREATE POLICY "Allow authenticated uploads to press"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'press');

-- CREATE POLICY "Allow authenticated delete from press"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'press');

-- =============================================
-- PARTE 2: TABELLE DATABASE
-- =============================================

-- Tabella AudioPillole
CREATE TABLE IF NOT EXISTS audio_pillole (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    duration TEXT,
    published_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Press (Rassegna Stampa)
CREATE TABLE IF NOT EXISTS press (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    testata TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    published_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_audio_pillole_published_at ON audio_pillole(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_press_published_at ON press(published_at DESC);

-- RLS (Row Level Security) - Lettura pubblica
ALTER TABLE audio_pillole ENABLE ROW LEVEL SECURITY;
ALTER TABLE press ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "Allow public read access on audio_pillole" 
ON audio_pillole FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public read access on press" 
ON press FOR SELECT 
TO public 
USING (true);

-- Policy per scrittura (solo authenticated o service_role)
CREATE POLICY "Allow authenticated insert on audio_pillole" 
ON audio_pillole FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on audio_pillole" 
ON audio_pillole FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete on audio_pillole" 
ON audio_pillole FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated insert on press" 
ON press FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on press" 
ON press FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete on press" 
ON press FOR DELETE 
TO authenticated 
USING (true);

-- =============================================
-- ISTRUZIONI PER CONFIGURARE STORAGE
-- =============================================
-- 
-- 1. Vai su Supabase Dashboard > Storage
-- 
-- 2. Clicca "New Bucket" e crea:
--    - Nome: audio
--    - Public bucket: ✓ (attivo)
--    - Clicca "Create bucket"
-- 
-- 3. Clicca "New Bucket" e crea:
--    - Nome: press  
--    - Public bucket: ✓ (attivo)
--    - Clicca "Create bucket"
--
-- 4. Per ogni bucket, vai su "Policies" e aggiungi:
--
--    a) Policy per SELECT (lettura pubblica):
--       - Policy name: "Public Access"
--       - Allowed operation: SELECT
--       - Target roles: public (o anon)
--       - USING expression: true
--
--    b) Policy per INSERT (upload autenticato):
--       - Policy name: "Authenticated Upload"
--       - Allowed operation: INSERT  
--       - Target roles: authenticated
--       - WITH CHECK expression: true
--
--    c) Policy per DELETE (delete autenticato):
--       - Policy name: "Authenticated Delete"
--       - Allowed operation: DELETE
--       - Target roles: authenticated
--       - USING expression: true
--
-- =============================================

-- =============================================
-- DATI DI ESEMPIO (opzionale, puoi rimuoverli)
-- =============================================

-- Esempio AudioPillola
-- INSERT INTO audio_pillole (title, description, file_url, duration, published_at)
-- VALUES 
--     ('La psicologia degli investimenti', 'Come gestire le emozioni quando i mercati oscillano', '/audio/psicologia-investimenti.mp3', '8:45', '2024-01-15'),
--     ('Pianificazione successoria', 'Proteggere il patrimonio per le generazioni future', '/audio/pianificazione-successoria.mp3', '12:30', '2024-02-20');

-- Esempio Press
-- INSERT INTO press (title, testata, description, file_url, published_at)
-- VALUES 
--     ('Come proteggere il patrimonio familiare', 'Il Sole 24 Ore', 'Intervista sulle strategie di protezione patrimoniale', '/press/sole24ore-protezione.pdf', '2024-03-15'),
--     ('La finanza comportamentale al servizio del risparmiatore', 'Milano Finanza', 'Articolo sulla consulenza patrimoniale olistica', '/press/milanofinanza-comportamentale.pdf', '2024-01-10');
