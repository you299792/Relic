import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Video,
  FileCode,
  Music,
  X,
  RefreshCw,
} from 'lucide-react-native';

export interface SelectedFileInfo {
  uri: string;
  name: string;
  size?: number | null;
  mimeType?: string | null;
}

interface FilePickerProps {
  file: SelectedFileInfo | null;
  onFileSelected: (file: SelectedFileInfo | null) => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FilePicker({ file, onFileSelected }: FilePickerProps) {
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
    try {
      setLoading(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        onFileSelected({
          uri: doc.uri,
          name: doc.name || 'Untitled File',
          size: doc.size ?? null,
          mimeType: doc.mimeType ?? null,
        });
      }
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Unable to pick the document.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickMedia = async () => {
    try {
      setLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media library is required.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const filename = asset.fileName || (asset.type === 'video' ? 'video.mp4' : 'image.jpg');
        onFileSelected({
          uri: asset.uri,
          name: filename,
          size: asset.fileSize ?? null,
          mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        });
      }
    } catch (err) {
      console.error('Media picker error:', err);
      Alert.alert('Error', 'Unable to pick media.');
    } finally {
      setLoading(false);
    }
  };

  const isImage = file?.mimeType?.startsWith('image') || file?.name?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
  const isVideo = file?.mimeType?.startsWith('video') || file?.name?.match(/\.(mp4|mov|mkv|webm)$/i);
  const isAudio = file?.mimeType?.startsWith('audio') || file?.name?.match(/\.(mp3|wav|m4a|aac)$/i);

  const renderFileIcon = () => {
    if (isVideo) return <Video size={24} color="#6366F1" />;
    if (isAudio) return <Music size={24} color="#EC4899" />;
    if (file?.name?.match(/\.(ts|tsx|js|jsx|json|py|html|css)$/i)) return <FileCode size={24} color="#10B981" />;
    return <FileText size={24} color="#6366F1" />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>CHOOSE FILE OR MEDIA *</Text>
        {file && (
          <TouchableOpacity onPress={() => onFileSelected(null)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      {file ? (
        <View style={styles.fileCard}>
          {isImage ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: file.uri }} style={styles.thumbnailPreview} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.genericIconWrap}>
              {renderFileIcon()}
            </View>
          )}

          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <View style={styles.metaRow}>
              {file.size ? (
                <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>
              ) : null}
              {file.mimeType ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handlePickDocument}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <RefreshCw size={16} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => onFileSelected(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.pickerOptionsRow}>
          <TouchableOpacity
            style={styles.optionBox}
            onPress={handlePickDocument}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#6366F1" size="small" />
            ) : (
              <>
                <View style={styles.optionIconCircle}>
                  <Upload size={20} color="#6366F1" strokeWidth={2} />
                </View>
                <Text style={styles.optionTitle}>Pick Any File</Text>
                <Text style={styles.optionSub}>PDF, Docs, Zip, etc.</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionBox}
            onPress={handlePickMedia}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#6366F1" size="small" />
            ) : (
              <>
                <View style={[styles.optionIconCircle, { backgroundColor: '#FDF2F8' }]}>
                  <ImageIcon size={20} color="#EC4899" strokeWidth={2} />
                </View>
                <Text style={styles.optionTitle}>Photos & Videos</Text>
                <Text style={styles.optionSub}>Camera Roll / Gallery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  removeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  pickerOptionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBox: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
    textAlign: 'center',
  },
  optionSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
  },
  genericIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileSize: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
});
