import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Tag as TagIcon,
  HardDrive,
  FileText,
  Link as LinkIcon,
  ImageIcon,
  Video,
  Check,
  X,
} from 'lucide-react-native';
import { useItems } from '../../hooks/useItems';
import { RelicItem } from '../../types/models';
import { ItemMenu } from '../../components/items/item-menu';
import { ItemVideoPlayer } from '../../components/items/video-player';

const softShadow = {
  shadowColor: '#64748B',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};

function getTypeMeta(item: RelicItem) {
  if (item.category === 'note' || item.type === 'note') {
    return { Icon: FileText, label: 'Note' };
  }
  if (item.type === 'video' || item.mimeType?.startsWith('video')) {
    return { Icon: Video, label: 'Video' };
  }
  if (item.category === 'file') {
    return { Icon: HardDrive, label: 'File' };
  }
  if (item.type === 'image') {
    return { Icon: ImageIcon, label: 'Image' };
  }
  return { Icon: LinkIcon, label: 'Link' };
}

export default function ItemDetailScreen() {
  const { id, edit, from } = useLocalSearchParams<{ id: string; edit?: string; from?: string }>();
  const router = useRouter();
  const { items, deleteItem, updateItem } = useItems();
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const item = items.find((i) => i.id === id);
  // Back always returns to the screen the user came from (falls back to the item's folder, then Home)
  const backHref = (from ?? (item?.collectionId ? `/collection/${item.collectionId}` : '/')) as Href;
  const startInEdit = edit === '1' && !!item;
  const [isEditing, setIsEditing] = useState(startInEdit);
  const [titleDraft, setTitleDraft] = useState(startInEdit ? item!.title : '');
  const [urlDraft, setUrlDraft] = useState(startInEdit ? item!.url ?? '' : '');
  const [noteDraft, setNoteDraft] = useState(startInEdit ? item!.note ?? '' : '');
  const [tagsDraft, setTagsDraft] = useState(startInEdit ? (item!.tags ?? []).join(', ') : '');

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.replace(backHref)}
            activeOpacity={0.7}
            className="bg-white w-11 h-11 rounded-full items-center justify-center"
            style={softShadow}
          >
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-10 -mt-20">
          <View className="bg-white p-6 rounded-full mb-6" style={softShadow}>
            <FileText color="#CBD5E1" size={40} />
          </View>
          <Text className="text-slate-800 text-lg font-bold mb-2">Item not found</Text>
          <Text className="text-slate-500 text-sm text-center">
            This item could not be found or may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { Icon: TypeIcon, label: typeLabel } = getTypeMeta(item);

  const handleDelete = async () => {
    await deleteItem(item.id);
    router.replace(backHref);
  };

  const startEditing = () => {
    setTitleDraft(item.title);
    setUrlDraft(item.url ?? '');
    setNoteDraft(item.note ?? '');
    setTagsDraft((item.tags ?? []).join(', '));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!titleDraft.trim()) {
      Alert.alert('Missing Title', 'Title cannot be empty.');
      return;
    }
    if (item.category === 'link' && !urlDraft.trim()) {
      Alert.alert('Missing URL', 'Please enter a URL for this link.');
      return;
    }
    const tags = tagsDraft
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    await updateItem(item.id, {
      title: titleDraft.trim(),
      url: item.category === 'link' ? urlDraft.trim() : item.url,
      note: noteDraft.trim() || undefined,
      tags,
    });
    setIsEditing(false);
  };

  const handleOpenUrl = () => {
    if (item.url) {
      Linking.openURL(item.url).catch((err) => console.error('Failed to open URL:', err));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
      {/* --- HEADER --- */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <TouchableOpacity
          onPress={() => router.replace(backHref)}
          activeOpacity={0.7}
          className="bg-white w-11 h-11 rounded-full items-center justify-center"
          style={softShadow}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>

        <Text className="text-slate-500 text-xs font-extrabold uppercase tracking-widest">
          {typeLabel}
        </Text>

        {isEditing ? (
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              activeOpacity={0.7}
              className="bg-white w-11 h-11 rounded-full items-center justify-center"
              style={softShadow}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              className="bg-indigo-600 w-11 h-11 rounded-full items-center justify-center"
            >
              <Check size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <ItemMenu
            title={item.title}
            onEdit={startEditing}
            onDelete={handleDelete}
            className="bg-white w-11 h-11 rounded-full items-center justify-center"
            style={softShadow}
            iconColor="#1E293B"
          />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        {/* --- COVER IMAGE OR TYPE BANNER --- */}
        {item.fileUri && (item.type === 'video' || item.mimeType?.startsWith('video')) ? (
          <ItemVideoPlayer key={item.fileUri} uri={item.fileUri} thumbnail={item.image} />
        ) : item.image ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setImageViewerVisible(true)}
            className="w-full h-56 rounded-[24px] overflow-hidden bg-slate-200 mb-5"
            style={softShadow}
          >
            <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View
            className="w-full h-28 rounded-[24px] bg-indigo-50 items-center justify-center mb-5"
          >
            <TypeIcon color="#6366F1" size={32} />
          </View>
        )}

        {/* --- SOURCE & DATE --- */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1.5 bg-indigo-50 self-start px-2.5 py-1.5 rounded-lg">
            <TypeIcon size={12} color="#6366F1" />
            <Text className="text-indigo-700 text-[11px] font-bold uppercase tracking-wide" numberOfLines={1}>
              {item.source || item.category}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Calendar size={12} color="#94A3B8" />
            <Text className="text-slate-400 text-xs font-medium">{item.savedAt || 'Saved'}</Text>
          </View>
        </View>

        {isEditing && (
          <>
            <Text className="text-slate-500 text-[11px] font-extrabold tracking-widest mb-2">TITLE</Text>
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              placeholder="Title"
              placeholderTextColor="#94A3B8"
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-slate-800 font-medium mb-4"
            />
            {item.category === 'link' && (
              <>
                <Text className="text-slate-500 text-[11px] font-extrabold tracking-widest mb-2">URL</Text>
                <TextInput
                  value={urlDraft}
                  onChangeText={setUrlDraft}
                  placeholder="https://example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-slate-800 font-medium mb-4"
                />
              </>
            )}
            <Text className="text-slate-500 text-[11px] font-extrabold tracking-widest mb-2">NOTES</Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Add notes..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-slate-800 font-medium mb-4 min-h-[120px]"
            />
            <Text className="text-slate-500 text-[11px] font-extrabold tracking-widest mb-2">
              TAGS (COMMA SEPARATED)
            </Text>
            <TextInput
              value={tagsDraft}
              onChangeText={setTagsDraft}
              placeholder="e.g. design, reading"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] text-slate-800 font-medium mb-4"
            />
          </>
        )}

        {/* --- TITLE --- */}
        {!isEditing && (
        <Text className="text-slate-900 text-2xl font-extrabold leading-tight mb-4">
          {item.title}
        </Text>
        )}

        {/* --- URL ACTION --- */}
        {!isEditing && item.url && (
          <TouchableOpacity
            onPress={handleOpenUrl}
            activeOpacity={0.8}
            className="flex-row items-center gap-2 bg-indigo-50 p-3.5 rounded-2xl mb-4"
          >
            <ExternalLink size={16} color="#4F46E5" />
            <Text className="text-indigo-700 text-[13px] font-semibold flex-1" numberOfLines={1}>
              {item.url}
            </Text>
          </TouchableOpacity>
        )}

        {/* --- FILE METADATA --- */}
        {item.category === 'file' && (
          <View
            className="flex-row items-center gap-3 bg-white p-4 rounded-[18px] mb-4"
            style={softShadow}
          >
            <View className="bg-indigo-50 p-2.5 rounded-xl">
              <HardDrive size={20} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-800 text-sm font-bold" numberOfLines={1}>
                {item.fileName || 'Attached file'}
              </Text>
              {item.mimeType && (
                <Text className="text-slate-400 text-xs mt-0.5">{item.mimeType}</Text>
              )}
            </View>
          </View>
        )}

        {/* --- NOTE / CONTENT --- */}
        {!isEditing && item.note && (
          <View
            className="bg-white p-5 rounded-[20px] mb-4 border border-slate-100"
            style={softShadow}
          >
            <Text className="text-slate-400 text-[10px] font-extrabold tracking-widest mb-2.5">
              NOTES
            </Text>
            <Text className="text-slate-700 text-[15px] leading-relaxed">{item.note}</Text>
          </View>
        )}

        {/* --- TAGS --- */}
        {!isEditing && item.tags && item.tags.length > 0 && (
          <View className="mt-1">
            <Text className="text-slate-500 text-[11px] font-extrabold tracking-widest mb-2.5">
              TAGS
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {item.tags.map((tag, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
                >
                  <TagIcon size={12} color="#6366F1" />
                  <Text className="text-indigo-700 text-xs font-semibold">#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* --- FULLSCREEN IMAGE VIEWER --- */}
      {item.image && (
        <Modal
          visible={isImageViewerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <View className="flex-1 bg-black">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setImageViewerVisible(false)}
              className="flex-1 items-center justify-center"
            >
              <Image
                source={{ uri: item.image }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </TouchableOpacity>

            <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, right: 0 }}>
              <TouchableOpacity
                onPress={() => setImageViewerVisible(false)}
                activeOpacity={0.7}
                className="bg-white/15 w-11 h-11 rounded-full items-center justify-center mr-5 mt-3"
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
