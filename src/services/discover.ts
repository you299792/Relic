import AsyncStorage from '@react-native-async-storage/async-storage';
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

export type DiscoverCategory =
  | 'foryou'
  | 'all'
  | 'trending'
  | 'movies'
  | 'gaming'
  | 'music'
  | 'sports'
  | 'anime'
  | 'celebrity'
  | 'fashion'
  | 'tech'
  | 'design'
  | 'science'
  | 'business'
  | 'world';

export const DISCOVER_CATEGORIES: { key: DiscoverCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies & TV' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'music', label: 'Music' },
  { key: 'sports', label: 'Sports' },
  { key: 'anime', label: 'Anime' },
  { key: 'celebrity', label: 'Celebrity' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'tech', label: 'Tech' },
  { key: 'design', label: 'Design' },
  { key: 'science', label: 'Science' },
  { key: 'business', label: 'Business' },
  { key: 'world', label: 'World' },
  { key: 'foryou', label: 'For you' },
];

export const FALLBACK_TOPICS = ['programming', 'design', 'productivity', 'science'];

const MAX_TOPICS = 5;
const GENERIC_TAGS = new Set(['link', 'note', 'file']);
const DAY = 86400000;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_PREFIX = 'relic:discover:v2:';

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

// ---------- Sources ----------

interface RssSource {
  name: string;
  url: string;
  /** Google News search feed: titles end in " - Publisher" and carry a <source> tag. */
  google?: boolean;
}

/** A Google News search feed (up to 100 recent stories) for the given query. */
function googleNews(query: string, days = 3): RssSource {
  return {
    name: 'Google News',
    google: true,
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${days}d`)}&hl=en-US&gl=US&ceid=US:en`,
  };
}

const RSS_SOURCES: Partial<Record<DiscoverCategory, RssSource[]>> = {
  movies: [
    { name: 'Variety', url: 'https://variety.com/feed/' },
    { name: 'Deadline', url: 'https://deadline.com/feed/' },
    { name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/' },
    googleNews('movie OR "TV series" OR trailer OR Netflix OR HBO'), googleNews('Marvel OR "Star Wars" OR "box office" OR Dexter'),
  ],
  gaming: [
    { name: 'IGN', url: 'https://feeds.ign.com/ign/all' },
    { name: 'GameSpot', url: 'https://www.gamespot.com/feeds/news/' },
    googleNews('"GTA 6" OR "video game" OR PlayStation OR Xbox OR Nintendo'),
  ],
  music: [
    { name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/feed/' },
    { name: 'Pitchfork', url: 'https://pitchfork.com/feed/feed-news/rss' },
    { name: 'Billboard', url: 'https://www.billboard.com/feed/' },
    googleNews('new album OR concert tour OR Grammys OR "music video"', 5),
  ],
  sports: [
    { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
    googleNews('NFL OR NBA OR soccer OR UFC OR Formula 1', 2),
  ],
  anime: [{ name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/all/rss.xml' },
    googleNews('anime OR manga', 5),
  ],
  celebrity: [
    { name: 'Page Six', url: 'https://pagesix.com/feed/' },
    { name: 'TMZ', url: 'https://www.tmz.com/rss.xml' },
    { name: 'E! News', url: 'https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml' },
    googleNews('celebrity OR "red carpet" OR Hollywood', 2),
  ],
  fashion: [
    { name: 'Vogue', url: 'https://www.vogue.com/feed/rss' },
    { name: 'WWD', url: 'https://wwd.com/feed/' },
    { name: 'Fashionista', url: 'https://fashionista.com/.rss/full/' },
    { name: "Harper's Bazaar", url: 'https://www.harpersbazaar.com/rss/all.xml/' },
    googleNews('fashion week OR runway OR streetwear OR designer', 7),
  ],
  tech: [
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    googleNews('AI OR gadgets OR smartphone OR startup', 3),
  ],
  design: [
    { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/' },
    { name: 'Dezeen', url: 'https://www.dezeen.com/feed/' },
  ],
  science: [
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top/science.xml' },
    { name: 'NASA', url: 'https://www.nasa.gov/feed/' },
    { name: 'Nature', url: 'https://www.nature.com/nature.rss' },
    googleNews('science discovery OR space OR research study', 7),
  ],
  business: [
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'NPR Economy', url: 'https://feeds.npr.org/1017/rss.xml' },
    googleNews('stock market OR economy OR earnings', 2),
  ],
  world: [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml' },
    googleNews('world news OR international', 2),
  ],
};

/** Max article age per category; slower-moving topics allow older articles. */
const MAX_AGE_DAYS: Record<DiscoverCategory, number> = {
  foryou: 365,
  all: 7,
  trending: 3,
  movies: 5,
  gaming: 5,
  music: 7,
  sports: 3,
  anime: 7,
  celebrity: 3,
  fashion: 10,
  tech: 7,
  design: 21,
  science: 14,
  business: 5,
  world: 3,
};

async function getText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(url: string, timeoutMs = 10000): Promise<unknown> {
  return JSON.parse(await getText(url, timeoutMs));
}

function toIso(value?: string | null): string | undefined {
  if (!value) return undefined;
  const t = new Date(value.trim()).getTime();
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

// ---------- dev.to ----------

/** `top` is the window in days. With `tagged` false it returns the top articles across all tags. */
async function fetchDevTo(topic: string, label = topic, top = 30, tagged = true): Promise<DiscoverArticle[]> {
  // dev.to tags are single alphanumeric tokens
  const tag = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (tagged && !tag) return [];
  const data = (await getJson(
    `https://dev.to/api/articles?${tagged ? `tag=${encodeURIComponent(tag)}&` : ''}per_page=10&top=${top}`
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
    topic: label,
    publishedAt: a.published_at,
  }));
}

// ---------- Hacker News ----------

function mapHnHits(hits: any[] | undefined, topic: string): DiscoverArticle[] {
  return (hits ?? [])
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

async function fetchHackerNews(topic: string): Promise<DiscoverArticle[]> {
  const since = Math.floor(Date.now() / 1000) - 365 * 86400;
  const data = (await getJson(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=8` +
      `&numericFilters=${encodeURIComponent(`created_at_i>${since},points>20`)}`
  )) as { hits?: any[] };
  return mapHnHits(data.hits, topic);
}

async function fetchHnFrontPage(label: string): Promise<DiscoverArticle[]> {
  const data = (await getJson('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=25')) as {
    hits?: any[];
  };
  return mapHnHits(data.hits, label);
}

async function fetchHnRecent(label: string, days: number, minPoints: number): Promise<DiscoverArticle[]> {
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const data = (await getJson(
    `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=20` +
      `&numericFilters=${encodeURIComponent(`created_at_i>${since},points>${minPoints}`)}`
  )) as { hits?: any[] };
  return mapHnHits(data.hits, label);
}

// ---------- RSS / Atom ----------

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  ndash: '–', mdash: '—', hellip: '…',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isNaN(code) ? m : String.fromCodePoint(code);
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function unwrap(raw: string): string {
  const cdata = raw.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1] : decodeEntities(raw);
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tagText(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? unwrap(m[1]).trim() : undefined;
}

function tagAttr(block: string, tag: string, attr: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}\\s[^>]*?${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return m ? decodeEntities(m[1]) : undefined;
}

function httpUrl(url?: string): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

function parseFeed(xml: string, source: RssSource, topic: string): DiscoverArticle[] {
  const limit = source.google ? 30 : 40;
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const articles: DiscoverArticle[] = [];

  for (const block of blocks.slice(0, limit)) {
    let title = tagText(block, 'title');
    let sourceName = source.name;
    if (source.google) {
      const publisher = tagText(block, 'source');
      if (publisher) {
        sourceName = publisher;
        if (title?.endsWith(` - ${publisher}`)) title = title.slice(0, -(publisher.length + 3));
      }
    }
    let link = tagText(block, 'link');
    if (!link || !/^https?:/i.test(link)) {
      // Atom: <link rel="alternate" href="..."/>
      link = tagAttr(block, 'link', 'href') ?? link;
    }
    if (!title || !link || !/^https?:/i.test(link)) continue;

    const rawBody =
      tagText(block, 'content:encoded') ??
      tagText(block, 'description') ??
      tagText(block, 'summary') ??
      tagText(block, 'content');
    const summary = rawBody ? stripHtml(rawBody).slice(0, 220) : '';

    const enclosure = /image/i.test(tagAttr(block, 'enclosure', 'type') ?? '')
      ? tagAttr(block, 'enclosure', 'url')
      : undefined;
    const image = httpUrl(
      tagAttr(block, 'media:thumbnail', 'url') ??
        tagAttr(block, 'media:content', 'url') ??
        enclosure ??
        (rawBody ? rawBody.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] : undefined)
    );

    articles.push({
      id: `rss-${normalizeUrl(link)}`,
      title: stripHtml(title),
      url: link,
      source: sourceName,
      summary: source.google ? undefined : summary || undefined,
      image,
      tags: [topic.toLowerCase()],
      topic,
      publishedAt: toIso(
        tagText(block, 'pubDate') ?? tagText(block, 'published') ?? tagText(block, 'updated') ?? tagText(block, 'dc:date')
      ),
    });
  }
  return articles;
}

async function fetchRss(source: RssSource, topic: string): Promise<DiscoverArticle[]> {
  return parseFeed(await getText(source.url), source, topic);
}

// ---------- Google Trends ----------

const TRENDS_URL = 'https://trends.google.com/trending/rss?geo=US';

/** Each trending search becomes one article, pointing at its top news story. */
function parseTrends(xml: string, topic: string): DiscoverArticle[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const articles: DiscoverArticle[] = [];

  for (const block of blocks.slice(0, 20)) {
    const query = tagText(block, 'title');
    const newsBlock = block.match(/<ht:news_item>[\s\S]*?<\/ht:news_item>/i)?.[0];
    if (!query || !newsBlock) continue;
    const url = tagText(newsBlock, 'ht:news_item_url');
    const title = tagText(newsBlock, 'ht:news_item_title');
    if (!url || !title || !/^https?:/i.test(url)) continue;

    const traffic = tagText(block, 'ht:approx_traffic');
    articles.push({
      id: `trend-${normalizeUrl(url)}`,
      title: stripHtml(title),
      url,
      source: tagText(newsBlock, 'ht:news_item_source') ?? 'Google Trends',
      summary: `Trending: "${query}"${traffic ? ` · ${traffic} searches` : ''}`,
      image: httpUrl(tagText(newsBlock, 'ht:news_item_picture') ?? tagText(block, 'ht:picture')),
      tags: [query.toLowerCase()],
      topic,
      publishedAt: toIso(tagText(block, 'pubDate')),
    });
  }
  return articles;
}

async function fetchGoogleTrends(topic: string): Promise<DiscoverArticle[]> {
  return parseTrends(await getText(TRENDS_URL), topic);
}

// ---------- Assembly ----------

function labelFor(category: DiscoverCategory): string {
  if (category === 'trending') return 'Trending';
  return DISCOVER_CATEGORIES.find((c) => c.key === category)?.label ?? category;
}

/** Round-robins the lists so sources are mixed, dropping duplicate URLs. */
function interleave(lists: DiscoverArticle[][]): DiscoverArticle[] {
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

function byNewest(list: DiscoverArticle[]): DiscoverArticle[] {
  const time = (a: DiscoverArticle) => (a.publishedAt ? new Date(a.publishedAt).getTime() || 0 : 0);
  return [...list].sort((a, b) => time(b) - time(a));
}

function keepFresh(list: DiscoverArticle[], maxAgeDays: number): DiscoverArticle[] {
  const cutoff = Date.now() - maxAgeDays * DAY;
  return list.filter((a) => {
    const t = a.publishedAt ? new Date(a.publishedAt).getTime() : NaN;
    return Number.isNaN(t) || t >= cutoff;
  });
}

/** Resolves a settled batch into lists; throws only when every request failed (offline). */
function collect(settled: PromiseSettledResult<DiscoverArticle[]>[]): DiscoverArticle[][] {
  if (settled.length > 0 && settled.every((s) => s.status === 'rejected')) {
    throw new Error('Unable to reach the network');
  }
  return settled.map((s) => (s.status === 'fulfilled' ? s.value : []));
}

/** Articles for interest topics or a search query (dev.to + Hacker News). */
export async function fetchDiscoverFeed(topics: string[]): Promise<DiscoverArticle[]> {
  const settled = await Promise.allSettled(topics.flatMap((t) => [fetchDevTo(t), fetchHackerNews(t)]));
  return interleave(collect(settled));
}

async function fetchCategoryLive(category: DiscoverCategory): Promise<DiscoverArticle[]> {
  const label = labelFor(category);
  const rss = (RSS_SOURCES[category] ?? []).map((s) => fetchRss(s, label));
  let jobs: Promise<DiscoverArticle[]>[];

  switch (category) {
    case 'trending':
      jobs = [
        fetchGoogleTrends(label),
        fetchHnFrontPage(label).then((l) => l.slice(0, 8)),
        fetchDevTo('', label, 1, false).then((l) => l.slice(0, 6)),
      ];
      break;
    case 'tech':
      jobs = [...rss, fetchHnRecent(label, 7, 50), fetchDevTo('', label, 7, false)];
      break;
    case 'design':
      jobs = [...rss, fetchDevTo('design', label, 7), fetchDevTo('ux', label, 7), fetchDevTo('css', label, 7)];
      break;
    default:
      jobs = rss;
  }

  const lists = collect(await Promise.allSettled(jobs));
  // Trending sources are already ranked; everything else is sorted newest-first.
  const ordered = category === 'trending' ? lists : lists.map(byNewest);
  return keepFresh(interleave(ordered), MAX_AGE_DAYS[category]);
}

/** Categories merged into the "All" feed: trending plus every chip except All and For you. */
const ALL_SOURCES: DiscoverCategory[] = [
  'trending',
  ...DISCOVER_CATEGORIES.map((c) => c.key).filter((k) => k !== 'all' && k !== 'foryou'),
];

interface CacheEntry {
  at: number;
  articles: DiscoverArticle[];
}

/**
 * Current articles for a category. Cached for 15 minutes; pass `force` to bypass.
 * If the network fails, a stale cache is returned instead of an error.
 */
export async function fetchCategoryFeed(category: DiscoverCategory, force = false): Promise<DiscoverArticle[]> {
  if (category === 'all') {
    // Combine every category (each uses its own cache), mixed round-robin.
    const parts = ALL_SOURCES.map((c) => fetchCategoryFeed(c, force));
    return interleave(collect(await Promise.allSettled(parts)));
  }
  const cacheKey = CACHE_PREFIX + category;
  let cached: CacheEntry | null = null;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw) as CacheEntry;
  } catch {
    cached = null;
  }
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS && cached.articles.length > 0) {
    return cached.articles;
  }

  try {
    const articles = await fetchCategoryLive(category);
    if (articles.length > 0) {
      const entry: CacheEntry = { at: Date.now(), articles };
      AsyncStorage.setItem(cacheKey, JSON.stringify(entry)).catch(() => {});
    }
    return articles;
  } catch (e) {
    if (cached && cached.articles.length > 0) return cached.articles;
    throw e;
  }
}

// ---------- Refresh batches ----------

export const BATCH_SIZE = 10;
/** Below this many unseen articles in the pool, refresh fetches a new pool from the network. */
export const MIN_UNSEEN_FOR_LOCAL_REFRESH = 8;

const SEEN_PREFIX = 'relic:discover:seen:v1:';
const SEEN_LIMIT = 400;

export async function loadSeen(scope: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_PREFIX + scope);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

/** Adds ids to the seen set (in place) and persists the most recent ones. */
export function markSeen(scope: string, seen: Set<string>, ids: string[]): void {
  for (const id of ids) {
    seen.delete(id); // re-insert so the newest ids stay at the end
    seen.add(id);
  }
  const recent = [...seen].slice(-SEEN_LIMIT);
  AsyncStorage.setItem(SEEN_PREFIX + scope, JSON.stringify(recent)).catch(() => {});
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks the next batch from a pool: unseen articles first (in ranked order), topped up
 * with already-seen ones when the pool is nearly exhausted. The batch is lightly shuffled.
 */
export function pickBatch(pool: DiscoverArticle[], seen: Set<string>, size = BATCH_SIZE): DiscoverArticle[] {
  const unseen = pool.filter((a) => !seen.has(a.id));
  const batch = unseen.slice(0, size);
  if (batch.length < size) {
    batch.push(...shuffle(pool.filter((a) => seen.has(a.id))).slice(0, size - batch.length));
  }
  return shuffle(batch);
}

/**
 * Next batch for endless scrolling: pool articles not yet on screen, unseen-before-this-session
 * ones first. Returns an empty list when the pool is exhausted.
 */
export function nextBatch(
  pool: DiscoverArticle[],
  shownIds: Set<string>,
  seen: Set<string>,
  size = BATCH_SIZE
): DiscoverArticle[] {
  const remaining = pool.filter((a) => !shownIds.has(a.id));
  const fresh = remaining.filter((a) => !seen.has(a.id));
  const stale = remaining.filter((a) => seen.has(a.id));
  return [...fresh, ...stale].slice(0, size);
}
