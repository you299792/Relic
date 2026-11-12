import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RelicItem, DuplicateCheckResult, ItemCategory } from '../types/models';
import { checkDuplicateItem } from '../services/duplicate';

const STORAGE_KEY = '@relic_items_archive_v1';

export const INITIAL_ITEMS: RelicItem[] = [
  {
    id: '1',
    type: 'article',
    category: 'link',
    title: 'The Art of Noticing',
    source: 'Medium',
    url: 'https://medium.com/art-of-noticing',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-56',
    note: 'Fascinating read on how paying attention to the small details in life can drastically improve your creativity and overall well-being.',
    tags: ['mindfulness', 'creativity'],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    savedAt: '2 hours ago',
  },
  {
    id: '2',
    type: 'website',
    category: 'link',
    title: 'React Native Reanimated Docs',
    source: 'reactnative.dev',
    url: 'https://docs.swmansion.com/react-native-reanimated',
    image: null,
    imgHeight: 'h-0',
    note: 'Need to dive deep into the shared value API. The new layout animations look incredibly smooth. I should test this with the new collections feature.',
    tags: ['react-native', 'animation'],
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    savedAt: '5 hours ago',
  },
  {
    id: '3',
    type: 'image',
    category: 'file',
    title: 'Minimalist Workspace Setup',
    source: 'Dribbble',
    fileName: 'minimal_workspace.jpg',
    fileSize: 2450000,
    mimeType: 'image/jpeg',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-64',
    note: 'Love the warm lighting and the wooden desk texture here. Great inspiration for my next desk setup.',
    tags: ['workspace', 'design'],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    savedAt: 'Yesterday',
  },
  {
    id: '4',
    type: 'article',
    category: 'link',
    title: 'SQLite Performance',
    source: 'dev.to',
    url: 'https://dev.to/sqlite-performance-guide',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-40',
    note: 'Crucial for Relic: Remember to use indexes on foreign keys and use FTS5 for full-text search.',
    tags: ['database', 'sqlite'],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    savedAt: 'Yesterday',
  },
  {
    id: '5',
    type: 'image',
    category: 'file',
    title: 'Kyoto, Japan',
    source: 'Unsplash',
    fileName: 'kyoto_street.jpg',
    fileSize: 3200000,
    mimeType: 'image/jpeg',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-72',
    note: 'A beautiful quiet street. Adding this to the travel itinerary for next spring. The architecture is incredible.',
    tags: ['travel', 'japan'],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    savedAt: '2 days ago',
  },
];

// In-memory cache + listeners to notify all mounted hooks across screens
let inMemoryItems: RelicItem[] | null = null;
const listeners = new Set<(items: RelicItem[]) => void>();

function notifyListeners(items: RelicItem[]) {
  listeners.forEach((listener) => listener(items));
}

export function useItems() {
  const [items, setItems] = useState<RelicItem[]>(() => inMemoryItems || INITIAL_ITEMS);
  const [loading, setLoading] = useState<boolean>(() => !inMemoryItems);

  useEffect(() => {
    let isMounted = true;

    const listener = (newItems: RelicItem[]) => {
      if (isMounted) setItems(newItems);
    };
    listeners.add(listener);

    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: RelicItem[] = JSON.parse(stored);
          inMemoryItems = parsed;
          if (isMounted) setItems(parsed);
        } else {
          inMemoryItems = INITIAL_ITEMS;
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ITEMS));
          if (isMounted) setItems(INITIAL_ITEMS);
        }
      } catch (err) {
        console.error('Failed to load items from storage:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!inMemoryItems) {
      load();
    }

    return () => {
      isMounted = false;
      listeners.delete(listener);
    };
  }, []);

  const checkDuplicate = useCallback(
    (candidate: {
      category: ItemCategory;
      title: string;
      url?: string;
      note?: string;
      fileName?: string | null;
      fileSize?: number | null;
    }): DuplicateCheckResult => {
      const currentList = inMemoryItems || items;
      return checkDuplicateItem(candidate, currentList);
    },
    [items]
  );

  const addItem = useCallback(
    async (
      data: {
        category: ItemCategory;
        title: string;
        source?: string;
        url?: string;
        note?: string;
        image?: string | null;
        fileUri?: string | null;
        fileName?: string | null;
        fileSize?: number | null;
        mimeType?: string | null;
        tags?: string[];
      },
      options: { allowDuplicate?: boolean } = {}
    ): Promise<{
      success: boolean;
      duplicate?: DuplicateCheckResult;
      item?: RelicItem;
      error?: string;
    }> => {
      const currentList = inMemoryItems || items;

      if (!options.allowDuplicate) {
        const duplicateResult = checkDuplicateItem(data, currentList);
        if (duplicateResult.isDuplicate) {
          return {
            success: false,
            duplicate: duplicateResult,
            error: duplicateResult.reason,
          };
        }
      }

      // Determine appropriate display type
      let resolvedType: RelicItem['type'] = 'link';
      if (data.category === 'note') {
        resolvedType = 'note';
      } else if (data.category === 'file') {
        if (data.mimeType?.startsWith('image') || data.image) {
          resolvedType = 'image';
        } else if (data.mimeType?.startsWith('video')) {
          resolvedType = 'video';
        } else {
          resolvedType = 'file';
        }
      } else {
        resolvedType = data.url?.includes('medium') || data.url?.includes('dev.to') ? 'article' : 'website';
      }

      const newItem: RelicItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        type: resolvedType,
        category: data.category,
        title: data.title.trim(),
        source: data.source || (data.category === 'link' ? (data.url ? new URL(data.url).hostname.replace('www.', '') : 'Web') : data.category === 'note' ? 'Quick Note' : 'Local File'),
        url: data.url,
        note: data.note,
        image: data.image || null,
        imgHeight: data.image ? 'h-56' : 'h-0',
        fileUri: data.fileUri || null,
        fileName: data.fileName || null,
        fileSize: data.fileSize || null,
        mimeType: data.mimeType || null,
        tags: data.tags && data.tags.length > 0 ? data.tags : [data.category],
        createdAt: new Date().toISOString(),
        savedAt: 'Just now',
      };

      const updated = [newItem, ...currentList];
      inMemoryItems = updated;
      notifyListeners(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist items:', err);
      }

      return {
        success: true,
        item: newItem,
      };
    },
    [items]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const currentList = inMemoryItems || items;
      const updated = currentList.filter((item) => item.id !== id);
      inMemoryItems = updated;
      notifyListeners(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    },
    [items]
  );

  return {
    items,
    loading,
    addItem,
    deleteItem,
    checkDuplicate,
  };
}
