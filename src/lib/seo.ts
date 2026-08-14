export const PRODUCTION_HOST = 'www.sergiocontegiacomo.it';
export const APEX_HOST = 'sergiocontegiacomo.it';

/** Old or alternate paths Google still requests → current public URLs */
export const PATH_REDIRECTS: Record<string, string> = {
  '/about': '/chi-sono',
  '/chi-sono.html': '/chi-sono',
  '/contact': '/contatti',
  '/contacts': '/contatti',
  '/home': '/',
  '/index.html': '/',
  '/servizi': '/cosa-faccio',
};

const ASSET_EXT = /\.[a-z0-9]{2,5}$/i;

export function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isAssetPath(pathname: string): boolean {
  return ASSET_EXT.test(pathname);
}

export function normalizePublicPath(pathname: string): string {
  if (pathname.startsWith('/api')) return pathname;

  const stripped = stripTrailingSlash(pathname);
  const aliased = PATH_REDIRECTS[stripped];
  if (aliased) return aliased;
  if (isAssetPath(pathname)) return pathname;
  return stripped;
}

export function requestHost(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const raw = forwarded || request.headers.get('host') || '';
  return raw.split(':')[0].toLowerCase();
}

export function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || host.endsWith('.internal');
}

function requestProtocol(request: Request, host: string, fallbackUrl: URL): string {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwarded === 'http' || forwarded === 'https') return forwarded;
  if (isLocalHost(host)) return fallbackUrl.protocol.replace(':', '') || 'http';
  return 'https';
}

/** Public 301 target, or null when the request is already canonical. */
export function canonicalRedirectUrl(request: Request): string | null {
  const url = new URL(request.url);
  const host = requestHost(request);
  const nextPath = normalizePublicPath(url.pathname);
  const nextHost = !isLocalHost(host) && host === APEX_HOST ? PRODUCTION_HOST : host;

  if (nextPath === url.pathname && nextHost === host) return null;

  const protocol = requestProtocol(request, nextHost, url);
  const port = isLocalHost(nextHost) && url.port ? `:${url.port}` : '';
  return `${protocol}://${nextHost}${port}${nextPath}${url.search}`;
}
