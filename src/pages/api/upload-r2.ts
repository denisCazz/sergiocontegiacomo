import type { APIRoute } from 'astro';
import { uploadToR2, deleteFromR2, isR2Configured, type FileCategory } from '../../lib/r2';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Configurazione per ogni categoria
const CATEGORY_CONFIG: Record<FileCategory, { maxSize: number; label: string }> = {
  images: { maxSize: 10 * 1024 * 1024, label: 'Immagine' },  // 10MB
  audio: { maxSize: 100 * 1024 * 1024, label: 'Audio' },     // 100MB
  press: { maxSize: 50 * 1024 * 1024, label: 'PDF' },        // 50MB
};

/**
 * API unificata per upload file su Cloudflare R2
 * Supporta: immagini, audio, PDF
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verifica che R2 sia configurato
    if (!isR2Configured()) {
      return new Response(JSON.stringify({ 
        error: 'Cloudflare R2 non configurato. Controlla le variabili d\'ambiente.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify session with Supabase
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sessione non valida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as FileCategory) || 'images';

    if (!file) {
      return new Response(JSON.stringify({ error: 'Nessun file fornito' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate category
    if (!['images', 'audio', 'press'].includes(category)) {
      return new Response(JSON.stringify({ error: 'Categoria non valida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config = CATEGORY_CONFIG[category];

    // Validate file size
    if (file.size > config.maxSize) {
      const maxMB = Math.round(config.maxSize / (1024 * 1024));
      return new Response(JSON.stringify({ 
        error: `${config.label} troppo grande. Massimo ${maxMB}MB.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upload to Cloudflare R2
    const result = await uploadToR2(file, category);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error || 'Errore durante l\'upload' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url: result.url,
      key: result.key,
      fileName: file.name,
      size: file.size,
      category,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('R2 Upload API error:', err);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * API per eliminare file da Cloudflare R2
 */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    if (!isR2Configured()) {
      return new Response(JSON.stringify({ 
        error: 'Cloudflare R2 non configurato.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sessione non valida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get file URL from request body
    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: 'URL file mancante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete from R2
    const success = await deleteFromR2(fileUrl);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Errore durante l\'eliminazione' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('R2 Delete API error:', err);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
