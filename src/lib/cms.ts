import dayjs from 'dayjs';
import { sql } from './db';
import { uploadToR2, deleteFromR2, type FileCategory } from './r2';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const runtimeCache = new Map<string, CacheEntry<unknown>>();

/** TTL for list/home CMS queries */
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | undefined {
  const entry = runtimeCache.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    runtimeCache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
  runtimeCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCmsCache() {
  runtimeCache.clear();
}

function normalizeSearchQuery(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const safe = trimmed
    .slice(0, 80)
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return safe || undefined;
}

// ==================== FILE STORAGE ====================

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function uploadFile(file: File, bucket: FileCategory): Promise<UploadResult> {
  const result = await uploadToR2(file, bucket);
  return {
    success: result.success,
    url: result.url,
    error: result.error,
  };
}

export async function deleteStorageFile(fileUrl: string, _bucket?: FileCategory): Promise<boolean> {
  return deleteFromR2(fileUrl);
}

/**
 * Get audio duration from file (client-side only)
 */
export function getAudioDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      const minutes = Math.floor(audio.duration / 60);
      const seconds = Math.floor(audio.duration % 60);
      resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    audio.onerror = () => resolve('');
    audio.src = URL.createObjectURL(file);
  });
}

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
  pdfUrl?: string;
  description?: string;
  price?: string;
  status?: 'upcoming' | 'past';
  tags?: string[];
};

export type Comment = {
  id: number;
  article_slug: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
};

export type EventRSVP = {
  id: number;
  event_slug: string;
  user_name: string;
  status: 'attending' | 'not_attending';
  created_at: string;
};

export type ArticleStats = {
  article_slug: string;
  comment_count: number;
  average_rating: number;
};

export type EventStats = {
  event_slug: string;
  attending_count: number;
  not_attending_count: number;
};

export type Testimonial = {
  id: number;
  author_name: string;
  author_role?: string;
  quote: string;
  rating?: number;
  is_published: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export async function getAllComments() {
  try {
    const data = await sql`
      SELECT * FROM comments ORDER BY created_at DESC
    `;
    return data as unknown as Comment[];
  } catch (error) {
    console.error('Error fetching all comments:', error);
    return [];
  }
}

export async function deleteComment(id: number) {
  try {
    await sql`DELETE FROM comments WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

export async function getComments(slug: string) {
  try {
    const data = await sql`
      SELECT * FROM comments
      WHERE article_slug = ${slug}
      ORDER BY created_at DESC
    `;
    return data as unknown as Comment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function addComment(comment: Omit<Comment, 'id' | 'created_at'>) {
  const data = await sql`
    INSERT INTO comments (article_slug, user_name, rating, content)
    VALUES (${comment.article_slug}, ${comment.user_name}, ${comment.rating}, ${comment.content})
    RETURNING *
  `;
  return data[0] as unknown as Comment;
}

export async function getArticleStats(slug: string) {
  try {
    const data = await sql`
      SELECT * FROM article_stats WHERE article_slug = ${slug} LIMIT 1
    `;
    return (data[0] as unknown as ArticleStats) ?? null;
  } catch (error) {
    console.error('Error fetching article stats:', error);
    return null;
  }
}

export async function getAllArticleStats() {
  try {
    const data = await sql`SELECT * FROM article_stats`;
    return data as unknown as ArticleStats[];
  } catch (error) {
    console.error('Error fetching all article stats:', error);
    return [];
  }
}

export async function getArticleStatsForSlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs)).filter(Boolean);
  if (uniqueSlugs.length === 0) return [] as ArticleStats[];

  try {
    const data = await sql`
      SELECT * FROM article_stats WHERE article_slug = ANY(${uniqueSlugs})
    `;
    return data as unknown as ArticleStats[];
  } catch (error) {
    console.error('Error fetching article stats by slugs:', error);
    return [];
  }
}

export async function getUniqueArticleTags() {
  const cacheKey = 'articles:tags:v1';
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await sql`
      SELECT DISTINCT unnest(tags) AS tag
      FROM articles
      WHERE published_at IS NOT NULL AND tags IS NOT NULL
      ORDER BY tag
    `;
    const tags = data.map((row: any) => row.tag).filter((t: unknown) => typeof t === 'string' && t.trim());
    setCached(cacheKey, tags, 10 * 60 * 1000);
    return tags;
  } catch (error) {
    console.error('Error fetching article tags:', error);
    return [] as string[];
  }
}

export async function getEventRSVPs(slug: string) {
  try {
    const data = await sql`
      SELECT * FROM event_rsvps WHERE event_slug = ${slug}
    `;
    return data as unknown as EventRSVP[];
  } catch (error) {
    console.error('Error fetching event RSVPs:', error);
    return [];
  }
}

export async function addEventRSVP(rsvp: Omit<EventRSVP, 'id' | 'created_at'> & { user_email?: string }) {
  const data = await sql`
    INSERT INTO event_rsvps (event_slug, user_name, user_email, status)
    VALUES (${rsvp.event_slug}, ${rsvp.user_name}, ${(rsvp as any).user_email ?? null}, ${rsvp.status})
    RETURNING *
  `;
  return data[0] as unknown as EventRSVP;
}

export async function getEventStats(slug: string) {
  try {
    const data = await sql`
      SELECT * FROM event_stats WHERE event_slug = ${slug} LIMIT 1
    `;
    return (data[0] as unknown as EventStats) ?? null;
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return null;
  }
}

export async function getArticles(options: FetchOptions = {}) {
  const cacheKey = `articles:list:v1:${JSON.stringify(options)}`;
  const cached = getCached<StrapiResponse<Article>>(cacheKey);
  if (cached) return cached;

  const page = options.pagination?.page ?? 1;
  const pageSize = options.pagination?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  try {
    const slugFilter = options.filters?.slug as string | undefined;
    const search = normalizeSearchQuery((options.filters as any)?.q);
    const tagFilter = (options.filters?.tags as { $containsi?: string } | undefined)?.$containsi;
    const searchPattern = search ? `%${search}%` : null;

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS __total
      FROM articles
      WHERE published_at IS NOT NULL
        AND (${slugFilter ?? null}::text IS NULL OR slug = ${slugFilter ?? null})
        AND (
          ${searchPattern}::text IS NULL
          OR title ILIKE ${searchPattern}
          OR excerpt ILIKE ${searchPattern}
          OR content ILIKE ${searchPattern}
        )
        AND (
          ${tagFilter ?? null}::text IS NULL
          OR tags @> ARRAY[${tagFilter ?? null}]::text[]
        )
      ORDER BY published_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number((rows[0] as any).__total) : 0;

    const articles = rows.map((item: any) => ({
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

    const result = {
      data: articles,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      },
    } satisfies StrapiResponse<Article>;

    setCached(cacheKey, result, LIST_CACHE_TTL_MS);
    return result;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } };
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const data = await sql`
      SELECT * FROM articles
      WHERE slug = ${slug} AND published_at IS NOT NULL
      LIMIT 1
    `;
    const row = data[0] as any;
    if (!row) return null;

    return {
      title: row.title,
      slug: row.slug,
      publishedAt: row.published_at,
      author: row.author,
      coverImage: row.cover_image,
      excerpt: row.excerpt,
      content: row.content,
      tags: row.tags,
    } as Article;
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    return null;
  }
}

export async function getEvents(options: FetchOptions = {}) {
  const cacheKey = `events:list:v1:${JSON.stringify(options)}`;
  const cached = getCached<StrapiResponse<EventItem>>(cacheKey);
  if (cached) return cached;

  const page = options.pagination?.page ?? 1;
  const pageSize = options.pagination?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  try {
    const dateFilter = options.filters?.date as Record<string, string> | undefined;
    const gte = dateFilter?.$gte ?? null;
    const gt = dateFilter?.$gt ?? null;
    const lte = dateFilter?.$lte ?? null;
    const lt = dateFilter?.$lt ?? null;
    const tagFilter = ((options.filters as any)?.tags as { $containsi?: string } | undefined)?.$containsi;

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS __total
      FROM events
      WHERE (${gte}::timestamptz IS NULL OR date >= ${gte}::timestamptz)
        AND (${gt}::timestamptz IS NULL OR date > ${gt}::timestamptz)
        AND (${lte}::timestamptz IS NULL OR date <= ${lte}::timestamptz)
        AND (${lt}::timestamptz IS NULL OR date < ${lt}::timestamptz)
        AND (
          ${tagFilter ?? null}::text IS NULL
          OR tags @> ARRAY[${tagFilter ?? null}]::text[]
        )
      ORDER BY date ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number((rows[0] as any).__total) : 0;

    const events = rows.map((item: any) => ({
      id: item.id,
      attributes: {
        title: item.title,
        slug: item.slug,
        date: item.date,
        time: item.time,
        location: item.location,
        coverImage: item.cover_image,
        pdfUrl: item.pdf_url,
        description: item.description,
        price: item.price,
        status: item.status,
        tags: item.tags,
      } as EventItem,
    }));

    const result = {
      data: events,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      },
    } satisfies StrapiResponse<EventItem>;

    setCached(cacheKey, result, LIST_CACHE_TTL_MS);
    return result;
  } catch (error) {
    console.error('Error fetching events:', error);
    return { data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } };
  }
}

export async function getUniqueEventTags() {
  const cacheKey = 'events:tags:v1';
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await sql`
      SELECT DISTINCT unnest(tags) AS tag
      FROM events
      WHERE tags IS NOT NULL
      ORDER BY tag
    `;
    const tags = data.map((row: any) => row.tag).filter((t: unknown) => typeof t === 'string' && t.trim());
    setCached(cacheKey, tags, 10 * 60 * 1000);
    return tags;
  } catch (error) {
    console.error('Error fetching event tags:', error);
    return [] as string[];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const data = await sql`
      SELECT * FROM events WHERE slug = ${slug} LIMIT 1
    `;
    const row = data[0] as any;
    if (!row) return null;

    return {
      title: row.title,
      slug: row.slug,
      date: row.date,
      time: row.time,
      location: row.location,
      coverImage: row.cover_image,
      pdfUrl: row.pdf_url,
      description: row.description,
      price: row.price,
      status: row.status,
      tags: row.tags,
    } as EventItem;
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    return null;
  }
}

export function isEventUpcoming(event: EventItem) {
  return dayjs(event.date).isSame(dayjs(), 'day') || dayjs(event.date).isAfter(dayjs(), 'day');
}

// ==================== PRESS ====================

export type PressItem = {
  id?: number;
  title: string;
  testata: string;
  published_at: string;
  file_url: string;
  description?: string;
  created_at?: string;
};

export async function getPressItems() {
  try {
    const data = await sql`SELECT * FROM press ORDER BY published_at DESC`;
    return data as unknown as PressItem[];
  } catch (error) {
    console.error('Error fetching press items:', error);
    return [];
  }
}

export async function getLatestPressItems(limit: number = 3) {
  const cacheKey = `press:latest:v1:${limit}`;
  const cached = getCached<PressItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await sql`
      SELECT * FROM press ORDER BY published_at DESC LIMIT ${limit}
    `;
    const items = data as unknown as PressItem[];
    setCached(cacheKey, items, LIST_CACHE_TTL_MS);
    return items;
  } catch (error) {
    console.error('Error fetching latest press items:', error);
    return [];
  }
}

export async function getPressItem(id: number) {
  try {
    const data = await sql`SELECT * FROM press WHERE id = ${id} LIMIT 1`;
    return (data[0] as unknown as PressItem) ?? null;
  } catch (error) {
    console.error('Error fetching press item:', error);
    return null;
  }
}

export async function createPressItem(item: Omit<PressItem, 'id' | 'created_at'>) {
  const data = await sql`
    INSERT INTO press (title, testata, description, file_url, published_at)
    VALUES (${item.title}, ${item.testata}, ${item.description ?? null}, ${item.file_url}, ${item.published_at})
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as PressItem;
}

export async function updatePressItem(id: number, item: Partial<PressItem>) {
  const data = await sql`
    UPDATE press SET
      title = COALESCE(${item.title ?? null}, title),
      testata = COALESCE(${item.testata ?? null}, testata),
      description = COALESCE(${item.description ?? null}, description),
      file_url = COALESCE(${item.file_url ?? null}, file_url),
      published_at = COALESCE(${item.published_at ?? null}, published_at)
    WHERE id = ${id}
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as PressItem;
}

export async function deletePressItem(id: number) {
  try {
    await sql`DELETE FROM press WHERE id = ${id}`;
    clearCmsCache();
    return true;
  } catch (error) {
    console.error('Error deleting press item:', error);
    return false;
  }
}

// ==================== AUDIO PILLOLE ====================

export type AudioPillola = {
  id?: number;
  title: string;
  description?: string;
  file_url: string;
  duration?: string;
  published_at: string;
  created_at?: string;
};

export async function getAudioPillole() {
  try {
    const data = await sql`SELECT * FROM audio_pillole ORDER BY published_at DESC`;
    return data as unknown as AudioPillola[];
  } catch (error) {
    console.error('Error fetching audio pillole:', error);
    return [];
  }
}

export async function getLatestAudioPillole(limit: number = 3) {
  const cacheKey = `audio:latest:v1:${limit}`;
  const cached = getCached<AudioPillola[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await sql`
      SELECT * FROM audio_pillole ORDER BY published_at DESC LIMIT ${limit}
    `;
    const items = data as unknown as AudioPillola[];
    setCached(cacheKey, items, LIST_CACHE_TTL_MS);
    return items;
  } catch (error) {
    console.error('Error fetching latest audio pillole:', error);
    return [];
  }
}

export type TestimonialRow = {
  id: number;
  author_name: string;
  content: string;
  rating?: number;
  is_published: boolean;
  display_order?: number;
  created_at?: string;
};

export async function getPublishedTestimonials() {
  const cacheKey = 'testimonials:published:v1';
  const cached = getCached<TestimonialRow[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await sql`
      SELECT * FROM testimonials
      WHERE is_published = true
      ORDER BY display_order DESC, created_at DESC
    `;
    const rows = (data as any[]).map((row) => ({
      id: row.id,
      author_name: row.author_name,
      content: row.quote,
      rating: row.rating,
      is_published: row.is_published,
      display_order: row.display_order,
      created_at: row.created_at,
    })) as TestimonialRow[];
    setCached(cacheKey, rows, LIST_CACHE_TTL_MS);
    return rows;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export async function getAudioPillola(id: number) {
  try {
    const data = await sql`SELECT * FROM audio_pillole WHERE id = ${id} LIMIT 1`;
    return (data[0] as unknown as AudioPillola) ?? null;
  } catch (error) {
    console.error('Error fetching audio pillola:', error);
    return null;
  }
}

export async function createAudioPillola(item: Omit<AudioPillola, 'id' | 'created_at'>) {
  const data = await sql`
    INSERT INTO audio_pillole (title, description, file_url, duration, published_at)
    VALUES (${item.title}, ${item.description ?? null}, ${item.file_url}, ${item.duration ?? null}, ${item.published_at})
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as AudioPillola;
}

export async function updateAudioPillola(id: number, item: Partial<AudioPillola>) {
  const data = await sql`
    UPDATE audio_pillole SET
      title = COALESCE(${item.title ?? null}, title),
      description = COALESCE(${item.description ?? null}, description),
      file_url = COALESCE(${item.file_url ?? null}, file_url),
      duration = COALESCE(${item.duration ?? null}, duration),
      published_at = COALESCE(${item.published_at ?? null}, published_at)
    WHERE id = ${id}
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as AudioPillola;
}

export async function deleteAudioPillola(id: number) {
  try {
    await sql`DELETE FROM audio_pillole WHERE id = ${id}`;
    clearCmsCache();
    return true;
  } catch (error) {
    console.error('Error deleting audio pillola:', error);
    return false;
  }
}

// ==================== PODCAST ====================

export type Podcast = {
  id?: number;
  title: string;
  description?: string;
  file_url: string;
  duration?: string;
  published_at: string;
  created_at?: string;
};

export async function getPodcasts() {
  try {
    const data = await sql`SELECT * FROM podcasts ORDER BY published_at DESC`;
    return data as unknown as Podcast[];
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
}

export async function getPodcast(id: number) {
  try {
    const data = await sql`SELECT * FROM podcasts WHERE id = ${id} LIMIT 1`;
    return (data[0] as unknown as Podcast) ?? null;
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return null;
  }
}

export async function createPodcast(item: Omit<Podcast, 'id' | 'created_at'>) {
  const data = await sql`
    INSERT INTO podcasts (title, description, file_url, duration, published_at)
    VALUES (${item.title}, ${item.description ?? null}, ${item.file_url}, ${item.duration ?? null}, ${item.published_at})
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as Podcast;
}

export async function updatePodcast(id: number, item: Partial<Podcast>) {
  const data = await sql`
    UPDATE podcasts SET
      title = COALESCE(${item.title ?? null}, title),
      description = COALESCE(${item.description ?? null}, description),
      file_url = COALESCE(${item.file_url ?? null}, file_url),
      duration = COALESCE(${item.duration ?? null}, duration),
      published_at = COALESCE(${item.published_at ?? null}, published_at)
    WHERE id = ${id}
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as Podcast;
}

export async function deletePodcast(id: number) {
  try {
    await sql`DELETE FROM podcasts WHERE id = ${id}`;
    clearCmsCache();
    return true;
  } catch (error) {
    console.error('Error deleting podcast:', error);
    return false;
  }
}

// ==================== TESTIMONIALS ====================

export async function getAllTestimonials(publishedOnly: boolean = false) {
  try {
    const data = publishedOnly
      ? await sql`
          SELECT * FROM testimonials
          WHERE is_published = true
          ORDER BY display_order DESC, created_at DESC
        `
      : await sql`
          SELECT * FROM testimonials
          ORDER BY display_order DESC, created_at DESC
        `;
    return data as unknown as Testimonial[];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export async function getFeaturedTestimonials() {
  try {
    const data = await sql`
      SELECT * FROM testimonials
      WHERE is_published = true AND featured = true
      ORDER BY display_order DESC, created_at DESC
    `;
    return data as unknown as Testimonial[];
  } catch (error) {
    console.error('Error fetching featured testimonials:', error);
    return [];
  }
}

export async function getTestimonialById(id: number) {
  try {
    const data = await sql`SELECT * FROM testimonials WHERE id = ${id} LIMIT 1`;
    return (data[0] as unknown as Testimonial) ?? null;
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return null;
  }
}

export async function createTestimonial(item: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>) {
  const data = await sql`
    INSERT INTO testimonials (author_name, author_role, quote, rating, is_published, featured, display_order)
    VALUES (
      ${item.author_name},
      ${item.author_role ?? null},
      ${item.quote},
      ${item.rating ?? null},
      ${item.is_published ?? false},
      ${item.featured ?? false},
      ${item.display_order ?? 0}
    )
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as Testimonial;
}

export async function updateTestimonial(id: number, item: Partial<Testimonial>) {
  const data = await sql`
    UPDATE testimonials SET
      author_name = COALESCE(${item.author_name ?? null}, author_name),
      author_role = COALESCE(${item.author_role ?? null}, author_role),
      quote = COALESCE(${item.quote ?? null}, quote),
      rating = COALESCE(${item.rating ?? null}, rating),
      is_published = COALESCE(${item.is_published ?? null}, is_published),
      featured = COALESCE(${item.featured ?? null}, featured),
      display_order = COALESCE(${item.display_order ?? null}, display_order)
    WHERE id = ${id}
    RETURNING *
  `;
  clearCmsCache();
  return data[0] as unknown as Testimonial;
}

export async function deleteTestimonial(id: number) {
  try {
    await sql`DELETE FROM testimonials WHERE id = ${id}`;
    clearCmsCache();
    return true;
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return false;
  }
}

// ==================== ARTICLES / EVENTS admin helpers ====================

export async function getAllArticlesAdmin() {
  try {
    return await sql`SELECT * FROM articles ORDER BY published_at DESC NULLS LAST, created_at DESC`;
  } catch (error) {
    console.error('Error fetching all articles:', error);
    return [];
  }
}

export async function getArticleById(id: number) {
  try {
    const data = await sql`SELECT * FROM articles WHERE id = ${id} LIMIT 1`;
    return data[0] ?? null;
  } catch (error) {
    console.error('Error fetching article by id:', error);
    return null;
  }
}

export async function createArticle(item: {
  title: string;
  slug: string;
  published_at?: string | null;
  author?: string | null;
  cover_image?: string | null;
  excerpt?: string | null;
  content?: string | null;
  tags?: string[] | null;
}) {
  const data = await sql`
    INSERT INTO articles (title, slug, published_at, author, cover_image, excerpt, content, tags)
    VALUES (
      ${item.title},
      ${item.slug},
      ${item.published_at ?? null},
      ${item.author ?? null},
      ${item.cover_image ?? null},
      ${item.excerpt ?? null},
      ${item.content ?? null},
      ${item.tags ?? null}
    )
    RETURNING *
  `;
  clearCmsCache();
  return data[0];
}

export async function updateArticle(id: number, item: Record<string, unknown>) {
  const data = await sql`
    UPDATE articles SET
      title = COALESCE(${(item.title as string) ?? null}, title),
      slug = COALESCE(${(item.slug as string) ?? null}, slug),
      published_at = COALESCE(${(item.published_at as string) ?? null}, published_at),
      author = COALESCE(${(item.author as string) ?? null}, author),
      cover_image = COALESCE(${(item.cover_image as string) ?? null}, cover_image),
      excerpt = COALESCE(${(item.excerpt as string) ?? null}, excerpt),
      content = COALESCE(${(item.content as string) ?? null}, content),
      tags = COALESCE(${(item.tags as string[]) ?? null}, tags)
    WHERE id = ${id}
    RETURNING *
  `;
  clearCmsCache();
  return data[0];
}

export async function deleteArticle(id: number) {
  try {
    await sql`DELETE FROM articles WHERE id = ${id}`;
    clearCmsCache();
    return true;
  } catch (error) {
    console.error('Error deleting article:', error);
    return false;
  }
}

export async function getAllEventsAdmin() {
  try {
    return await sql`SELECT * FROM events ORDER BY date DESC NULLS LAST, created_at DESC`;
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
}

export async function getEventById(id: number) {
  try {
    const data = await sql`SELECT * FROM events WHERE id = ${id} LIMIT 1`;
    return data[0] ?? null;
  } catch (error) {
    console.error('Error fetching event by id:', error);
    return null;
  }
}

export async function createEvent(item: {
  title: string;
  slug: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  cover_image?: string | null;
  pdf_url?: string | null;
  description?: string | null;
  price?: string | null;
  status?: string | null;
  tags?: string[] | null;
}) {
  const data = await sql`
    INSERT INTO events (title, slug, date, time, location, cover_image, pdf_url, description, price, status, tags)
    VALUES (
      ${item.title},
      ${item.slug},
      ${item.date ?? null},
      ${item.time ?? null},
      ${item.location ?? null},
      ${item.cover_image ?? null},
      ${item.pdf_url ?? null},
      ${item.description ?? null},
      ${item.price ?? null},
      ${item.status ?? null},
      ${item.tags ?? null}
    )
    RETURNING *
  `;
  clearCmsCache();
  return data[0];
}

export async function updateEvent(id: number, item: Record<string, unknown>) {
  const data = await sql`
    UPDATE events SET
      title = COALESCE(${(item.title as string) ?? null}, title),
      slug = COALESCE(${(item.slug as string) ?? null}, slug),
      date = COALESCE(${(item.date as string) ?? null}, date),
      time = COALESCE(${(item.time as string) ?? null}, time),
      location = COALESCE(${(item.location as string) ?? null}, location),
      cover_image = COALESCE(${(item.cover_image as string) ?? null}, cover_image),
      pdf_url = COALESCE(${(item.pdf_url as string) ?? null}, pdf_url),
      description = COALESCE(${(item.description as string) ?? null}, description),
      price = COALESCE(${(item.price as string) ?? null}, price),
      status = COALESCE(${(item.status as string) ?? null}, status),
      tags = COALESCE(${(item.tags as string[]) ?? null}, tags)
    WHERE id = ${id}
    RETURNING *
  `;
  clearCmsCache();
  return data[0];
}

export async function deleteEvent(id: number) {
  try {
    await sql`DELETE FROM events WHERE id = ${id}`;
    clearCmsCache();
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}
