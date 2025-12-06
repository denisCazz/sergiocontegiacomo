import type { APIRoute } from 'astro';
import { uploadToR2, deleteFromR2, isR2Configured } from '../../lib/r2';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/**
 * API per upload PDF rassegna stampa su Cloudflare R2
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

    if (!file) {
      return new Response(JSON.stringify({ error: 'Nessun file fornito' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type (solo PDF)
    if (file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: 'Tipo file non valido. Carica un file PDF.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File troppo grande. Massimo 50MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upload to Cloudflare R2
    const result = await uploadToR2(file);

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
 * API per eliminare PDF da Cloudflare R2
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
