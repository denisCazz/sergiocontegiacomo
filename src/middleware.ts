import { defineMiddleware } from 'astro:middleware';
import { canonicalRedirectUrl } from './lib/seo';

export const onRequest = defineMiddleware(async (context, next) => {
  const method = context.request.method;
  if (method === 'GET' || method === 'HEAD') {
    const target = canonicalRedirectUrl(context.request);
    if (target) {
      return context.redirect(target, 301);
    }
  }

  const response = await next();
  const path = context.url.pathname;

  if (path.startsWith('/admin') || path.startsWith('/api')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});
