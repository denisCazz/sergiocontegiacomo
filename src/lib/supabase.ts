import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing. Make sure to set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your .env file.');
}

// Client per operazioni pubbliche (lettura) - usato lato client e server
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Client admin per operazioni server-side (scrittura) - bypassa RLS
// Creato solo lato server dove SUPABASE_SERVICE_ROLE_KEY è disponibile
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl || '', supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback al client normale se non c'è la service key

