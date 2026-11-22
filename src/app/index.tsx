import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { withFrom } from '../utils/nav';
import {
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Folder,
  Tag,
  Network,
} from 'lucide-react-native';
import { useItems } from '../hooks/useItems';
import { useCollections } from '../hooks/useCollections';
import { ItemFeed, FeedStat } from '../components/items/item-feed';

export default function DashboardScreen() {
  const router = useRouter();
  const { items, deleteItem } = useItems();
  const { collections } = useCollections();

  // Dynamic stats calculated from real items
  const stats = useMemo<FeedStat[]>(() => {
    const linksCount = items.filter((i) => i.category === 'link').length;
    const mediaCount = items.filter(
      (i) => i.category === 'file' || i.type === 'image' || i.type === 'video' || !!i.image
    ).length;
    const notesCount = items.filter((i) => i.category === 'note').length;

    const allTags = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => allTags.add(t)));

    return [
      { id: '1', label: 'Total Items', count: items.length, icon: FileText, color: '#6366F1' },
      { id: '2', label: 'Collections', count: collections.length, icon: Folder, color: '#F59E0B' },
      { id: '3', label: 'Links', count: linksCount, icon: LinkIcon, color: '#10B981' },
      { id: '4', label: 'Media', count: mediaCount, icon: ImageIcon, color: '#EC4899' },
      { id: '5', label: 'Notes', count: notesCount, icon: FileText, color: '#8B5CF6' },
      { id: '6', label: 'Tags', count: allTags.size, icon: Tag, color: '#06B6D4' },
      { id: '7', label: 'Relationships', count: 18, icon: Network, color: '#3B82F6' },
    ];
  }, [items, collections.length]);

  return (
    <ItemFeed
      title="Relic"
      subtitle="Your personal archive"
      items={items}
      stats={stats}
      onDeleteItem={deleteItem}
      onAdd={() => router.push(withFrom('/item/create', '/'))}
    />
  );
}
