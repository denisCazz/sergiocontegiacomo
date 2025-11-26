export const cmsConfig = {
  strapiBaseUrl: import.meta.env.STRAPI_BASE_URL ?? '',
  strapiToken: import.meta.env.STRAPI_API_TOKEN ?? '',
};

export const siteConfig = {
  name: 'Sergio Contegiacomo',
  role: 'Consulente patrimoniale & coach finanziario',
  siteUrl: 'https://www.sergiocontegiacomo.it',
  contactEmail: 'info@sergiocontegiacomo.it',
  phone: '0172 44191',
  address: 'Piazza Roma, 39, 12042 Bra (CN)',
  newsletterEndpoint: '/api/newsletter',
  social: {
    linkedin: 'https://www.linkedin.com/',
    youtube: 'https://www.youtube.com/',
    instagram: 'https://www.instagram.com/',
  },
};
