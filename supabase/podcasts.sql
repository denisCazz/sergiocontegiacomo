-- =============================================
-- TABELLA PODCASTS
-- Esegui questo SQL nel SQL Editor di Supabase
-- =============================================

-- Tabella Podcasts
CREATE TABLE IF NOT EXISTS public.podcasts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    duration TEXT,
    published_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_podcasts_published_at ON public.podcasts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON public.podcasts(created_at DESC);

-- RLS (Row Level Security) - Lettura pubblica
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "Allow public read access on podcasts" 
ON public.podcasts FOR SELECT 
TO public 
USING (true);

-- Policy per scrittura (solo authenticated o service_role)
CREATE POLICY "Allow authenticated insert on podcasts" 
ON public.podcasts FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on podcasts" 
ON public.podcasts FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete on podcasts" 
ON public.podcasts FOR DELETE 
TO authenticated 
USING (true);

