export type ItemCategory = 'link' | 'note' | 'file';

export interface RelicItem {
  id: string;
  type: 'link' | 'note' | 'file' | 'article' | 'website' | 'image' | 'video';
  category: ItemCategory;
  title: string;
  source?: string;
  url?: string;
  note?: string;
  image?: string | null;
  imgHeight?: string;
  fileUri?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  tags: string[];
  collectionId?: string | null;
  createdAt: string;
  savedAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedItem?: RelicItem;
  reason?: string;
}
