import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

export const SESSION_COOKIE = 'sergio_admin_session';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export type AdminSession = {
  email: string;
  exp: number;
};

function getAuthSecret(): string {
  return (import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET || '').trim();
}

function getAdminCredentials(): { email: string; password: string } {
  const email = (import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
  return { email, password };
}

function sign(payload: string): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodeSession(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function decodeSession(token: string): AdminSession | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
    if (!session?.email || typeof session.exp !== 'number') return null;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export function verifyCredentials(email: string, password: string): boolean {
  const admin = getAdminCredentials();
  if (!admin.email || !admin.password || !getAuthSecret()) {
    console.error('Admin auth env vars missing');
    return false;
  }
  const inputEmail = email.trim().toLowerCase();
  const emailOk = inputEmail === admin.email;
  const passA = Buffer.from(password);
  const passB = Buffer.from(admin.password);
  const passwordOk = passA.length === passB.length && timingSafeEqual(passA, passB);
  return emailOk && passwordOk;
}

export function createSessionToken(email: string): string {
  const session: AdminSession = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  };
  return encodeSession(session);
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionFromCookies(cookies: AstroCookies): AdminSession | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token || !getAuthSecret()) return null;
  try {
    return decodeSession(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): AdminSession | null {
  if (!getAuthSecret()) return null;
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeSession(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function requireAdminFromCookies(cookies: AstroCookies): AdminSession {
  const session = getSessionFromCookies(cookies);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export function requireAdminFromRequest(request: Request): AdminSession {
  const session = getSessionFromRequest(request);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export function unauthorizedResponse(message = 'Non autorizzato') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getAdminEmail(): string {
  return getAdminCredentials().email || 'admin';
}
