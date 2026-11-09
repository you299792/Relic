import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Folder,
  FolderPlus,
  ChevronRight,
  Search,
  MoreHorizontal
} from 'lucide-react-native';

// --- MOCK ROOT FOLDERS ---
// These are the top-level collections (parent_id = null in your DB)
const MOCK_ROOT_FOLDERS = [
  { id: '1', name: 'UI Inspiration', itemCount: 24, color: '#6366F1' }, // Indigo
  { id: '2', name: 'React Native Tutorials', itemCount: 12, color: '#10B981' }, // Emerald
  { id: '3', name: 'Design Systems', itemCount: 8, color: '#F59E0B' }, // Amber
  { id: '4', name: 'Read Later', itemCount: 45, color: '#EC4899' }, // Pink
  { id: '5', name: 'Personal Notes', itemCount: 18, color: '#8B5CF6' }, // Violet
];

export default function CollectionsScreen() {
  const router = useRouter();

  const softShadow = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
      
      {/* --- HEADER --- */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-6">
        <View>
          <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Collections</Text>
          <Text className="text-slate-500 text-sm mt-0.5 font-medium">All your folders</Text>
        </View>
        
        <View className="flex-row gap-3">
          <TouchableOpacity 
            onPress={() => router.push('/search')}
            className="bg-white p-3 rounded-full"
            style={softShadow}
          >
            <Search color="#64748B" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-indigo-600 p-3 rounded-full shadow-sm"
            style={{
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <FolderPlus color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {/* --- FOLDER LIST --- */}
        <View className="gap-3">
          {MOCK_ROOT_FOLDERS.map((folder) => (
            <TouchableOpacity 
              key={folder.id}
              onPress={() => router.push(`/collection/${folder.id}`)} // Navigates INTO the folder
              activeOpacity={0.8}
              className="bg-white p-4 rounded-[20px] flex-row items-center"
              style={softShadow}
            >
              {/* Folder Icon */}
              <View 
                className="p-3 rounded-xl mr-4"
                style={{ backgroundColor: `${folder.color}15` }} // 15 is ~8% opacity
              >
                <Folder color={folder.color} size={24} />
              </View>

              {/* Folder Details */}
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-lg mb-0.5" numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text className="text-slate-500 text-sm font-medium">
                  {folder.itemCount} items
                </Text>
              </View>

              {/* Chevron / Action */}
              <View className="flex-row items-center gap-2">
                <ChevronRight color="#CBD5E1" size={20} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State (If no folders exist) */}
        {MOCK_ROOT_FOLDERS.length === 0 && (
          <View className="items-center justify-center py-20 mt-10">
            <View className="bg-white p-6 rounded-full mb-6" style={softShadow}>
              <Folder color="#CBD5E1" size={48} />
            </View>
            <Text className="text-slate-800 text-lg font-bold mb-2">No collections yet</Text>
            <Text className="text-slate-500 text-sm text-center px-10">
              Tap the folder plus icon in the top right to create your first collection.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}