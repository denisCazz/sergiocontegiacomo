/**
 * Cloudflare R2 Storage Client
 * Per la gestione di tutti i file media:
 * - PDF (rassegna stampa)
 * - Immagini (copertine articoli/eventi)
 * - Audio (audiopillole)
 * 
 * Usa AWS SDK S3 per compatibilità con R2
 */

import type { S3Client } from '@aws-sdk/client-s3';

// Configurazione R2 dalle variabili d'ambiente
const R2_ACCOUNT_ID = import.meta.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.R2_BUCKET_NAME || 'sergio-media';
const R2_PUBLIC_URL = import.meta.env.R2_PUBLIC_URL;

// Tipi di file supportati
export type FileCategory = 'images' | 'audio' | 'press';

export type R2UploadResult = {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
};

// MIME types per validazione
const ALLOWED_TYPES: Record<FileCategory, string[]> = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'],
  press: ['application/pdf'],
};

/**
 * Crea il client S3 per R2
 */
function getR2Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('R2 credentials not configured');
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Valida il tipo di file
 */
export function validateFileType(file: File, category: FileCategory): boolean {
  return ALLOWED_TYPES[category].includes(file.type);
}

/**
 * Upload di un file su Cloudflare R2
 * @param file - Il file da caricare
 * @param category - La categoria: 'images', 'audio', o 'press'
 */
export async function uploadToR2(file: File, category: FileCategory = 'press'): Promise<R2UploadResult> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = getR2Client();
  
  if (!client) {
    return { success: false, error: 'Configurazione R2 mancante' };
  }

  // Valida il tipo di file
  if (!validateFileType(file, category)) {
    const allowed = ALLOWED_TYPES[category].join(', ');
    return { success: false, error: `Tipo file non valido. Tipi permessi: ${allowed}` };
  }

  try {
    // Genera un nome file unico
    const timestamp = Date.now();
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');
    const key = `${category}/${timestamp}_${sanitizedName}`;

    // Leggi il file come ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    // Upload su R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: file.type,
    });

    await client.send(command);

    // Costruisci l'URL pubblico
    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (err) {
    console.error('R2 upload error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Errore durante l\'upload su R2' 
    };
  }
}

/**
 * Elimina un file da Cloudflare R2
 */
export async function deleteFromR2(fileUrl: string): Promise<boolean> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = getR2Client();
  
  if (!client) {
    return false;
  }

  try {
    // Estrai la key dall'URL
    let key: string | null = null;

    if (R2_PUBLIC_URL && fileUrl.startsWith(R2_PUBLIC_URL)) {
      key = fileUrl.replace(`${R2_PUBLIC_URL}/`, '');
    } else {
      // Prova a estrarre da URL r2.dev
      const match = fileUrl.match(/r2\.dev\/(.+)$/);
      if (match) {
        key = match[1];
      }
    }

    if (!key) {
      console.warn('Could not extract key from URL:', fileUrl);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (err) {
    console.error('R2 delete error:', err);
    return false;
  }
}

/**
 * Verifica se le credenziali R2 sono configurate
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Ottiene l'URL pubblico base di R2
 */
export function getR2PublicUrl(): string {
  return R2_PUBLIC_URL || `https://pub-${R2_ACCOUNT_ID}.r2.dev`;
}
