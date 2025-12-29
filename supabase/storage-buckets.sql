-- =============================================
-- CONFIGURAZIONE SUPABASE STORAGE BUCKETS
-- Esegui questo SQL nel SQL Editor di Supabase
-- =============================================

-- NOTA: I bucket devono essere creati dalla Dashboard Supabase
-- Vai su Storage > New Bucket e crea:
-- 1. Bucket "images" - Public = true
-- 2. Bucket "audio" - Public = true  
-- 3. Bucket "press" - Public = true

-- =============================================
-- POLICIES PER STORAGE BUCKET "images"
-- =============================================

-- Policy: "Allow public access to images"
DROP POLICY IF EXISTS "Allow public access to images" ON storage.objects;
CREATE POLICY "Allow public access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy: "Allow authenticated uploads to images"
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Policy: "Allow authenticated updates to images"
DROP POLICY IF EXISTS "Allow authenticated updates to images" ON storage.objects;
CREATE POLICY "Allow authenticated updates to images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Policy: "Allow authenticated delete from images"
DROP POLICY IF EXISTS "Allow authenticated delete from images" ON storage.objects;
CREATE POLICY "Allow authenticated delete from images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- =============================================
-- POLICIES PER STORAGE BUCKET "audio"
-- =============================================

-- Policy: "Allow public access to audio files"
DROP POLICY IF EXISTS "Allow public access to audio files" ON storage.objects;
CREATE POLICY "Allow public access to audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Policy: "Allow authenticated uploads to audio"
DROP POLICY IF EXISTS "Allow authenticated uploads to audio" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio');

-- Policy: "Allow authenticated updates to audio"
DROP POLICY IF EXISTS "Allow authenticated updates to audio" ON storage.objects;
CREATE POLICY "Allow authenticated updates to audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio');

-- Policy: "Allow authenticated delete from audio"
DROP POLICY IF EXISTS "Allow authenticated delete from audio" ON storage.objects;
CREATE POLICY "Allow authenticated delete from audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio');

-- =============================================
-- POLICIES PER STORAGE BUCKET "press"
-- =============================================

-- Policy: "Allow public access to press files"
DROP POLICY IF EXISTS "Allow public access to press files" ON storage.objects;
CREATE POLICY "Allow public access to press files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'press');

-- Policy: "Allow authenticated uploads to press"
DROP POLICY IF EXISTS "Allow authenticated uploads to press" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to press"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'press');

-- Policy: "Allow authenticated updates to press"
DROP POLICY IF EXISTS "Allow authenticated updates to press" ON storage.objects;
CREATE POLICY "Allow authenticated updates to press"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'press');

-- Policy: "Allow authenticated delete from press"
DROP POLICY IF EXISTS "Allow authenticated delete from press" ON storage.objects;
CREATE POLICY "Allow authenticated delete from press"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'press');

