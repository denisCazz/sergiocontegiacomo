export const cmsConfig = {
  strapiBaseUrl: import.meta.env.STRAPI_BASE_URL ?? '',
  strapiToken: import.meta.env.STRAPI_API_TOKEN ?? '',
};

const resolvedPublicSiteUrl =
  import.meta.env.PUBLIC_SITE_URL ??
  (import.meta.env.VERCEL_URL ? `https://${import.meta.env.VERCEL_URL}` : 'https://www.sergiocontegiacomo.it');

export const siteConfig = {
  name: 'Sergio Contegiacomo',
  role: 'Consulente Patrimoniale & Coach Finanziario',
  siteUrl: resolvedPublicSiteUrl,
  contactEmail: 'info@sergiocontegiacomo.it',
  phone: '0172 44191',
  address: 'Piazza Roma, 39, 12042 Bra (CN)',
  newsletterEndpoint: '/api/newsletter',
  analytics: {
    gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? '',
  },
  social: {
    linkedin: 'https://www.linkedin.com/in/sergio-contegiacomo-b180b921',
    youtube: 'https://www.youtube.com/',
    instagram: 'https://www.instagram.com/',
  },
};
