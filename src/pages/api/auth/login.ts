import type { APIRoute } from 'astro';
import {
  verifyCredentials,
  createSessionToken,
  setSessionCookie,
} from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email e password obbligatori' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!verifyCredentials(email, password)) {
      return new Response(JSON.stringify({ error: 'Credenziali non valide' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = createSessionToken(email);
    setSessionCookie(cookies, token);

    return new Response(JSON.stringify({ success: true, email: email.trim().toLowerCase() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'Errore di autenticazione' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
