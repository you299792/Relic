import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { withFrom } from '../utils/nav';
import { useItems } from '../hooks/useItems';
import { useCollections, COLLECTION_COLORS } from '../hooks/useCollections';
import { FAB } from '../components/ui/fab';
import { FolderPlus, ChevronRight, Search, X, FileText, Folder } from 'lucide-react-native';
import { CreateFolderModal } from '../components/collections/create-folder-modal';
import { FolderRow, FolderRowData } from '../components/collections/folder-row';

export default function CollectionsScreen() {
  const router = useRouter();
  const { items } = useItems();
  const { collections, addCollection } = useCollections();
  const [createVisible, setCreateVisible] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const toRow = (c: (typeof collections)[number], caption?: string): FolderRowData => ({
    id: c.id,
    name: c.name,
    color: c.color,
    itemCount: items.filter((i) => i.collectionId === c.id).length,
    folderCount: collections.filter((x) => x.parentId === c.id).length,
    caption,
  });

  // Browsing shows top-level folders; searching looks through folders at every depth
  const pathOf = (c: (typeof collections)[number]) => {
    const parent = collections.find((x) => x.id === c.parentId);
    return parent ? `in ${parent.name}` : undefined;
  };
  const visibleFolders: FolderRowData[] = q
    ? collections
        .filter((c) => c.name.toLowerCase().includes(q))
        .map((c) => toRow(c, pathOf(c)))
    : collections.filter((c) => !c.parentId).map((c) => toRow(c));

  // Only items that live inside a folder are searchable here
  const matchedItems = !q
    ? []
    : items
        .filter((i) => i.collectionId && collections.some((c) => c.id === i.collectionId))
        .filter((i) =>
          [i.title, i.note, i.url, i.fileName, i.source, ...(i.tags ?? [])]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q))
        );

  const handleCreate = (name: string, color: string) => {
    const created = addCollection(name, color);
    if (!created) return;
    setCreateVisible(false);
    router.push(`/collection/${created.id}`);
  };

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
            onPress={() => setCreateVisible(true)}
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

      {/* --- INLINE SEARCH (stays on this screen) --- */}
      <View
        className="flex-row items-center bg-white rounded-2xl mx-5 mb-4 px-4"
        style={softShadow}
      >
        <Search color="#94A3B8" size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search folders and their items"
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
          returnKeyType="search"
          className="flex-1 py-3.5 px-3 text-base text-slate-800"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <X color="#94A3B8" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        className="flex-1" 
        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {/* --- FOLDER LIST --- */}
        <View className="gap-3">
          {visibleFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              onPress={() => router.push(`/collection/${folder.id}`)}
            />
          ))}
        </View>

        {/* --- MATCHING ITEMS INSIDE FOLDERS --- */}
        {q && matchedItems.length > 0 && (
          <View className="mt-6">
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest mb-3">
              ITEMS IN FOLDERS
            </Text>
            <View className="gap-3">
              {matchedItems.map((item) => {
                const parent = collections.find((c) => c.id === item.collectionId);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(withFrom(`/item/${item.id}`, '/collections'))}
                    activeOpacity={0.8}
                    className="bg-white p-4 rounded-[20px] flex-row items-center"
                    style={softShadow}
                  >
                    <View className="bg-indigo-50 p-2.5 rounded-xl mr-3">
                      <FileText color="#6366F1" size={18} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-800 font-bold text-base" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-slate-500 text-xs font-medium mt-0.5" numberOfLines={1}>
                        in {parent?.name}
                      </Text>
                    </View>
                    <ChevronRight color="#CBD5E1" size={20} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {q && visibleFolders.length === 0 && matchedItems.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-slate-800 text-lg font-bold mb-1">No results</Text>
            <Text className="text-slate-500 text-sm text-center px-10">
              Nothing in your folders matches &quot;{query.trim()}&quot;.
            </Text>
          </View>
        )}

        {/* Empty State (If no folders exist) */}
        {collections.length === 0 && (
          <View className="items-center justify-center py-20 mt-10">
            <View className="bg-white p-6 rounded-full mb-6" style={softShadow}>
              <Folder color="#CBD5E1" size={48} />
            </View>
            <Text className="text-slate-800 text-lg font-bold mb-2">No collections yet</Text>
            <Text className="text-slate-500 text-sm text-center px-10">
              Tap the + button to create your first collection.
            </Text>
          </View>
        )}

      </ScrollView>

      <CreateFolderModal
        visible={createVisible}
        defaultColor={COLLECTION_COLORS[collections.length % COLLECTION_COLORS.length]}
        onClose={() => setCreateVisible(false)}
        onCreate={handleCreate}
      />

      {/* --- FLOATING ADD BUTTON --- */}
      <FAB onPress={() => setCreateVisible(true)} accessibilityLabel="Add collection folder" />
    </SafeAreaView>
  );
}