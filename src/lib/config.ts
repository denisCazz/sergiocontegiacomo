export const cmsConfig = {
  strapiBaseUrl: import.meta.env.STRAPI_BASE_URL ?? '',
  strapiToken: import.meta.env.STRAPI_API_TOKEN ?? '',
};

// Production URL - always use this for canonical URLs and SEO tags
const productionUrl = 'https://www.sergiocontegiacomo.it';

function normalizeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

// Current deployment URL (Coolify/prod)
const resolvedPublicSiteUrl =
  normalizeHttpsUrl(import.meta.env.PUBLIC_SITE_URL) ??
  normalizeHttpsUrl(import.meta.env.COOLIFY_FQDN) ??
  productionUrl;

export const siteConfig = {
  name: 'Sergio Contegiacomo',
  role: 'Consulente Patrimoniale & Coach Finanziario',
  siteUrl: productionUrl,
  currentUrl: resolvedPublicSiteUrl,
  contactEmail: 'info@sergiocontegiacomo.it',
  phone: '0172 44191',
  mobilePhone: '333 987 7939',
  address: 'Piazza Roma 39 - 12042 Bra (CN)',
  googlePlaceId: 'ChIJxd24-3Sr0hIRmTjD_4K4nEg',
  newsletterEndpoint: '/api/newsletter',
  analytics: {
    gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? '',
  },
  social: {
    linkedin: 'https://www.linkedin.com/in/sergio-contegiacomo-b180b921',
  },
};
