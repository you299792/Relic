import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link as LinkIcon, FileText, HardDrive } from 'lucide-react-native';
import { ItemCategory } from '../../types/models';

interface CategoryPickerProps {
  selected: ItemCategory;
  onSelect: (category: ItemCategory) => void;
}

const CATEGORIES: { id: ItemCategory; label: string; icon: typeof LinkIcon; description: string }[] = [
  { id: 'link', label: 'Link', icon: LinkIcon, description: 'Save URL & Webpage' },
  { id: 'note', label: 'Notes', icon: FileText, description: 'Write or paste text' },
  { id: 'file', label: 'Local File', icon: HardDrive, description: 'Upload media & files' },
];

export function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>CATEGORY</Text>
      <View style={styles.tabRow}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selected === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => onSelect(cat.id)}
              style={[
                styles.tabButton,
                isSelected ? styles.tabButtonActive : styles.tabButtonInactive,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  isSelected ? styles.iconWrapActive : styles.iconWrapInactive,
                ]}
              >
                <Icon
                  size={18}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                  strokeWidth={2.2}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isSelected ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  tabButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconWrapActive: {
    backgroundColor: '#4F46E5',
  },
  iconWrapInactive: {
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
});
