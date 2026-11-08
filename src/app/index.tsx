import React, { useState } from 'react';
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
  Plus,
  Link as LinkIcon,
  FileText,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Folder,
  Tag,
  Network
} from 'lucide-react-native';

// --- MOCK STATS DATA ---
const MOCK_STATS = [
  { id: '1', label: 'Total Items', count: 124, icon: FileText, color: '#6366F1' },
  { id: '2', label: 'Collections', count: 8, icon: Folder, color: '#F59E0B' },
  { id: '3', label: 'Links', count: 45, icon: LinkIcon, color: '#10B981' },
  { id: '4', label: 'Media', count: 23, icon: ImageIcon, color: '#EC4899' },
  { id: '5', label: 'Tags', count: 32, icon: Tag, color: '#8B5CF6' },
  { id: '6', label: 'Relationships', count: 18, icon: Network, color: '#3B82F6' },
];

// --- RICH MOCK DATA ---
const MOCK_FEED = [
  { 
    id: '1', 
    title: 'The Art of Noticing', 
    type: 'article', 
    source: 'Medium', 
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-56',
    note: 'Fascinating read on how paying attention to the small details in life can drastically improve your creativity and overall well-being.',
    tags: ['mindfulness', 'creativity'],
    savedAt: '2 hours ago'
  },
  { 
    id: '2', 
    title: 'React Native Reanimated Docs', 
    type: 'website', 
    source: 'reactnative.dev', 
    image: null, 
    imgHeight: 'h-0',
    note: 'Need to dive deep into the shared value API. The new layout animations look incredibly smooth. I should test this with the new collections feature.',
    tags: ['react-native', 'animation'],
    savedAt: '5 hours ago'
  },
  { 
    id: '3', 
    title: 'Minimalist Workspace Setup', 
    type: 'image', 
    source: 'Dribbble', 
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-64',
    note: 'Love the warm lighting and the wooden desk texture here. Great inspiration for my next desk setup.',
    tags: ['workspace', 'design'],
    savedAt: 'Yesterday'
  },
  { 
    id: '4', 
    title: 'SQLite Performance', 
    type: 'article', 
    source: 'dev.to', 
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-40',
    note: 'Crucial for Relic: Remember to use indexes on foreign keys and use FTS5 for full-text search.',
    tags: ['database', 'sqlite'],
    savedAt: 'Yesterday'
  },
  { 
    id: '5', 
    title: 'Kyoto, Japan', 
    type: 'image', 
    source: 'Unsplash', 
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop',
    imgHeight: 'h-72',
    note: 'A beautiful quiet street. Adding this to the travel itinerary for next spring. The architecture is incredible.',
    tags: ['travel', 'japan'],
    savedAt: '2 days ago'
  }
];

const FILTERS = ['All', 'Articles', 'Images', 'Notes', 'Videos'];

export default function DashboardScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('All');

  const leftColumnData = MOCK_FEED.filter((_, index) => index % 2 === 0);
  const rightColumnData = MOCK_FEED.filter((_, index) => index % 2 !== 0);

  // Shared shadow style for soft depth (removes harsh pixels)
  const softShadow = {
    shadowColor: '#64748B', // Slate-500 for a softer, more natural shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  };

  // --- RENDER GRID CARD ---
  const renderGridCard = (item: any) => (
    <TouchableOpacity 
      key={item.id} 
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.9}
      className="bg-white rounded-[24px] mb-4 overflow-hidden"
      style={softShadow}
    >
      {item.image && (
        <Image source={{ uri: item.image }} className={`w-full ${item.imgHeight}`} resizeMode="cover" />
      )}
      <View className="p-4">
        <View className="flex-row items-center gap-1.5 mb-2.5">
          <View className="bg-indigo-50 p-1.5 rounded-lg">
            {item.type === 'article' && <FileText color="#6366F1" size={12} />}
            {item.type === 'website' && <LinkIcon color="#6366F1" size={12} />}
            {item.type === 'image' && <ImageIcon color="#6366F1" size={12} />}
          </View>
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            {item.source}
          </Text>
        </View>
        <Text className="text-slate-800 text-base font-bold mb-2 leading-snug" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-slate-500 text-xs leading-relaxed mb-3" numberOfLines={3}>
          "{item.note}"
        </Text>
        {item.tags.length > 0 && (
          <View className="bg-slate-100 self-start px-2 py-1 rounded-md">
            <Text className="text-slate-600 text-[10px] font-semibold tracking-wide">#{item.tags[0]}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // --- RENDER LIST CARD ---
  const renderListCard = (item: any) => (
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
              {item.type === 'article' && <FileText color="#6366F1" size={14} />}
              {item.type === 'website' && <LinkIcon color="#6366F1" size={14} />}
              {item.type === 'image' && <ImageIcon color="#6366F1" size={14} />}
            </View>
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {item.source}
            </Text>
          </View>
          <Text className="text-slate-400 text-xs font-medium">{item.savedAt}</Text>
        </View>
        <Text className="text-slate-800 text-xl font-bold mb-2.5 leading-tight">
          {item.title}
        </Text>
        <View className="bg-slate-50 p-4 rounded-2xl mb-4">
          <Text className="text-slate-600 text-sm leading-relaxed">"{item.note}"</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {item.tags.map((tag: string, i: number) => (
            <View key={i} className="bg-indigo-50/80 px-2.5 py-1 rounded-md">
              <Text className="text-indigo-600 text-xs font-semibold">#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
      {/* --- MAIN SCROLLVIEW WRAPS EVERYTHING --- */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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
            {MOCK_STATS.map((stat) => {
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
          {viewMode === 'grid' ? (
            <View className="flex-row justify-between">
              <View className="w-[48.5%]">{leftColumnData.map(renderGridCard)}</View>
              <View className="w-[48.5%]">{rightColumnData.map(renderGridCard)}</View>
            </View>
          ) : (
            <View>{MOCK_FEED.map(renderListCard)}</View>
          )}
        </View>

      </ScrollView>

      {/* --- FLOATING ACTION BUTTON (FAB) --- */}
      <TouchableOpacity
        onPress={() => router.push('/item/create')}
        activeOpacity={0.8}
        className="absolute bottom-8 right-6 bg-indigo-600 w-14 h-14 rounded-full items-center justify-center"
        style={{
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

    </SafeAreaView>
  );
} 