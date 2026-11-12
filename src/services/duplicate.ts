import { DuplicateCheckResult, RelicItem } from '../types/models';

/**
 * Normalizes a URL for comparison:
 * - strips protocol (http://, https://)
 * - removes 'www.'
 * - removes trailing slash
 * - converts to lowercase
 * - strips hash and trailing query if needed
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    let clean = rawUrl.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '');
    clean = clean.replace(/^www\./, '');
    clean = clean.replace(/\/+$/, '');
    return clean;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Normalizes text content for duplicate detection:
 * - trims whitespace
 * - collapses multiple spaces/newlines
 * - converts to lowercase
 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether an incoming item duplicates any existing item in the collection.
 */
export function checkDuplicateItem(
  candidate: {
    category: 'link' | 'note' | 'file';
    title: string;
    url?: string;
    note?: string;
    fileName?: string | null;
    fileSize?: number | null;
  },
  existingItems: RelicItem[]
): DuplicateCheckResult {
  const normTitle = normalizeText(candidate.title || '');

  for (const existing of existingItems) {
    // 1. Link Duplicate Detection
    if (candidate.category === 'link') {
      const candidateUrl = candidate.url ? normalizeUrl(candidate.url) : '';
      const existingUrl = existing.url ? normalizeUrl(existing.url) : '';

      if (candidateUrl && existingUrl && candidateUrl === existingUrl) {
        return {
          isDuplicate: true,
          matchedItem: existing,
          reason: `A link with the URL "${existing.url}" already exists ("${existing.title}").`,
        };
      }

      if (normTitle && normalizeText(existing.title) === normTitle && existing.category === 'link') {
        return {
          isDuplicate: true,
          matchedItem: existing,
          reason: `A link with the title "${existing.title}" already exists.`,
        };
      }
    }

    // 2. Note Duplicate Detection
    if (candidate.category === 'note') {
      const candidateContent = candidate.note ? normalizeText(candidate.note) : '';
      const existingContent = existing.note ? normalizeText(existing.note) : '';

      if (
        candidateContent &&
        existingContent &&
        candidateContent.length > 10 &&
        candidateContent === existingContent
      ) {
        return {
          isDuplicate: true,
          matchedItem: existing,
          reason: `A note with identical content already exists ("${existing.title}").`,
        };
      }

      if (normTitle && normalizeText(existing.title) === normTitle && existing.category === 'note') {
        return {
          isDuplicate: true,
          matchedItem: existing,
          reason: `A note titled "${existing.title}" already exists.`,
        };
      }
    }

    // 3. Local File Duplicate Detection
    if (candidate.category === 'file') {
      const candFileName = candidate.fileName?.trim().toLowerCase();
      const existFileName = existing.fileName?.trim().toLowerCase();

      if (candFileName && existFileName && candFileName === existFileName) {
        if (
          candidate.fileSize &&
          existing.fileSize &&
          candidate.fileSize === existing.fileSize
        ) {
          return {
            isDuplicate: true,
            matchedItem: existing,
            reason: `A file with name "${existing.fileName}" and same size already exists ("${existing.title}").`,
          };
        }
        return {
          isDuplicate: true,
          matchedItem: existing,
          reason: `A file named "${existing.fileName}" has already been added ("${existing.title}").`,
        };
      }

      if (normTitle && normalizeText(existing.title) === normTitle && existing.category === 'file') {
        return {
          isDuplicate: true,
          matchedItem: existing,
          reason: `A file item titled "${existing.title}" already exists.`,
        };
      }
    }
  }

  return { isDuplicate: false };
}
