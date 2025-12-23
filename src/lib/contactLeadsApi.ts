export type ContactLeadPayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  message: string;
  tags?: string[];
};

type ContactLeadsApiConfig = {
  endpoint: string;
  apiKey?: string;
};

function getContactLeadsApiConfig(): ContactLeadsApiConfig | null {
  const endpoint = import.meta.env.CONTACT_LEADS_ENDPOINT?.toString().trim();
  if (!endpoint) return null;

  const apiKey = import.meta.env.CONTACT_LEADS_API_KEY?.toString().trim();
  return { endpoint, apiKey: apiKey || undefined };
}

function withTimeout(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
}

function buildMessageWithContext(message: string, request?: Request): string {
  const base = message.trim();
  const referer = request?.headers.get('referer')?.trim();
  if (!referer) return base;

  const combined = `${base}\n\nReferrer: ${referer}`.trim();
  return combined.length > 5000 ? `${combined.slice(0, 4997)}...` : combined;
}

function compactPayload(payload: ContactLeadPayload): Record<string, unknown> {
  const out: Record<string, unknown> = {
    message: payload.message,
  };

  if (payload.email) out.email = payload.email;
  if (payload.first_name) out.first_name = payload.first_name;
  if (payload.last_name) out.last_name = payload.last_name;
  if (payload.phone) out.phone = payload.phone;
  if (payload.tags && payload.tags.length) out.tags = payload.tags;

  return out;
}

export async function sendContactLead(payload: ContactLeadPayload): Promise<{
  status: number;
  ok: boolean;
  skipped: boolean;
  errorText?: string;
}> {
  const config = getContactLeadsApiConfig();
  if (!config) {
    return { status: 0, ok: true, skipped: true };
  }

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
    },
    body: JSON.stringify(
      compactPayload({
        ...payload,
        message: buildMessageWithContext(payload.message),
      }),
    ),
    signal: withTimeout(6000),
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
