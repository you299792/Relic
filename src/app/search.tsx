import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search as SearchIcon,
  X,
  Clock,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Folder
} from 'lucide-react-native';

// --- MOCK DATA ---
const RECENT_SEARCHES = ['React Native', 'Design Systems', 'SQLite', 'UI Inspiration'];
const SUGGESTED_TAGS = ['#react', '#design', '#tutorial', '#mindfulness', '#database'];

const MOCK_RESULTS = [
  { 
    id: '1', 
    title: 'The Art of Noticing', 
    type: 'article', 
    source: 'Medium', 
    note: 'Fascinating read on how paying attention to the small details in life can drastically improve your creativity...',
    collection: 'Mindfulness'
  },
  { 
    id: '2', 
    title: 'React Native Reanimated Docs', 
    type: 'website', 
    source: 'reactnative.dev', 
    note: 'Need to dive deep into the shared value API. The new layout animations look incredibly smooth...',
    collection: 'Dev Resources'
  },
  { 
    id: '3', 
    title: 'Minimalist Workspace Setup', 
    type: 'image', 
    source: 'Dribbble', 
    note: 'Love the warm lighting and the wooden desk texture here. Great inspiration for my next desk setup.',
    collection: 'Inspiration'
  }
];

const FILTERS = ['All', 'Articles', 'Images', 'Notes', 'Links'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Shared shadow style for soft depth
  const softShadow = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  };

  const isSearching = query.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
      
      {/* --- HEADER & SEARCH BAR --- */}
      <View className="px-5 pt-4 pb-5">
        <Text className="text-slate-900 text-3xl font-extrabold tracking-tight mb-5">Search</Text>
        
        {/* Search Input */}
        <View 
          className="flex-row items-center bg-white rounded-2xl px-4 py-4"
          style={softShadow}
        >
          <SearchIcon color="#64748B" size={20} />
          <TextInput
            className="flex-1 text-slate-800 text-base ml-3 font-medium"
            placeholder="Search items, tags, notes..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity 
              onPress={() => setQuery('')} 
              className="p-1.5 bg-slate-100 rounded-full ml-2"
            >
              <X color="#64748B" size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* --- FILTER TABS --- */}
      <View className="mb-6">
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

      {/* --- CONTENT AREA (Conditional) --- */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {!isSearching ? (
          // ==========================================
          // EMPTY STATE (Recent & Suggested)
          // ==========================================
          <View>
            {/* Recent Searches */}
            <View className="mb-10">
              <View className="flex-row items-center gap-2 mb-5">
                <Clock color="#64748B" size={20} />
                <Text className="text-slate-800 text-lg font-bold">Recent Searches</Text>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {RECENT_SEARCHES.map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => setQuery(item)}
                    className="bg-white px-4 py-3 rounded-xl flex-row items-center"
                    style={softShadow}
                  >
                    <Text className="text-slate-600 font-medium text-sm">{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Suggested Tags */}
            <View>
              <View className="flex-row items-center gap-2 mb-5">
                <TrendingUp color="#64748B" size={20} />
                <Text className="text-slate-800 text-lg font-bold">Suggested Tags</Text>
              </View>
              <View className="flex-row flex-wrap gap-2.5">
                {SUGGESTED_TAGS.map((tag, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => setQuery(tag.replace('#', ''))}
                    className="bg-indigo-50/80 px-4 py-2.5 rounded-xl"
                  >
                    <Text className="text-indigo-600 font-semibold text-sm">{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          // ==========================================
          // ACTIVE STATE (Search Results)
          // ==========================================
          <View>
            <Text className="text-slate-500 text-sm font-semibold mb-4">
              Found {MOCK_RESULTS.length} results for "{query}"
            </Text>

            {MOCK_RESULTS.map((item) => (
              <TouchableOpacity 
                key={item.id}
                onPress={() => router.push(`/item/${item.id}`)}
                activeOpacity={0.9}
                className="bg-white rounded-3xl p-5 mb-4 flex-row items-start"
                style={softShadow}
              >
                {/* Icon Box */}
                <View className="bg-indigo-50 p-3 rounded-2xl mr-4 mt-0.5">
                  {item.type === 'article' && <FileText color="#6366F1" size={20} />}
                  {item.type === 'website' && <LinkIcon color="#6366F1" size={20} />}
                  {item.type === 'image' && <ImageIcon color="#6366F1" size={20} />}
                </View>

                {/* Content */}
                <View className="flex-1">
                  {/* Title */}
                  <Text className="text-slate-800 font-bold text-base leading-snug mb-2" numberOfLines={1}>
                    {item.title}
                  </Text>
                  
                  {/* Note Snippet */}
                  <Text className="text-slate-500 text-xs leading-relaxed mb-3" numberOfLines={2}>
                    "{item.note}"
                  </Text>

                  {/* Meta Row (Using gap-2 for perfect spacing) */}
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1">
                      <Folder color="#94A3B8" size={12} />
                      <Text className="text-slate-500 text-xs font-medium">{item.collection}</Text>
                    </View>
                    <Text className="text-slate-300 text-[10px]">●</Text>
                    <Text className="text-slate-500 text-xs font-medium">{item.source}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}