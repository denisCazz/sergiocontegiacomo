const BREVO_API_BASE = 'https://api.brevo.com/v3';

export type BrevoConfig = {
  apiKey: string;
};

export function getBrevoConfig(): BrevoConfig {
  const apiKey = import.meta.env.BREVO_API_KEY?.toString().trim();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY mancante');
  }
  return { apiKey };
}

export async function brevoRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {},
): Promise<{ status: number; data?: T; errorText?: string }> {
  const { apiKey } = getBrevoConfig();
  const method = options.method ?? 'POST';

  const res = await fetch(`${BREVO_API_BASE}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (res.ok) {
    if (isJson) {
      return { status: res.status, data: (await res.json()) as T };
    }
    return { status: res.status };
  }

  const errorText = isJson ? JSON.stringify(await res.json()) : await res.text();
  return { status: res.status, errorText };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
