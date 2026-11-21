import React, { useState, useMemo } from 'react';
import { 
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Link as LinkIcon,
  FileText,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Folder,
  Tag,
  Network,
  HardDrive,
  Video,
  ArrowUpDown,
  Check,
} from 'lucide-react-native';
import { useItems } from '../hooks/useItems';
import { FAB } from '../components/ui/fab';
import { ItemMenu } from '../components/items/item-menu';
import { VideoThumbnail } from '../components/items/video-player';
import { RelicItem } from '../types/models';

const isVideoItem = (item: RelicItem) =>
  !!item.fileUri && (item.type === 'video' || !!item.mimeType?.startsWith('video'));

const FILTERS = ['All', 'Articles', 'Images', 'Notes', 'Videos'];

type SortKey =
  | 'newest'
  | 'oldest'
  | 'title-asc'
  | 'title-desc'
  | 'size-desc'
  | 'size-asc'
  | 'type'
  | 'source';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest to oldest' },
  { key: 'oldest', label: 'Oldest to newest' },
  { key: 'title-asc', label: 'Title (A to Z)' },
  { key: 'title-desc', label: 'Title (Z to A)' },
  { key: 'size-desc', label: 'Size (largest first)' },
  { key: 'size-asc', label: 'Size (smallest first)' },
  { key: 'type', label: 'Type' },
  { key: 'source', label: 'Source' },
];

const createdTime = (i: RelicItem) => {
  const t = i.createdAt ? new Date(i.createdAt).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

function sortItems(list: RelicItem[], key: SortKey): RelicItem[] {
  const byTitle = (a: RelicItem, b: RelicItem) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
  const sorted = [...list];
  switch (key) {
    case 'oldest':
      return sorted.sort((a, b) => createdTime(a) - createdTime(b));
    case 'title-asc':
      return sorted.sort(byTitle);
    case 'title-desc':
      return sorted.sort((a, b) => byTitle(b, a));
    case 'size-desc':
      return sorted.sort((a, b) => (b.fileSize ?? 0) - (a.fileSize ?? 0) || byTitle(a, b));
    case 'size-asc':
      return sorted.sort((a, b) => (a.fileSize ?? 0) - (b.fileSize ?? 0) || byTitle(a, b));
    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type) || byTitle(a, b));
    case 'source':
      return sorted.sort(
        (a, b) => (a.source ?? '').localeCompare(b.source ?? '', undefined, { sensitivity: 'base' }) || byTitle(a, b)
      );
    case 'newest':
    default:
      return sorted.sort((a, b) => createdTime(b) - createdTime(a));
  }
}

function filterByActive(items: RelicItem[], activeFilter: string): RelicItem[] {
  if (activeFilter === 'Articles') {
    return items.filter((i) => i.type === 'article' || (i.category === 'link' && !i.image));
  }
  if (activeFilter === 'Images') {
    return items.filter((i) => i.type === 'image' || (i.image && !i.mimeType?.startsWith('video')));
  }
  if (activeFilter === 'Notes') {
    return items.filter((i) => i.category === 'note' || i.type === 'note');
  }
  if (activeFilter === 'Videos') {
    return items.filter((i) => i.type === 'video' || i.mimeType?.startsWith('video'));
  }
  return items;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { items, deleteItem } = useItems();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('All');

  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Filter by activeFilter, then sort
  const filteredItems = useMemo(
    () => sortItems(filterByActive(items, activeFilter), sortKey),
    [items, activeFilter, sortKey]
  );

  const leftColumnData = filteredItems.filter((_, index) => index % 2 === 0);
  const rightColumnData = filteredItems.filter((_, index) => index % 2 !== 0);

  // Dynamic stats calculated from real items
  const stats = useMemo(() => {
    const totalCount = items.length;
    const linksCount = items.filter((i) => i.category === 'link').length;
    const mediaCount = items.filter(
      (i) => i.category === 'file' || i.type === 'image' || i.type === 'video' || !!i.image
    ).length;
    const notesCount = items.filter((i) => i.category === 'note').length;
    
    // Unique tags
    const allTags = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => allTags.add(t)));

    return [
      { id: '1', label: 'Total Items', count: totalCount, icon: FileText, color: '#6366F1' },
      { id: '2', label: 'Collections', count: 8, icon: Folder, color: '#F59E0B' },
      { id: '3', label: 'Links', count: linksCount, icon: LinkIcon, color: '#10B981' },
      { id: '4', label: 'Media', count: mediaCount, icon: ImageIcon, color: '#EC4899' },
      { id: '5', label: 'Notes', count: notesCount, icon: FileText, color: '#8B5CF6' },
      { id: '6', label: 'Tags', count: allTags.size, icon: Tag, color: '#06B6D4' },
      { id: '7', label: 'Relationships', count: 18, icon: Network, color: '#3B82F6' },
    ];
  }, [items]);

  // Shared shadow style for soft depth
  const softShadow = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  };

  const renderItemIcon = (item: RelicItem, size: number = 12) => {
    if (item.category === 'note' || item.type === 'note') {
      return <FileText color="#6366F1" size={size} />;
    }
    if (item.type === 'video' || item.mimeType?.startsWith('video')) {
      return <Video color="#6366F1" size={size} />;
    }
    if (item.category === 'file') {
      return <HardDrive color="#6366F1" size={size} />;
    }
    if (item.type === 'article') {
      return <FileText color="#6366F1" size={size} />;
    }
    if (item.type === 'image') {
      return <ImageIcon color="#6366F1" size={size} />;
    }
    return <LinkIcon color="#6366F1" size={size} />;
  };

  // --- RENDER GRID CARD ---
  const renderGridCard = (item: RelicItem) => (
    <TouchableOpacity 
      key={item.id} 
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.9}
      className="bg-white rounded-[24px] mb-4 overflow-hidden"
      style={softShadow}
    >
      {item.image && (
        <Image 
          source={{ uri: item.image }} 
          className={`w-full ${item.imgHeight || 'h-48'}`}
          resizeMode="cover"
        />
      )}
      {!item.image && isVideoItem(item) && <VideoThumbnail uri={item.fileUri!} className="h-48" />}
      <View className="p-4">
        <View className="flex-row items-center gap-1.5 mb-2.5">
          <View className="bg-indigo-50 p-1.5 rounded-lg">
            {renderItemIcon(item, 12)}
          </View>
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex-1" numberOfLines={1}>
            {item.source || item.category}
          </Text>
          <ItemMenu
            title={item.title}
            onEdit={() => router.push(`/item/${item.id}?edit=1`)}
            onDelete={() => deleteItem(item.id)}
            className="w-7 h-7 rounded-full items-center justify-center"
          />
        </View>
        <Text className="text-slate-800 text-base font-bold mb-2 leading-snug" numberOfLines={2}>
          {item.title}
        </Text>
        {item.note ? (
          <Text className="text-slate-500 text-xs leading-relaxed mb-3" numberOfLines={3}>
            {`"${item.note}"`}
          </Text>
        ) : null}
        {item.tags && item.tags.length > 0 && (
          <View className="bg-slate-100 self-start px-2 py-1 rounded-md">
            <Text className="text-slate-600 text-[10px] font-semibold tracking-wide">#{item.tags[0]}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // --- RENDER LIST CARD ---
  const renderListCard = (item: RelicItem) => (
    <TouchableOpacity 
      key={item.id} 
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.9}
      className="bg-white rounded-[24px] mb-5 overflow-hidden"
      style={softShadow}
    >
      {item.image && (
        <Image source={{ uri: item.image }} className="w-full h-56" resizeMode="cover" />
      )}
      {!item.image && isVideoItem(item) && <VideoThumbnail uri={item.fileUri!} className="h-56" />}
      <View className="p-5">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <View className="bg-indigo-50 p-2 rounded-lg">
              {renderItemIcon(item, 14)}
            </View>
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {item.source || item.category}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-slate-400 text-xs font-medium">{item.savedAt}</Text>
            <ItemMenu
              title={item.title}
              onEdit={() => router.push(`/item/${item.id}?edit=1`)}
              onDelete={() => deleteItem(item.id)}
              className="w-8 h-8 rounded-full items-center justify-center"
            />
          </View>
        </View>
        <Text className="text-slate-800 text-xl font-bold mb-2.5 leading-tight">
          {item.title}
        </Text>
        {item.note ? (
          <View className="bg-slate-50 p-4 rounded-2xl mb-4">
            <Text className="text-slate-600 text-sm leading-relaxed">{`"${item.note}"`}</Text>
          </View>
        ) : null}
        {item.tags && item.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {item.tags.map((tag: string, i: number) => (
              <View key={i} className="bg-indigo-50/80 px-2.5 py-1 rounded-md">
                <Text className="text-indigo-600 text-xs font-semibold">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
      {/* --- MAIN SCROLLVIEW WRAPS EVERYTHING --- */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* --- HEADER --- */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-5">
          <View>
            <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Relic</Text>
            <Text className="text-slate-500 text-sm mt-0.5 font-medium">Your personal archive</Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="bg-white p-3 rounded-full"
              style={softShadow}
            >
              {viewMode === 'grid' ? <List color="#64748B" size={20} /> : <LayoutGrid color="#64748B" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSortMenuVisible(true)}
              className={`p-3 rounded-full ${sortKey === 'newest' ? 'bg-white' : 'bg-indigo-600'}`}
              style={softShadow}
              accessibilityLabel="Sort items"
            >
              <ArrowUpDown color={sortKey === 'newest' ? '#64748B' : '#FFFFFF'} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              className="bg-white p-3 rounded-full"
              style={softShadow}
            >
              <Search color="#64748B" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- DASHBOARD STATS --- */}
        <View className="mb-6">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <View 
                  key={stat.id} 
                  className="bg-white p-4 rounded-2xl min-w-[120px]"
                  style={softShadow}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View 
                      className="p-2 rounded-xl" 
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <Icon color={stat.color} size={18} />
                    </View>
                  </View>
                  <Text className="text-slate-900 text-2xl font-extrabold">
                    {stat.count}
                  </Text>
                  <Text className="text-slate-500 text-xs font-semibold mt-1">
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* --- FILTER TABS --- */}
        <View className="mb-5">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity 
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className={`px-5 py-2.5 rounded-full ${
                    isActive ? 'bg-indigo-600' : 'bg-white'
                  }`}
                  style={!isActive ? softShadow : {}}
                >
                  <Text className={`text-sm font-semibold tracking-wide ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* --- FEED CONTAINER --- */}
        <View className="px-4">
          {filteredItems.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 items-center justify-center my-6" style={softShadow}>
              <View className="w-14 h-14 rounded-full bg-indigo-50 items-center justify-center mb-3">
                <FileText color="#6366F1" size={24} />
              </View>
              <Text className="text-slate-800 text-base font-bold mb-1">No items found</Text>
              <Text className="text-slate-500 text-xs text-center">
                There are no {activeFilter.toLowerCase()} saved in your archive yet. Tap the + button to add one!
              </Text>
            </View>
          ) : viewMode === 'grid' ? (
            <View className="flex-row justify-between">
              <View className="w-[48.5%]">{leftColumnData.map(renderGridCard)}</View>
              <View className="w-[48.5%]">{rightColumnData.map(renderGridCard)}</View>
            </View>
          ) : (
            <View>{filteredItems.map(renderListCard)}</View>
          )}
        </View>

      </ScrollView>

      {/* --- SORT MENU --- */}
      <Modal
        visible={sortMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setSortMenuVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-[28px] px-5 pt-5 pb-9"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest mb-2">
              SORT BY
            </Text>
            {SORT_OPTIONS.map((opt) => {
              const selected = opt.key === sortKey;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setSortKey(opt.key);
                    setSortMenuVisible(false);
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between py-3.5"
                >
                  <Text
                    className={`text-base ${
                      selected ? 'text-indigo-600 font-bold' : 'text-slate-700 font-medium'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {selected && <Check size={18} color="#4F46E5" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- FLOATING ACTION BUTTON (FAB) --- */}
      <FAB
        onPress={() => router.push('/item/create')}
        accessibilityLabel="Create archive item"
      />

    </SafeAreaView>
  );
}
