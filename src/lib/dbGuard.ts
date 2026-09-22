export const DB_CONNECT_TIMEOUT_SEC = 2;
export const DB_COOLDOWN_MS = 20_000;

const CONNECTIVITY_CODES = new Set([
  'CONNECT_TIMEOUT',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
]);

export function isDatabaseConnectivityError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = 'code' in error ? String(error.code) : '';
  const errno = 'errno' in error ? String(error.errno) : '';
  if (CONNECTIVITY_CODES.has(code) || CONNECTIVITY_CODES.has(errno)) return true;
  const message = error instanceof Error ? error.message : '';
  return /CONNECT_TIMEOUT|ECONNREFUSED|ENOTFOUND|getaddrinfo|connect ETIMEDOUT/i.test(message);
}

export function createDbCooldown(cooldownMs = DB_COOLDOWN_MS) {
  let until = 0;

  return {
    isCoolingDown(now = Date.now()) {
      return now < until;
    },
    note(error: unknown, now = Date.now()) {
      if (!isDatabaseConnectivityError(error)) return false;
      until = now + cooldownMs;
      return true;
    },
    clear() {
      until = 0;
    },
  };
}

export function databaseUnavailableError() {
  const error = new Error('Database temporarily unreachable');
  (error as Error & { code: string }).code = 'DB_COOLDOWN';
  return error;
}
