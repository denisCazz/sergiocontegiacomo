import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Configurazione per ogni categoria
type FileCategory = 'images' | 'audio' | 'press';

const CATEGORY_CONFIG: Record<FileCategory, { 
  maxSize: number; 
  label: string; 
  bucket: string;
  allowedTypes: string[];
}> = {
  images: { 
    maxSize: 10 * 1024 * 1024,  // 10MB
    label: 'Immagine',
    bucket: 'images',
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  },
  audio: { 
    maxSize: 100 * 1024 * 1024,  // 100MB
    label: 'Audio',
    bucket: 'audio',
    allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a']
  },
  press: { 
    maxSize: 50 * 1024 * 1024,  // 50MB
    label: 'PDF',
    bucket: 'press',
    allowedTypes: ['application/pdf']
  },
};

/**
 * API unificata per upload file su Supabase Storage
 * Supporta: immagini, audio, PDF
 */
export const POST: APIRoute = async ({ request }) => {
  try {
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

    // Validate file type
    const isValidType = config.allowedTypes.includes(file.type) || 
      (category === 'images' && file.name.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i)) ||
      (category === 'audio' && file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) ||
      (category === 'press' && file.name.match(/\.pdf$/i));

    if (!isValidType) {
      const allowed = category === 'images' ? 'JPG, PNG, WEBP, GIF, AVIF' :
                     category === 'audio' ? 'MP3, WAV, OGG, M4A' : 'PDF';
      return new Response(JSON.stringify({ 
        error: `Tipo file non valido. Tipi permessi: ${allowed}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');
    const fileName = `${category}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return new Response(JSON.stringify({ 
        error: uploadError.message || 'Errore durante l\'upload' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(uploadData.path);

    return new Response(JSON.stringify({ 
      success: true, 
      url: urlData.publicUrl,
      key: uploadData.path,
      fileName: file.name,
      size: file.size,
      category,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Supabase Upload API error:', err);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * API per eliminare file da Supabase Storage
 */
export const DELETE: APIRoute = async ({ request }) => {
  try {
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

    // Extract bucket and path from URL
    // Supabase Storage URLs format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    
    if (!pathMatch) {
      return new Response(JSON.stringify({ error: 'URL file non valido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = pathMatch[1];
    const filePath = decodeURIComponent(pathMatch[2]);

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Errore durante l\'eliminazione' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Supabase Delete API error:', err);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

