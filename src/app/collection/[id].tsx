import React, { useState } from 'react';
import { Text, TouchableOpacity, View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, FolderPlus, StickyNote, FileUp, Link as LinkIcon } from 'lucide-react-native';
import { withFrom } from '../../utils/nav';
import { useItems } from '../../hooks/useItems';
import { useCollections } from '../../hooks/useCollections';
import { ItemFeed } from '../../components/items/item-feed';
import { CreateFolderModal } from '../../components/collections/create-folder-modal';
import { folderSummary } from '../../components/collections/folder-row';

const softShadow = {
  shadowColor: '#64748B',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

const ADD_OPTIONS = [
  { key: 'note', label: 'Add note', icon: StickyNote },
  { key: 'file', label: 'Add file', icon: FileUp },
  { key: 'link', label: 'Add link', icon: LinkIcon },
  { key: 'folder', label: 'Add folder', icon: FolderPlus },
] as const;

export default function CollectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, deleteItem, clearCollections } = useItems();
  const { collections, loading, addCollection, deleteCollection } = useCollections();
  const [createVisible, setCreateVisible] = useState(false);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const collection = collections.find((c) => c.id === id);
  const goBack = () =>
    router.replace(collection?.parentId ? `/collection/${collection.parentId}` : '/collections');

  if (!collection) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F6F9] items-center justify-center px-8">
        <Text className="text-slate-800 text-lg font-bold mb-2">
          {loading ? 'Loading…' : 'Folder not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/collections')}
          className="bg-indigo-600 px-5 py-3 rounded-full mt-3"
        >
          <Text className="text-white font-semibold">Back to folders</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const folderItems = items.filter((i) => i.collectionId === collection.id);
  const subfolders = collections
    .filter((c) => c.parentId === collection.id)
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      itemCount: items.filter((i) => i.collectionId === c.id).length,
      folderCount: collections.filter((x) => x.parentId === c.id).length,
    }));

  const handleDelete = () => {
    // Also removes nested folders; their items return to Home un-filed
    const removed = deleteCollection(collection.id);
    clearCollections(removed);
    goBack();
  };

  return (
    <>
      <ItemFeed
        title={collection.name}
        subtitle={folderSummary({ itemCount: folderItems.length, folderCount: subfolders.length })}
        items={folderItems}
        subfolders={subfolders}
        onOpenFolder={(fid) => router.push(`/collection/${fid}`)}
        onBack={goBack}
        searchPlaceholder={`Search in ${collection.name}`}
        onDeleteItem={deleteItem}
        onAdd={() => setAddMenuVisible(true)}
        emptyHint="Tap the + button to add a note, file, link or folder."
        headerRight={
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-white p-3 rounded-full"
              style={softShadow}
              accessibilityLabel="Delete folder"
            >
              <Trash2 color="#EF4444" size={20} />
            </TouchableOpacity>
        }
      />
      <Modal
        visible={addMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMenuVisible(false)}
      >
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setAddMenuVisible(false)}>
          <Pressable className="bg-white rounded-t-[28px] px-5 pt-5 pb-9" onPress={(e) => e.stopPropagation()}>
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest mb-2">
              ADD TO {collection.name.toUpperCase()}
            </Text>
            {ADD_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.7}
                  className="flex-row items-center py-3"
                  onPress={() => {
                    setAddMenuVisible(false);
                    if (opt.key === 'folder') setCreateVisible(true);
                    else router.push(
                        withFrom('/item/create', `/collection/${collection.id}`, {
                          collectionId: collection.id,
                          category: opt.key,
                        })
                      );
                  }}
                >
                  <View className="bg-indigo-50 p-3 rounded-xl mr-4">
                    <Icon color="#4F46E5" size={20} />
                  </View>
                  <Text className="text-slate-800 text-base font-semibold">{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      <CreateFolderModal
        visible={createVisible}
        title={`NEW FOLDER IN ${collection.name.toUpperCase()}`}
        defaultColor={collection.color}
        onClose={() => setCreateVisible(false)}
        onCreate={(name, color) => {
          const created = addCollection(name, color, collection.id);
          setCreateVisible(false);
          if (created) router.push(`/collection/${created.id}`);
        }}
      />
    </>
  );
}
