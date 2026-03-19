export const cmsConfig = {
  strapiBaseUrl: import.meta.env.STRAPI_BASE_URL ?? '',
  strapiToken: import.meta.env.STRAPI_API_TOKEN ?? '',
};

// Production URL - always use this for canonical URLs and SEO tags
const productionUrl = 'https://www.sergiocontegiacomo.it';

// Current deployment URL (may be Vercel preview)
const resolvedPublicSiteUrl =
  import.meta.env.PUBLIC_SITE_URL ??
  (import.meta.env.VERCEL_URL ? `https://${import.meta.env.VERCEL_URL}` : productionUrl);

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
