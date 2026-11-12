import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Tag as TagIcon,
  HardDrive,
  FileText,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react-native';
import { useItems } from '../../hooks/useItems';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, deleteItem } = useItems();

  const item = items.find((i) => i.id === id);

  const softShadow = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, softShadow]}>
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Not Found</Text>
        </View>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>This item could not be found or was removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = async () => {
    await deleteItem(item.id);
    router.replace('/');
  };

  const handleOpenUrl = () => {
    if (item.url) {
      Linking.openURL(item.url).catch((err) => console.error('Failed to open URL:', err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={[styles.backBtn, softShadow]}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.category.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={[styles.backBtn, styles.deleteBtn]}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image / Thumbnail */}
        {item.image && (
          <View style={[styles.imageWrap, softShadow]}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {/* Source & Date Badge */}
        <View style={styles.metaRow}>
          <View style={styles.sourceBadge}>
            {item.category === 'link' && <LinkIcon size={12} color="#6366F1" />}
            {item.category === 'note' && <FileText size={12} color="#6366F1" />}
            {item.category === 'file' && <HardDrive size={12} color="#6366F1" />}
            <Text style={styles.sourceText}>{item.source || item.category}</Text>
          </View>

          <View style={styles.dateRow}>
            <Calendar size={12} color="#94A3B8" />
            <Text style={styles.dateText}>{item.savedAt || 'Saved'}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* URL Action Button */}
        {item.url && (
          <TouchableOpacity onPress={handleOpenUrl} style={styles.urlButton} activeOpacity={0.8}>
            <ExternalLink size={16} color="#4F46E5" />
            <Text style={styles.urlText} numberOfLines={1}>
              {item.url}
            </Text>
          </TouchableOpacity>
        )}

        {/* File Metadata Info */}
        {item.category === 'file' && (
          <View style={styles.fileBox}>
            <HardDrive size={20} color="#6366F1" />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{item.fileName || 'Attached File'}</Text>
              {item.mimeType && <Text style={styles.fileMime}>{item.mimeType}</Text>}
            </View>
          </View>
        )}

        {/* Note / Content */}
        {item.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteBoxLabel}>NOTES</Text>
            <Text style={styles.noteContent}>{item.note}</Text>
          </View>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>TAGS</Text>
            <View style={styles.tagsRow}>
              {item.tags.map((tag, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <TagIcon size={12} color="#6366F1" />
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 16,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  urlText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
    flex: 1,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  fileMime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  noteBox: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  notFoundWrap: {
    padding: 24,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 14,
    color: '#64748B',
  },
});
