import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({
      error: 'Server configuration error: Missing Supabase credentials'
    }), { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Email and password are required'
      }), { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm the user
    });

    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), { status: 400 });
    }

    return new Response(JSON.stringify({
      message: 'User created successfully',
      user: data.user
    }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), { status: 500 });
  }
};
