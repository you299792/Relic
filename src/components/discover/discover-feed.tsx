import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { Bookmark, BookmarkCheck, RefreshCw, WifiOff, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import { useItems, INITIAL_ITEMS } from '../../hooks/useItems';
import { normalizeUrl } from '../../services/duplicate';
import { fetchPreviewImage } from '../../services/scraper';
import { timeAgo } from '../../utils/date';
import {
  buildInterests,
  fetchDiscoverFeed,
  fetchCategoryFeed,
  DiscoverArticle,
  DiscoverCategory,
  DISCOVER_CATEGORIES,
  FALLBACK_TOPICS,
  MIN_UNSEEN_FOR_LOCAL_REFRESH,
  loadSeen,
  markSeen,
  pickBatch,
} from '../../services/discover';

const SAMPLE_IDS = new Set(INITIAL_ITEMS.map((i) => i.id));

const softShadow = {
  shadowColor: '#64748B',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

function FeedImage({ uri, pending }: { uri: string | null; pending: boolean }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && failedUri !== uri;

  if (showImage) {
    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', height: 208, backgroundColor: '#E2E8F0' }}
        resizeMode="cover"
        onError={(e) => {
          console.warn('Feed image failed to load:', uri, e.nativeEvent?.error);
          setFailedUri(uri);
        }}
      />
    );
  }

  return (
    <View style={{ width: '100%', height: 112, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
      {pending ? <ActivityIndicator color="#A5B4FC" /> : <ImageIcon size={28} color="#A5B4FC" />}
    </View>
  );
}

interface DiscoverFeedProps {
  /** When set, shows web results for this text instead of interest-based topics. */
  query?: string;
}

interface FeedResult {
  key: string;
  /** Full pool fetched for this feed. */
  articles: DiscoverArticle[];
  /** The slice of the pool currently shown. */
  batch: DiscoverArticle[];
  failed: boolean;
}

export function DiscoverFeed({ query }: DiscoverFeedProps) {
  const { items, addItem } = useItems();
  const [interests, setInterests] = useState(() => buildInterests(items, SAMPLE_IDS));
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<FeedResult | null>(null);
  const [category, setCategory] = useState<DiscoverCategory>('all');
  const forceRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [previewDone, setPreviewDone] = useState<Set<string>>(new Set());

  const trimmedQuery = query?.trim() ?? '';
  const personalized = !trimmedQuery && category === 'foryou';
  const usingFallback = personalized && interests.length === 0;
  const topics = useMemo(
    () => (trimmedQuery ? [trimmedQuery] : interests.length > 0 ? interests : FALLBACK_TOPICS),
    [trimmedQuery, interests]
  );
  const scope = personalized ? 'foryou' : category;
  const requestKey = trimmedQuery
    ? `q:${trimmedQuery}#${reloadToken}`
    : personalized
      ? `foryou:${topics.join('|')}#${reloadToken}`
      : `${category}#${reloadToken}`;

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;
    const request =
      trimmedQuery || personalized ? fetchDiscoverFeed(topics) : fetchCategoryFeed(category, force);
    // Debounce typing so we don't fire a request per keystroke
    const timer = setTimeout(
      () => {
        request
          .then(async (articles) => {
            let batch = articles;
            if (!trimmedQuery) {
              const seen = await loadSeen(scope);
              batch = pickBatch(articles, seen);
              markSeen(scope, seen, batch.map((a) => a.id));
              seenRef.current = seen;
            }
            if (!cancelled) setResult({ key: requestKey, articles, batch, failed: false });
          })
          .catch(() => {
            if (!cancelled) setResult({ key: requestKey, articles: [], batch: [], failed: true });
          });
      },
      trimmedQuery ? 500 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [topics, requestKey, trimmedQuery, personalized, category, scope]);

  const loading = !result || result.key !== requestKey;
  const articles = useMemo(() => (!loading ? result.batch : []), [loading, result]);
  const failed = !loading && result.failed;

  // Fetch preview images for articles that came without one (e.g. Hacker News links)
  useEffect(() => {
    const missing = articles.filter((a) => !a.image);
    if (missing.length === 0) return;
    let cancelled = false;
    let next = 0;

    const worker = async () => {
      while (!cancelled && next < missing.length) {
        const article = missing[next++];
        const image = await fetchPreviewImage(article.url);
        if (cancelled) return;
        if (image) setPreviewImages((prev) => ({ ...prev, [article.id]: image }));
        setPreviewDone((prev) => new Set(prev).add(article.id));
      }
    };
    Promise.all([worker(), worker(), worker(), worker()]);

    return () => {
      cancelled = true;
    };
  }, [articles]);

  const savedUrls = useMemo(
    () => new Set(items.filter((i) => i.url).map((i) => normalizeUrl(i.url!))),
    [items]
  );

  const visible = articles;

  const refresh = () => {
    // Show the next unseen articles from the pool we already have; no network needed.
    if (!trimmedQuery && !loading && !failed && result) {
      const unseen = result.articles.filter((a) => !seenRef.current.has(a.id));
      if (unseen.length >= MIN_UNSEEN_FOR_LOCAL_REFRESH) {
        const batch = pickBatch(result.articles, seenRef.current);
        markSeen(scope, seenRef.current, batch.map((a) => a.id));
        setResult({ ...result, batch });
        return;
      }
    }
    // Pool exhausted (or search / failed): fetch fresh articles from the network.
    if (personalized) setInterests(buildInterests(items, SAMPLE_IDS));
    forceRef.current = true;
    setReloadToken((n) => n + 1);
  };

  const handleSave = async (article: DiscoverArticle) => {
    setSavingIds((prev) => new Set(prev).add(article.id));
    try {
      await addItem(
        {
          category: 'link',
          title: article.title,
          url: article.url,
          source: article.source,
          note: article.summary,
          image: article.image ?? previewImages[article.id] ?? null,
          tags: [...new Set([article.topic.toLowerCase(), ...article.tags.map((t) => t.toLowerCase())])].slice(0, 4),
        },
        { allowDuplicate: false }
      );
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(article.id);
        return next;
      });
    }
  };

  const categoryLabel = DISCOVER_CATEGORIES.find((c) => c.key === category)?.label ?? 'Discover';
  const heading = trimmedQuery ? 'From the web' : personalized ? 'Discover for you' : categoryLabel;
  const subheading = trimmedQuery
    ? `Articles matching "${trimmedQuery}"`
    : personalized
      ? usingFallback
        ? 'Popular reads. Save a few items and this feed will match your interests.'
        : 'Based on what you save'
      : 'Fresh from the web';

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <Sparkles color="#6366F1" size={20} />
          <Text className="text-slate-800 text-lg font-bold">{heading}</Text>
        </View>
        <TouchableOpacity
          onPress={refresh}
          hitSlop={8}
          className="bg-white w-9 h-9 rounded-full items-center justify-center"
          style={softShadow}
          accessibilityLabel="Refresh feed"
        >
          <RefreshCw color="#64748B" size={16} />
        </TouchableOpacity>
      </View>
      <Text className="text-slate-500 text-xs mb-4">{subheading}</Text>

      {!trimmedQuery && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-5" contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {DISCOVER_CATEGORIES.map((c) => {
            const isActive = category === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                className={`px-3.5 py-2 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-indigo-50'}`}
              >
                <Text className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-indigo-600'}`}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#6366F1" />
        </View>
      ) : failed ? (
        <View className="bg-white rounded-3xl p-8 items-center" style={softShadow}>
          <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3">
            <WifiOff color="#94A3B8" size={24} />
          </View>
          <Text className="text-slate-800 text-base font-bold mb-1">{"You're offline"}</Text>
          <Text className="text-slate-500 text-xs text-center mb-4">
            Connect to the internet to see articles from the web.
          </Text>
          <TouchableOpacity onPress={refresh} className="bg-indigo-600 px-5 py-2.5 rounded-full">
            <Text className="text-white text-sm font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : visible.length === 0 ? (
        <View className="bg-white rounded-3xl p-8 items-center" style={softShadow}>
          <Text className="text-slate-800 text-base font-bold mb-1">No articles found</Text>
          <Text className="text-slate-500 text-xs text-center">Try another category or search term.</Text>
        </View>
      ) : (
        visible.map((article) => {
          const saved = savedUrls.has(normalizeUrl(article.url));
          const saving = savingIds.has(article.id);
          const image = article.image ?? previewImages[article.id] ?? null;
          const age = timeAgo(article.publishedAt);
          return (
            <TouchableOpacity
              key={article.id}
              onPress={() => Linking.openURL(article.url).catch(() => {})}
              activeOpacity={0.9}
              className="bg-white rounded-[24px] mb-5 overflow-hidden"
              style={softShadow}
            >
              <FeedImage uri={image} pending={!image && !previewDone.has(article.id)} />
              <View className="px-4 pt-4 pb-3">
                <Text className="text-slate-900 text-lg font-bold leading-snug mb-2" numberOfLines={3}>
                  {article.title}
                </Text>
                {article.summary ? (
                  <Text className="text-slate-500 text-xs leading-relaxed mb-3" numberOfLines={2}>
                    {article.summary}
                  </Text>
                ) : null}
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-2">
                    <Text className="text-indigo-600 text-[11px] font-extrabold">
                      {article.source.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-slate-600 text-xs font-semibold flex-shrink" numberOfLines={1}>
                    {article.source}
                  </Text>
                  {age ? <Text className="text-slate-400 text-xs ml-1.5">{`· ${age}`}</Text> : null}
                  <View className="flex-1" />
                  <TouchableOpacity
                    onPress={() => handleSave(article)}
                    disabled={saved || saving}
                    hitSlop={8}
                    activeOpacity={0.7}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    accessibilityLabel={saved ? 'Saved' : 'Save to Relic'}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#6366F1" />
                    ) : saved ? (
                      <BookmarkCheck size={22} color="#4F46E5" fill="#E0E7FF" />
                    ) : (
                      <Bookmark size={22} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
