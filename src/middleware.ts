import { defineMiddleware } from 'astro:middleware';
import { getSessionFromCookies } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Protect all /admin routes except login (layouts cannot redirect in Astro SSR)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = getSessionFromCookies(context.cookies);
    if (!session) {
      return context.redirect('/admin/login');
    }
  }

  return next();
});
