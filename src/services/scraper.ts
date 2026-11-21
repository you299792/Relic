const imageCache = new Map<string, string | null>();

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagFirst = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
      'i'
    );
    const contentFirst = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
      'i'
    );
    const match = html.match(tagFirst) ?? html.match(contentFirst);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return null;
}

/** Reads a page's preview image (og:image / twitter:image). Returns null when unavailable. */
export async function fetchPreviewImage(pageUrl: string, timeoutMs = 8000): Promise<string | null> {
  if (imageCache.has(pageUrl)) return imageCache.get(pageUrl) ?? null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let image: string | null = null;

  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 (compatible; RelicApp/1.0)' },
    });
    if (res.ok && (res.headers.get('content-type') ?? '').includes('html')) {
      const html = (await res.text()).slice(0, 200000);
      const found = metaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
      if (found) {
        try {
          const resolved = new URL(found, pageUrl).toString();
          if (/^https?:/i.test(resolved)) image = resolved;
        } catch {
          // ignore malformed URL
        }
      }
    }
  } catch {
    // network error, timeout or blocked: no preview image
  } finally {
    clearTimeout(timer);
  }

  imageCache.set(pageUrl, image);
  return image;
}
