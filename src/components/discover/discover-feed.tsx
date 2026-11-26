import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  WifiOff,
  Sparkles,
  Image as ImageIcon,
  ArrowUp,
} from 'lucide-react-native';
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
  nextBatch,
  pickBatch,
} from '../../services/discover';

const SAMPLE_IDS = new Set(INITIAL_ITEMS.map((i) => i.id));
const SHOW_TOP_AFTER_PX = 900;

const softShadow = {
  shadowColor: '#64748B',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

// ---------- Lazy preview images ----------

// Cards only mount near the viewport, so previews are fetched on demand. A small
// queue keeps the number of simultaneous page fetches low.
const MAX_PREVIEW_JOBS = 3;
let activePreviewJobs = 0;
const previewQueue: (() => void)[] = [];

function runPreviewJob<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      activePreviewJobs++;
      job()
        .then(resolve, reject)
        .finally(() => {
          activePreviewJobs--;
          previewQueue.shift()?.();
        });
    };
    if (activePreviewJobs < MAX_PREVIEW_JOBS) start();
    else previewQueue.push(start);
  });
}

function FeedImage({ uri, pending }: { uri: string | null; pending: boolean }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && failedUri !== uri;

  if (showImage) {
    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', height: 208, backgroundColor: '#E2E8F0' }}
        contentFit="cover"
        transition={150}
        recyclingKey={uri}
        onError={() => setFailedUri(uri)}
      />
    );
  }

  return (
    <View style={{ width: '100%', height: 112, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
      {pending ? <ActivityIndicator color="#A5B4FC" /> : <ImageIcon size={28} color="#A5B4FC" />}
    </View>
  );
}

interface ArticleCardProps {
  article: DiscoverArticle;
  saved: boolean;
  saving: boolean;
  onSave: (article: DiscoverArticle, image: string | null) => void;
}

const ArticleCard = memo(function ArticleCard({ article, saved, saving, onSave }: ArticleCardProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [previewDone, setPreviewDone] = useState(false);
  // Google News links are redirect pages with no preview image to find
  const canPreview = !article.image && !/(^|\.)news\.google\.com/i.test(article.url);

  useEffect(() => {
    if (!canPreview) return;
    let cancelled = false;
    runPreviewJob(() => fetchPreviewImage(article.url))
      .then((image) => {
        if (cancelled) return;
        setPreview(image);
        setPreviewDone(true);
      })
      .catch(() => {
        if (!cancelled) setPreviewDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [canPreview, article.url]);

  const image = article.image ?? preview;
  const age = timeAgo(article.publishedAt);

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(article.url).catch(() => {})}
      activeOpacity={0.9}
      className="bg-white rounded-[24px] mb-5 overflow-hidden"
      style={softShadow}
    >
      <FeedImage uri={image} pending={canPreview && !previewDone && !image} />
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
            <Text className="text-indigo-600 text-[11px] font-extrabold">{article.source.charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="text-slate-600 text-xs font-semibold flex-shrink" numberOfLines={1}>
            {article.source}
          </Text>
          {age ? <Text className="text-slate-400 text-xs ml-1.5">{`· ${age}`}</Text> : null}
          <View className="flex-1" />
          <TouchableOpacity
            onPress={() => onSave(article, image)}
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
});

// ---------- Feed ----------

interface DiscoverFeedProps {
  /** When set, shows web results for this text instead of the category feeds. */
  query?: string;
  /** Rendered at the top of the scrolling list, above the feed heading. */
  header?: React.ReactNode;
}

interface FeedResult {
  key: string;
  /** Full pool fetched for this feed. */
  articles: DiscoverArticle[];
  failed: boolean;
}

export function DiscoverFeed({ query, header }: DiscoverFeedProps) {
  const { items, addItem } = useItems();
  const [interests, setInterests] = useState(() => buildInterests(items, SAMPLE_IDS));
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<FeedResult | null>(null);
  const [shown, setShown] = useState<DiscoverArticle[]>([]);
  const [category, setCategory] = useState<DiscoverCategory>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const forceRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const shownRef = useRef<DiscoverArticle[]>([]);
  const loadingMoreRef = useRef(false);
  const keyRef = useRef('');
  const listRef = useRef<FlatList<DiscoverArticle>>(null);

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
    keyRef.current = requestKey;
  }, [requestKey]);

  const showArticles = useCallback((list: DiscoverArticle[]) => {
    shownRef.current = list;
    setShown(list);
  }, []);

  /** Fetches a fresh pool for the current feed. `force` bypasses the category cache. */
  const fetchPool = useCallback(
    (force: boolean) =>
      trimmedQuery || personalized ? fetchDiscoverFeed(topics) : fetchCategoryFeed(category, force),
    [trimmedQuery, personalized, topics, category]
  );

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;
    // Debounce typing so we don't fire a request per keystroke
    const timer = setTimeout(
      () => {
        fetchPool(force)
          .then(async (articles) => {
            // Search results aren't tracked as "seen"; feed articles are
            const seen = trimmedQuery ? new Set<string>() : await loadSeen(scope);
            const batch = pickBatch(articles, seen);
            if (!trimmedQuery) markSeen(scope, seen, batch.map((a) => a.id));
            if (cancelled) return;
            seenRef.current = seen;
            showArticles(batch);
            setDone(false);
            setResult({ key: requestKey, articles, failed: false });
          })
          .catch(() => {
            if (cancelled) return;
            showArticles([]);
            setResult({ key: requestKey, articles: [], failed: true });
          });
      },
      trimmedQuery ? 500 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchPool, requestKey, trimmedQuery, scope, showArticles]);

  const loading = !result || result.key !== requestKey;
  const failed = !loading && result.failed;
  const visible = loading ? [] : shown;

  const savedUrls = useMemo(
    () => new Set(items.filter((i) => i.url).map((i) => normalizeUrl(i.url!))),
    [items]
  );

  const scrollToTop = useCallback(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowTop(e.nativeEvent.contentOffset.y > SHOW_TOP_AFTER_PX);
  }, []);

  /** Appends the next batch when the user nears the bottom; refetches when the pool runs out. */
  const loadMore = useCallback(async () => {
    if (loading || failed || done || !result || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const key = keyRef.current;
    try {
      const shownIds = new Set(shownRef.current.map((a) => a.id));
      let next = nextBatch(result.articles, shownIds, seenRef.current);

      if (next.length === 0 && !trimmedQuery) {
        try {
          const fresh = await fetchPool(true);
          if (keyRef.current !== key) return;
          setResult({ key, articles: fresh, failed: false });
          next = nextBatch(fresh, shownIds, seenRef.current);
        } catch {
          // keep what we have
        }
      }
      if (keyRef.current !== key) return;
      if (next.length === 0) {
        setDone(true);
      } else {
        if (!trimmedQuery) markSeen(scope, seenRef.current, next.map((a) => a.id));
        showArticles([...shownRef.current, ...next]);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, failed, done, result, trimmedQuery, scope, fetchPool, showArticles]);

  const refresh = () => {
    scrollToTop();
    // Show the next unseen articles from the pool we already have; no network needed.
    if (!trimmedQuery && !loading && !failed && result) {
      const unseen = result.articles.filter((a) => !seenRef.current.has(a.id));
      if (unseen.length >= MIN_UNSEEN_FOR_LOCAL_REFRESH) {
        const batch = pickBatch(result.articles, seenRef.current);
        markSeen(scope, seenRef.current, batch.map((a) => a.id));
        showArticles(batch);
        setDone(false);
        return;
      }
    }
    // Pool exhausted (or search / failed): fetch fresh articles from the network.
    if (personalized) setInterests(buildInterests(items, SAMPLE_IDS));
    forceRef.current = true;
    setReloadToken((n) => n + 1);
  };

  const handleSave = useCallback(
    async (article: DiscoverArticle, image: string | null) => {
      setSavingIds((prev) => new Set(prev).add(article.id));
      try {
        await addItem(
          {
            category: 'link',
            title: article.title,
            url: article.url,
            source: article.source,
            note: article.summary,
            image: article.image ?? image ?? null,
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
    },
    [addItem]
  );

  const renderItem = useCallback(
    ({ item }: { item: DiscoverArticle }) => (
      <ArticleCard
        article={item}
        saved={savedUrls.has(normalizeUrl(item.url))}
        saving={savingIds.has(item.id)}
        onSave={handleSave}
      />
    ),
    [savedUrls, savingIds, handleSave]
  );

  const categoryLabel = DISCOVER_CATEGORIES.find((c) => c.key === category)?.label ?? 'Discover';
  const heading = trimmedQuery ? 'From the web' : personalized ? 'Discover for you' : categoryLabel;
  const subheading = trimmedQuery
    ? `Articles matching "${trimmedQuery}"`
    : personalized
      ? usingFallback
        ? 'Popular reads. Save a few items and this feed will match your interests.'
        : 'Based on what you save'
      : 'Fresh from the web';

  const listHeader = (
    <View>
      {header}
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 -mx-5"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
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
    </View>
  );

  const listEmpty = loading ? (
    <View className="items-center py-10">
      <ActivityIndicator color="#6366F1" />
    </View>
  ) : failed ? (
    <View className="bg-white rounded-3xl p-8 items-center" style={softShadow}>
      <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3">
        <WifiOff color="#94A3B8" size={24} />
      </View>
      <Text className="text-slate-800 text-base font-bold mb-1">{"You're offline"}</Text>
      <Text className="text-slate-500 text-xs text-center mb-4">Connect to the internet to see articles from the web.</Text>
      <TouchableOpacity onPress={refresh} className="bg-indigo-600 px-5 py-2.5 rounded-full">
        <Text className="text-white text-sm font-semibold">Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View className="bg-white rounded-3xl p-8 items-center" style={softShadow}>
      <Text className="text-slate-800 text-base font-bold mb-1">No articles found</Text>
      <Text className="text-slate-500 text-xs text-center">Try another category or search term.</Text>
    </View>
  );

  const listFooter =
    visible.length === 0 ? undefined : loadingMore ? (
      <View className="items-center py-6">
        <ActivityIndicator color="#6366F1" />
      </View>
    ) : done ? (
      <View className="items-center py-6">
        <Text className="text-slate-400 text-xs mb-3">{"You're all caught up"}</Text>
        <TouchableOpacity onPress={refresh} className="bg-indigo-50 px-5 py-2.5 rounded-full">
          <Text className="text-indigo-600 text-xs font-semibold">Check for new articles</Text>
        </TouchableOpacity>
      </View>
    ) : undefined;

  return (
    <View className="flex-1">
      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        onScroll={onScroll}
        scrollEventThrottle={100}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      />
      {showTop && (
        <TouchableOpacity
          onPress={scrollToTop}
          activeOpacity={0.85}
          accessibilityLabel="Back to top"
          className="absolute right-5 bottom-28 w-12 h-12 rounded-full bg-indigo-600 items-center justify-center"
          style={softShadow}
        >
          <ArrowUp color="#FFFFFF" size={22} />
        </TouchableOpacity>
      )}
    </View>
  );
}
