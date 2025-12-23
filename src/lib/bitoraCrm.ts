const BITORA_CRM_API_BASE = 'https://www.bitora-crm.it';
const DEFAULT_LEADS_ENDPOINT = `${BITORA_CRM_API_BASE}/api/leads`;

export type BitoraCrmLeadInput = {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
};

type BitoraCrmConfig = {
  apiKey: string;
  endpoint: string;
};

function getBitoraCrmConfig(): BitoraCrmConfig | null {
  const apiKey = import.meta.env.BITORA_CRM_API_KEY?.toString().trim();
  if (!apiKey) return null;

  const endpoint = import.meta.env.BITORA_CRM_LEADS_ENDPOINT?.toString().trim() || DEFAULT_LEADS_ENDPOINT;
  return { apiKey, endpoint };
}

function compactLead(input: BitoraCrmLeadInput): Record<string, string> {
  const out: Record<string, string> = {
    email: input.email,
  };

  if (input.first_name) out.first_name = input.first_name;
  if (input.last_name) out.last_name = input.last_name;
  if (input.phone) out.phone = input.phone;
  if (input.message) out.message = input.message;
  if (input.source) out.source = input.source;

  return out;
}

function buildMessageWithContext(message: string | undefined, request?: Request): string | undefined {
  const base = (message ?? '').trim();
  const referer = request?.headers.get('referer')?.trim();

  if (!referer) return base || undefined;

  const parts = [base, '', `Referrer: ${referer}`].filter(Boolean);
  const combined = parts.join('\n').trim();

  // Evita payload troppo grossi
  return combined.length > 5000 ? `${combined.slice(0, 4997)}...` : combined;
}

function withTimeout(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
}

export async function sendBitoraCrmLead(
  input: BitoraCrmLeadInput,
  options?: {
    request?: Request;
    timeoutMs?: number;
  },
): Promise<{ status: number; ok: boolean; skipped: boolean; errorText?: string }>{
  const config = getBitoraCrmConfig();
  if (!config) {
    return { status: 0, ok: true, skipped: true };
  }

  const timeoutMs = options?.timeoutMs ?? 6000;

  const body: BitoraCrmLeadInput = {
    ...input,
    message: buildMessageWithContext(input.message, options?.request),
  };

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
    },
    body: JSON.stringify(compactLead(body)),
    signal: withTimeout(timeoutMs),
  }).catch((error) => {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: 0,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => msg,
    } as unknown as Response;
  });

  if (res.ok) return { status: res.status, ok: true, skipped: false };

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const errorText = isJson ? JSON.stringify(await res.json().catch(() => ({}))) : await res.text().catch(() => '');

  return { status: res.status, ok: false, skipped: false, errorText };
}
