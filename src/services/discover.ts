import { RelicItem } from '../types/models';
import { normalizeUrl } from './duplicate';

export interface DiscoverArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  summary?: string;
  image?: string | null;
  tags: string[];
  topic: string;
  publishedAt?: string;
}

export const FALLBACK_TOPICS = ['programming', 'design', 'productivity', 'science'];

const MAX_TOPICS = 5;
const GENERIC_TAGS = new Set(['link', 'note', 'file']);

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'was', 'but', 'not',
  'have', 'has', 'how', 'why', 'what', 'when', 'into', 'about', 'over', 'out', 'its', 'our',
  'new', 'use', 'using', 'guide', 'docs', 'note', 'notes', 'article', 'link', 'file', 'image',
  'video', 'just', 'need', 'some', 'more', 'than', 'then', 'them', 'they', 'will', 'can', 'all',
  'one', 'get', 'any', 'been', 'also', 'very', 'great', 'good', 'like', 'love', 'here', 'there',
]);

function words(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/**
 * Ranks topics from the user's saved items. Tags count most, title words less,
 * note words least; newer items weigh more. `ignoreIds` skips the bundled sample items.
 */
export function buildInterests(items: RelicItem[], ignoreIds: Set<string> = new Set()): string[] {
  const scores = new Map<string, number>();
  const add = (term: string, weight: number) => scores.set(term, (scores.get(term) ?? 0) + weight);
  const now = Date.now();

  for (const item of items) {
    if (ignoreIds.has(item.id)) continue;
    const created = item.createdAt ? new Date(item.createdAt).getTime() : now;
    const ageDays = Math.max(0, (now - (Number.isNaN(created) ? now : created)) / 86400000);
    const recency = 1 + 1 / (1 + ageDays / 7);

    for (const tag of item.tags ?? []) {
      const t = tag.trim().toLowerCase();
      if (t && !GENERIC_TAGS.has(t)) add(t, 3 * recency);
    }
    for (const w of words(item.title)) add(w, 1 * recency);
    for (const w of words(item.note)) add(w, 0.4 * recency);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOPICS)
    .map(([term]) => term);
}

async function getJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDevTo(topic: string): Promise<DiscoverArticle[]> {
  // dev.to tags are single alphanumeric tokens
  const tag = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!tag) return [];
  const data = (await getJson(
    `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=8&top=30`
  )) as any[];
  return (Array.isArray(data) ? data : []).map((a) => ({
    id: `devto-${a.id}`,
    title: String(a.title ?? ''),
    url: String(a.url ?? ''),
    source: 'dev.to',
    summary: a.description || undefined,
    image: a.cover_image || a.social_image || null,
    tags: Array.isArray(a.tag_list)
      ? a.tag_list.slice(0, 4)
      : typeof a.tags === 'string'
        ? a.tags.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 4)
        : [],
    topic,
    publishedAt: a.published_at,
  }));
}

async function fetchHackerNews(topic: string): Promise<DiscoverArticle[]> {
  const since = Math.floor(Date.now() / 1000) - 365 * 86400;
  const data = (await getJson(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=8` +
      `&numericFilters=${encodeURIComponent(`created_at_i>${since},points>20`)}`
  )) as { hits?: any[] };
  return (data.hits ?? [])
    .filter((h) => h.url && h.title)
    .map((h) => {
      let host = 'Hacker News';
      try {
        host = new URL(h.url).hostname.replace(/^www\./, '');
      } catch {
        // keep default
      }
      return {
        id: `hn-${h.objectID}`,
        title: String(h.title),
        url: String(h.url),
        source: host,
        summary: undefined,
        image: null,
        tags: [topic.toLowerCase().replace(/\s+/g, '-')],
        topic,
        publishedAt: h.created_at,
      };
    });
}

/**
 * Fetches articles for each topic from dev.to and Hacker News, interleaved so
 * topics and sources are mixed. Throws only when every request failed (offline).
 */
export async function fetchDiscoverFeed(topics: string[]): Promise<DiscoverArticle[]> {
  const jobs = topics.flatMap((t) => [fetchDevTo(t), fetchHackerNews(t)]);
  const settled = await Promise.allSettled(jobs);

  if (settled.every((s) => s.status === 'rejected')) {
    throw new Error('Unable to reach the network');
  }

  const lists = settled.map((s) => (s.status === 'fulfilled' ? s.value : []));
  const seen = new Set<string>();
  const feed: DiscoverArticle[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));

  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const article = list[i];
      if (!article || !article.url) continue;
      const key = normalizeUrl(article.url);
      if (seen.has(key)) continue;
      seen.add(key);
      feed.push(article);
    }
  }
  return feed;
}
