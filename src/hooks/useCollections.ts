import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Collection } from '../types/models';

const STORAGE_KEY = '@relic_collections_v1';

export const COLLECTION_COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#EF4444',
];

let inMemory: Collection[] | null = null;
const listeners = new Set<(c: Collection[]) => void>();

function publish(next: Collection[]) {
  inMemory = next;
  listeners.forEach((l) => l(next));
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
    console.error('Failed to persist collections:', err)
  );
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(() => inMemory ?? []);
  const [loading, setLoading] = useState(() => !inMemory);

  useEffect(() => {
    let mounted = true;
    const listener = (c: Collection[]) => mounted && setCollections(c);
    listeners.add(listener);

    if (!inMemory) {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((stored) => {
          const parsed: Collection[] = stored ? JSON.parse(stored) : [];
          inMemory = parsed;
          if (mounted) setCollections(parsed);
        })
        .catch((err) => console.error('Failed to load collections:', err))
        .finally(() => mounted && setLoading(false));
    }

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const addCollection = useCallback(
    (name: string, color: string, parentId: string | null = null): Collection | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const created: Collection = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      name: trimmed,
      color,
      parentId,
      createdAt: new Date().toISOString(),
    };
    publish([created, ...(inMemory ?? [])]);
    return created;
    },
    []
  );

  /** Deletes a folder and all folders nested in it. Returns every removed id. */
  const deleteCollection = useCallback((id: string): string[] => {
    const all = inMemory ?? [];
    const removed = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of all) {
        if (c.parentId && removed.has(c.parentId) && !removed.has(c.id)) {
          removed.add(c.id);
          grew = true;
        }
      }
    }
    publish(all.filter((c) => !removed.has(c.id)));
    return [...removed];
  }, []);

  return { collections, loading, addCollection, deleteCollection };
}
