import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Tag as TagIcon, Globe } from 'lucide-react-native';
import { CategoryPicker } from './category-picker';
import { ThumbnailPicker } from './thumbnail-picker';
import { FilePicker, SelectedFileInfo } from './file-picker';
import { DuplicateAlertModal } from './duplicate-alert-modal';
import { useItems } from '../../hooks/useItems';
import { ItemCategory, RelicItem, DuplicateCheckResult } from '../../types/models';

interface CreateItemFormProps {
  onSuccess?: (item: RelicItem) => void;
  onCancel?: () => void;
}

export function CreateItemForm({ onSuccess, onCancel }: CreateItemFormProps) {
  const router = useRouter();
  const { addItem, checkDuplicate } = useItems();

  const [category, setCategory] = useState<ItemCategory>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Duplicate modal state
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);

  // Handle category change
  const handleCategoryChange = (newCat: ItemCategory) => {
    setCategory(newCat);
  };

  // Helper to validate fields before checking duplicates
  const validateForm = (): boolean => {
    if (category === 'link') {
      if (!url.trim()) {
        Alert.alert('Missing URL', 'Please enter a valid website or article link URL.');
        return false;
      }
      if (!title.trim()) {
        // If no title, give a helpful suggestion or require it
        Alert.alert('Missing Title', 'Please enter a title for this link.');
        return false;
      }
    } else if (category === 'note') {
      if (!noteContent.trim()) {
        Alert.alert('Empty Note', 'Please enter note content.');
        return false;
      }
      if (!title.trim()) {
        Alert.alert('Missing Title', 'Please enter a title for your note.');
        return false;
      }
    } else if (category === 'file') {
      if (!selectedFile) {
        Alert.alert('No File Selected', 'Please pick a local file, image, or video.');
        return false;
      }
      if (!title.trim()) {
        Alert.alert('Missing Title', 'Please enter a title for this file item.');
        return false;
      }
    }
    return true;
  };

  const parseTags = (): string[] => {
    return tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);
  };

  const executeSave = async (allowDuplicate = false) => {
    try {
      setSaving(true);

      const parsedTags = parseTags();
      const itemTitle = title.trim();

      const candidateData = {
        category,
        title: itemTitle,
        url: category === 'link' ? url.trim() : undefined,
        note: category === 'note' ? noteContent.trim() : (category === 'file' && noteContent.trim() ? noteContent.trim() : undefined),
        image: category === 'file' && selectedFile?.mimeType?.startsWith('image') ? selectedFile.uri : thumbnailUri,
        fileUri: category === 'file' ? selectedFile?.uri : undefined,
        fileName: category === 'file' ? selectedFile?.name : undefined,
        fileSize: category === 'file' ? selectedFile?.size : undefined,
        mimeType: category === 'file' ? selectedFile?.mimeType : undefined,
        tags: parsedTags,
      };

      const result = await addItem(candidateData, { allowDuplicate });

      if (!result.success) {
        if (result.duplicate) {
          setDuplicateInfo(result.duplicate);
          setDuplicateModalVisible(true);
        } else {
          Alert.alert('Error', result.error || 'Failed to save item.');
        }
        return;
      }

      // Success!
      setDuplicateModalVisible(false);
      if (onSuccess && result.item) {
        onSuccess(result.item);
      } else {
        router.back();
      }
    } catch (err) {
      console.error('Failed to create item:', err);
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check for duplicates before completing
    const candidateData = {
      category,
      title: title.trim(),
      url: category === 'link' ? url.trim() : undefined,
      note: category === 'note' ? noteContent.trim() : undefined,
      fileName: category === 'file' ? selectedFile?.name : undefined,
      fileSize: category === 'file' ? selectedFile?.size : undefined,
    };

    const duplicateCheck = checkDuplicate(candidateData);
    if (duplicateCheck.isDuplicate) {
      setDuplicateInfo(duplicateCheck);
      setDuplicateModalVisible(true);
      return;
    }

    await executeSave(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Segmented Picker */}
        <CategoryPicker selected={category} onSelect={handleCategoryChange} />

        {/* --- FORM FIELDS ACCORDING TO CATEGORY --- */}

        {/* 1. LINK CATEGORY */}
        {category === 'link' && (
          <View style={styles.formGroup}>
            {/* URL Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>URL ADDRESS *</Text>
              <View style={styles.inputWrap}>
                <Globe size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  value={url}
                  onChangeText={(text) => {
                    setUrl(text);
                    // Automatically suggest title from domain if title is empty
                    if (!title.trim() && text.includes('.')) {
                      try {
                        const clean = text.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                        if (clean.length > 2) {
                          setTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
                        }
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  placeholder="https://example.com/article"
                  placeholderTextColor="#94A3B8"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.textInputWithIcon}
                />
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>TITLE *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Article or website title"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Optional Thumbnail Image */}
            <ThumbnailPicker
              imageUri={thumbnailUri}
              onImageSelected={setThumbnailUri}
              label="LINK THUMBNAIL (OPTIONAL)"
              helperText="Upload a thumbnail preview for this web item"
            />

            {/* Optional Note */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PERSONAL NOTE / SUMMARY</Text>
              <TextInput
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder="Key takeaways or thoughts about this link..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textArea]}
              />
            </View>
          </View>
        )}

        {/* 2. NOTE CATEGORY */}
        {category === 'note' && (
          <View style={styles.formGroup}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>NOTE TITLE *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Note title or subject"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Note Text Area */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>NOTE CONTENT *</Text>
              <TextInput
                value={noteContent}
                onChangeText={(text) => {
                  setNoteContent(text);
                  if (!title.trim() && text.trim().length > 0) {
                    const firstLine = text.trim().split('\n')[0].slice(0, 40);
                    setTitle(firstLine);
                  }
                }}
                placeholder="Write your note, idea, draft, or snippet here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={[styles.textInput, styles.noteTextArea]}
              />
            </View>

            {/* Optional Thumbnail Image */}
            <ThumbnailPicker
              imageUri={thumbnailUri}
              onImageSelected={setThumbnailUri}
              label="NOTE THUMBNAIL (OPTIONAL)"
              helperText="Attach an image thumbnail to this note"
            />
          </View>
        )}

        {/* 3. LOCAL FILE CATEGORY */}
        {category === 'file' && (
          <View style={styles.formGroup}>
            {/* File Picker */}
            <FilePicker
              file={selectedFile}
              onFileSelected={(file) => {
                setSelectedFile(file);
                if (file && !title.trim()) {
                  // Pre-fill title with friendly file name
                  const cleanName = file.name.replace(/\.[^/.]+$/, '');
                  setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                }
              }}
            />

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ITEM TITLE *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title or description of this file"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Optional Thumbnail if file is not an image */}
            {selectedFile && !selectedFile.mimeType?.startsWith('image') && (
              <ThumbnailPicker
                imageUri={thumbnailUri}
                onImageSelected={setThumbnailUri}
                label="CUSTOM THUMBNAIL (OPTIONAL)"
                helperText="Upload a thumbnail preview for this file"
              />
            )}

            {/* Optional Description / Note */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>DESCRIPTION / NOTE (OPTIONAL)</Text>
              <TextInput
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder="Add context or notes about this file..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textArea]}
              />
            </View>
          </View>
        )}

        {/* Tags Input (Common to all categories) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>TAGS (COMMA SEPARATED)</Text>
          <View style={styles.inputWrap}>
            <TagIcon size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="e.g. design, reading, work"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              style={styles.textInputWithIcon}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.submitRow}>
              <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.submitText}>Save to Relic</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Duplicate Alert Modal */}
      <DuplicateAlertModal
        visible={duplicateModalVisible}
        reason={duplicateInfo?.reason}
        matchedItem={duplicateInfo?.matchedItem}
        onDismiss={() => setDuplicateModalVisible(false)}
        onSaveAnyway={() => {
          setDuplicateModalVisible(false);
          executeSave(true);
        }}
        onViewExisting={(item) => {
          setDuplicateModalVisible(false);
          router.push(`/item/${item.id}`);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  formGroup: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
  textInputWithIcon: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingLeft: 46,
    paddingRight: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    height: 84,
    textAlignVertical: 'top',
  },
  noteTextArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4F46E5', // Indigo-600
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
