import { cmsConfig } from './config';
import dayjs from 'dayjs';
import { sampleArticles } from './dataFallback';

type FetchOptions = {
  populate?: string;
  filters?: Record<string, unknown>;
  sort?: string;
  pagination?: {
    page: number;
    pageSize: number;
  };
};

type StrapiResponse<T> = {
  data: Array<{
    id: number;
    attributes: T;
  }>;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export type Article = {
  title: string;
  slug: string;
  publishedAt: string;
  author: string;
  coverImage?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
};

export type EventItem = {
  title: string;
  slug: string;
  date: string;
  time?: string;
  location: string;
  coverImage?: string;
  description?: string;
  price?: string;
  status?: 'upcoming' | 'past';
  tags?: string[];
};

const DEFAULT_HEADERS = cmsConfig.strapiToken
  ? {
      Authorization: `Bearer ${cmsConfig.strapiToken}`,
    }
  : undefined;

function buildQuery(params: FetchOptions = {}) {
  const search = new URLSearchParams();

  if (params.populate) {
    search.set('populate', params.populate);
  }

  if (params.sort) {
    search.set('sort', params.sort);
  }

  if (params.pagination) {
    search.set('pagination[page]', String(params.pagination.page));
    search.set('pagination[pageSize]', String(params.pagination.pageSize));
  }

  const appendFilter = (prefix: string, value: unknown) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => appendFilter(`${prefix}[${index}]`, item));
      return;
    }

    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
        appendFilter(`${prefix}[${key}]`, child);
      });
      return;
    }

    search.set(prefix, String(value));
  };

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      appendFilter(`filters[${key}]`, value);
    });
  }

  return search.size > 0 ? `?${search.toString()}` : '';
}

async function fetchStrapi<T>(endpoint: string, options: FetchOptions = {}): Promise<StrapiResponse<T>> {
  if (!cmsConfig.strapiBaseUrl) {
    throw new Error('Missing STRAPI_BASE_URL in environment variables');
  }

  const url = `${cmsConfig.strapiBaseUrl}/api/${endpoint}${buildQuery(options)}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...DEFAULT_HEADERS,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Strapi request failed: ${res.status} ${res.statusText} - ${errorBody}`);
  }

  return res.json();
}

export async function getArticles(options: FetchOptions = {}) {
  if (!cmsConfig.strapiBaseUrl) {
    let filtered = [...sampleArticles];

    if (options.filters) {
      const tagFilter = (() => {
        const tagsFilter = options.filters?.tags as Record<string, unknown> | undefined;
        const contains = tagsFilter?.['$containsi'];
        return typeof contains === 'string' ? contains : undefined;
      })();
      const slugFilter = options.filters.slug;

      if (typeof tagFilter === 'string') {
        filtered = filtered.filter((article) => article.tags?.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase()));
      }

      if (typeof slugFilter === 'string') {
        filtered = filtered.filter((article) => article.slug === slugFilter);
      }
    }

  filtered.sort((a, b) => (dayjs(a.publishedAt).isBefore(dayjs(b.publishedAt)) ? 1 : -1));

  const page = options.pagination?.page ?? 1;
    const pageSize = options.pagination?.pageSize ?? filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return {
      data: paged.map((article, index) => ({
        id: start + index + 1,
        attributes: article,
      })),
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
          total: filtered.length,
        },
      },
    } satisfies StrapiResponse<Article>;
  }

  const response = await fetchStrapi<Article>('articoli', {
    populate: 'coverImage',
    sort: 'publishedAt:desc',
    ...options,
  });

  return response;
}

export async function getArticleBySlug(slug: string) {
  if (!cmsConfig.strapiBaseUrl) {
    return sampleArticles.find((article) => article.slug === slug) ?? null;
  }

  const response = await fetchStrapi<Article>('articoli', {
    populate: 'coverImage',
    filters: {
      slug,
    },
  });

  return response.data[0]?.attributes ?? null;
}

export async function getEvents(options: FetchOptions = {}) {
  if (!cmsConfig.strapiBaseUrl) {
    const page = options.pagination?.page ?? 1;
    const pageSize = options.pagination?.pageSize ?? 10;

    return {
      data: [],
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: 1,
          total: 0,
        },
      },
    } satisfies StrapiResponse<EventItem>;
  }

  const response = await fetchStrapi<EventItem>('eventi', {
    populate: 'coverImage',
    sort: 'date:asc',
    ...options,
  });

  return response;
}

export async function getEventBySlug(slug: string) {
  if (!cmsConfig.strapiBaseUrl) {
    return null;
  }

  const response = await fetchStrapi<EventItem>('eventi', {
    populate: 'coverImage',
    filters: {
      slug,
    },
  });

  return response.data[0]?.attributes ?? null;
}

export function isEventUpcoming(event: EventItem) {
  return dayjs(event.date).isSame(dayjs(), 'day') || dayjs(event.date).isAfter(dayjs(), 'day');
}
