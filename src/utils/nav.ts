import type { Href } from 'expo-router';

/**
 * Builds a route that remembers where the user came from, so the destination
 * screen can send them back to exactly that screen (tab history is unreliable).
 */
export function withFrom(path: string, from: string, extra: Record<string, string> = {}): Href {
  const params = new URLSearchParams({ ...extra, from });
  return `${path}?${params.toString()}` as Href;
}
