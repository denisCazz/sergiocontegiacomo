import { supabase } from './supabase';
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

export async function getArticles(options: FetchOptions = {}) {
  let query = supabase.from('articles').select('*', { count: 'exact' });

  // Filters
  if (options.filters) {
    if (options.filters.slug) {
      query = query.eq('slug', options.filters.slug);
    }
    // Handle other filters if needed, e.g. tags
  }

  // Sort
  query = query.order('published_at', { ascending: false });

  // Pagination
  const page = options.pagination?.page ?? 1;
  const pageSize = options.pagination?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    return { data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } };
  }

  const articles = (data || []).map((item) => ({
    id: item.id,
    attributes: {
      title: item.title,
      slug: item.slug,
      publishedAt: item.published_at,
      author: item.author,
      coverImage: item.cover_image,
      excerpt: item.excerpt,
      content: item.content,
      tags: item.tags,
    } as Article,
  }));

  return {
    data: articles,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil((count || 0) / pageSize),
        total: count || 0,
      },
    },
  } satisfies StrapiResponse<Article>;
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    title: data.title,
    slug: data.slug,
    publishedAt: data.published_at,
    author: data.author,
    coverImage: data.cover_image,
    excerpt: data.excerpt,
    content: data.content,
    tags: data.tags,
  } as Article;
}

export async function getEvents(options: FetchOptions = {}) {
  let query = supabase.from('events').select('*', { count: 'exact' });

  // Filters
  if (options.filters) {
    if (options.filters.date && typeof options.filters.date === 'object') {
       // Handle date filters like $gte
       const dateFilter = options.filters.date as any;
       if (dateFilter.$gte) {
         query = query.gte('date', dateFilter.$gte);
       }
    }
  }

  // Sort
  query = query.order('date', { ascending: true });

  // Pagination
  const page = options.pagination?.page ?? 1;
  const pageSize = options.pagination?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return { data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } };
  }

  const events = (data || []).map((item) => ({
    id: item.id,
    attributes: {
      title: item.title,
      slug: item.slug,
      date: item.date,
      time: item.time,
      location: item.location,
      coverImage: item.cover_image,
      description: item.description,
      price: item.price,
      status: item.status,
      tags: item.tags,
    } as EventItem,
  }));

  return {
    data: events,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil((count || 0) / pageSize),
        total: count || 0,
      },
    },
  } satisfies StrapiResponse<EventItem>;
}

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    title: data.title,
    slug: data.slug,
    date: data.date,
    time: data.time,
    location: data.location,
    coverImage: data.cover_image,
    description: data.description,
    price: data.price,
    status: data.status,
    tags: data.tags,
  } as EventItem;
}

export function isEventUpcoming(event: EventItem) {
  return dayjs(event.date).isSame(dayjs(), 'day') || dayjs(event.date).isAfter(dayjs(), 'day');
}

