import { defineMiddleware } from 'astro:middleware';
import { getSessionFromCookies } from './lib/auth';
import { canonicalRedirectUrl } from './lib/seo';

export const onRequest = defineMiddleware(async (context, next) => {
  const method = context.request.method;
  const { pathname } = context.url;

  if (method === 'GET' || method === 'HEAD') {
    const target = canonicalRedirectUrl(context.request);
    if (target) {
      return context.redirect(target, 301);
    }
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = getSessionFromCookies(context.cookies);
    if (!session) {
      return context.redirect('/admin/login');
    }
  }

  const response = await next();

  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});
