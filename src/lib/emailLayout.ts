import { siteConfig } from './config';

const NAVY = '#0c1929';
const GOLD = '#b8956a';
const PAGE_BG = '#e8edf3';
const TEXT = '#1e293b';
const MUTED = '#64748b';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

export type SiteEmailWrapOptions = {
  /** Testo nascosto per preheader (snippet in elenco posta) */
  preheader?: string;
  /** HTML del corpo (solo frammenti già escapati dove serve) */
  innerHtml: string;
  brandName?: string;
  siteUrl?: string;
  /** Riga finale sopra il link al sito */
  footerLine?: string;
};

/**
 * Layout transazionale responsive-friendly (tabelle + stili inline) per client email reali.
 */
export function wrapSiteTransactionalEmail(options: SiteEmailWrapOptions): string {
  const name = options.brandName ?? siteConfig.name;
  const url = options.siteUrl ?? siteConfig.siteUrl;
  const pre = (options.preheader ?? '').trim();
  const footer = options.footerLine ?? `Messaggio automatico · ${name}`;
  const host = url.replace(/^https?:\/\//i, '');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<title>${escapeHtml(name)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${pre ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(pre)}</div>` : ''}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:28px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
        <tr>
          <td style="background:${NAVY};border-radius:14px 14px 0 0;padding:26px 24px 22px;text-align:center;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:600;color:#f8fafc;letter-spacing:-0.02em;line-height:1.25;">
              ${escapeHtml(name)}
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:14px auto 0;">
              <tr><td style="height:3px;width:52px;background:${GOLD};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:30px 26px 28px;border-radius:0 0 14px 14px;box-shadow:0 12px 40px -16px rgba(15,23,42,0.22);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.65;color:${TEXT};">
            ${options.innerHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 12px 8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.55;color:${MUTED};">
            <p style="margin:0 0 8px;">${escapeHtml(footer)}</p>
            <a href="${escapeAttr(url)}" style="color:${MUTED};text-decoration:underline;text-underline-offset:2px;">${escapeHtml(host)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
