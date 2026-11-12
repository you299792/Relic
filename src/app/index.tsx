import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
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
} from 'lucide-react-native';
import { useItems } from '../hooks/useItems';
import { FAB } from '../components/ui/fab';
import { RelicItem } from '../types/models';

const FILTERS = ['All', 'Articles', 'Images', 'Notes', 'Videos'];

export default function DashboardScreen() {
  const router = useRouter();
  const { items } = useItems();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter items based on activeFilter
  const filteredItems = useMemo(() => {
    if (activeFilter === 'All') return items;
    if (activeFilter === 'Articles') {
      return items.filter(
        (i) => i.type === 'article' || (i.category === 'link' && !i.image)
      );
    }
    if (activeFilter === 'Images') {
      return items.filter(
        (i) => i.type === 'image' || (i.image && !i.mimeType?.startsWith('video'))
      );
    }
    if (activeFilter === 'Notes') {
      return items.filter(
        (i) => i.category === 'note' || i.type === 'note'
      );
    }
    if (activeFilter === 'Videos') {
      return items.filter(
        (i) => i.type === 'video' || i.mimeType?.startsWith('video')
      );
    }
    return items;
  }, [items, activeFilter]);

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
      <View className="p-4">
        <View className="flex-row items-center gap-1.5 mb-2.5">
          <View className="bg-indigo-50 p-1.5 rounded-lg">
            {renderItemIcon(item, 12)}
          </View>
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest" numberOfLines={1}>
            {item.source || item.category}
          </Text>
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
          <Text className="text-slate-400 text-xs font-medium">{item.savedAt}</Text>
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

      {/* --- FLOATING ACTION BUTTON (FAB) --- */}
      <FAB
        onPress={() => router.push('/item/create')}
        accessibilityLabel="Create archive item"
      />

    </SafeAreaView>
  );
}
