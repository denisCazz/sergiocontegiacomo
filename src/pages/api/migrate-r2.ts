import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabase';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/**
 * API per migrare file da R2 a Supabase Storage
 * Questo endpoint scarica i file da R2 e li ricarica su Supabase
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

    // Get request body
    const { table, id, r2Url } = await request.json();

    if (!table || !id || !r2Url) {
      return new Response(JSON.stringify({ error: 'Parametri mancanti: table, id, r2Url' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate table
    const validTables = ['articles', 'events', 'audio_pillole', 'podcasts', 'press'];
    if (!validTables.includes(table)) {
      return new Response(JSON.stringify({ error: 'Tabella non valida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine bucket and field based on table
    let bucket: string;
    let field: string;
    
    if (table === 'articles' || table === 'events') {
      bucket = 'images';
      field = 'cover_image';
    } else if (table === 'audio_pillole' || table === 'podcasts') {
      bucket = 'audio';
      field = 'file_url';
    } else if (table === 'press') {
      bucket = 'press';
      field = 'file_url';
    } else {
      return new Response(JSON.stringify({ error: 'Tabella non supportata' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Download file from R2
    let fileBlob: Blob;
    let fileName: string;
    
    try {
      const response = await fetch(r2Url);
      if (!response.ok) {
        throw new Error(`Errore download da R2: ${response.statusText}`);
      }
      
      fileBlob = await response.blob();
      
      // Extract filename from URL or generate one
      const urlPath = new URL(r2Url).pathname;
      const urlFileName = urlPath.split('/').pop() || 'file';
      const timestamp = Date.now();
      fileName = `${bucket}/${timestamp}_${urlFileName}`;
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: `Errore download file: ${error.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upload to Supabase Storage using authenticated client
    // Create admin client for storage operations
    const supabaseStorage = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    
    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from(bucket)
      .upload(fileName, fileBlob, {
        contentType: fileBlob.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return new Response(JSON.stringify({ 
        error: `Errore upload su Supabase: ${uploadError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: urlData } = supabaseStorage.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    // Update database record using authenticated client
    const { error: updateError } = await supabaseStorage
      .from(table)
      .update({ [field]: urlData.publicUrl })
      .eq('id', id);

    if (updateError) {
      // Try to delete the uploaded file if update fails
      await supabaseStorage.storage.from(bucket).remove([uploadData.path]);
      
      return new Response(JSON.stringify({ 
        error: `Errore aggiornamento database: ${updateError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      oldUrl: r2Url,
      newUrl: urlData.publicUrl,
      message: 'File migrato con successo'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Migration API error:', err);
    return new Response(JSON.stringify({ 
      error: 'Errore interno del server',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

