import { supabase, supabaseAdmin } from './supabase';
import dayjs from 'dayjs';
import { sampleArticles } from './dataFallback';

// ==================== FILE STORAGE ====================

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - Storage bucket name ('audio' or 'press')
 * @returns Upload result with public URL
 */
export async function uploadFile(file: File, bucket: 'audio' | 'press'): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    console.error('Upload exception:', err);
    return { success: false, error: 'Errore durante l\'upload del file' };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - The public URL of the file to delete
 * @param bucket - Storage bucket name ('audio' or 'press')
 */
export async function deleteStorageFile(fileUrl: string, bucket: 'audio' | 'press'): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
    if (pathParts.length < 2) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return false;
    }
    const filePath = decodeURIComponent(pathParts[1]);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete exception:', err);
    return false;
  }
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

export async function getAllComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all comments:', error);
    return [];
  }
  return data as Comment[];
}

export async function deleteComment(id: number) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
  return true;
}

export async function getComments(slug: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_slug', slug)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return data as Comment[];
}

export async function addComment(comment: Omit<Comment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
  return data[0] as Comment;
}

export async function getArticleStats(slug: string) {
  const { data, error } = await supabase
    .from('article_stats')
    .select('*')
    .eq('article_slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    console.error('Error fetching article stats:', error);
  }
  return data as ArticleStats | null;
}

export async function getAllArticleStats() {
  const { data, error } = await supabase
    .from('article_stats')
    .select('*');

  if (error) {
    console.error('Error fetching all article stats:', error);
    return [];
  }
  return data as ArticleStats[];
}

export async function getEventRSVPs(slug: string) {
  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_slug', slug);

  if (error) {
    console.error('Error fetching event RSVPs:', error);
    return [];
  }
  return data as EventRSVP[];
}

export async function addEventRSVP(rsvp: Omit<EventRSVP, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('event_rsvps')
    .insert([rsvp])
    .select();

  if (error) {
    console.error('Error adding event RSVP:', error);
    throw error;
  }
  return data[0] as EventRSVP;
}

export async function getEventStats(slug: string) {
  const { data, error } = await supabase
    .from('event_stats')
    .select('*')
    .eq('event_slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching event stats:', error);
  }
  return data as EventStats | null;
}


export async function getArticles(options: FetchOptions = {}) {
  let query = supabase.from('articles').select('*', { count: 'exact' });

  // Filter out drafts
  query = query.not('published_at', 'is', null);

  // Filters
  if (options.filters) {
    if (options.filters.slug) {
      query = query.eq('slug', options.filters.slug);
    }
    // Handle tag filter - tags is a JSONB array in Supabase
    if (options.filters.tags && typeof options.filters.tags === 'object') {
      const tagFilter = options.filters.tags as { $containsi?: string };
      if (tagFilter.$containsi) {
        query = query.contains('tags', [tagFilter.$containsi]);
      }
    }
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
    .not('published_at', 'is', null)
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

// ==================== PRESS (Rassegna Stampa) ====================

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
  const { data, error } = await supabase
    .from('press')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching press items:', error);
    return [];
  }
  return data as PressItem[];
}

export async function getPressItem(id: number) {
  const { data, error } = await supabase
    .from('press')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching press item:', error);
    return null;
  }
  return data as PressItem;
}

export async function createPressItem(item: Omit<PressItem, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('press')
    .insert([item])
    .select();

  if (error) {
    console.error('Error creating press item:', error);
    throw error;
  }
  return data[0] as PressItem;
}

export async function updatePressItem(id: number, item: Partial<PressItem>) {
  const { data, error } = await supabaseAdmin
    .from('press')
    .update(item)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating press item:', error);
    throw error;
  }
  return data[0] as PressItem;
}

export async function deletePressItem(id: number) {
  const { error } = await supabaseAdmin
    .from('press')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting press item:', error);
    return false;
  }
  return true;
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
  const { data, error } = await supabase
    .from('audio_pillole')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching audio pillole:', error);
    return [];
  }
  return data as AudioPillola[];
}

export async function getAudioPillola(id: number) {
  const { data, error } = await supabase
    .from('audio_pillole')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching audio pillola:', error);
    return null;
  }
  return data as AudioPillola;
}

export async function createAudioPillola(item: Omit<AudioPillola, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('audio_pillole')
    .insert([item])
    .select();

  if (error) {
    console.error('Error creating audio pillola:', error);
    throw error;
  }
  return data[0] as AudioPillola;
}

export async function updateAudioPillola(id: number, item: Partial<AudioPillola>) {
  const { data, error } = await supabaseAdmin
    .from('audio_pillole')
    .update(item)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating audio pillola:', error);
    throw error;
  }
  return data[0] as AudioPillola;
}

export async function deleteAudioPillola(id: number) {
  const { error } = await supabaseAdmin
    .from('audio_pillole')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting audio pillola:', error);
    return false;
  }
  return true;
}

