import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Folder, ChevronRight } from 'lucide-react-native';

export interface FolderRowData {
  id: string;
  name: string;
  color: string;
  itemCount: number;
  folderCount: number;
  /** Optional line such as "in Parent" shown instead of the counts */
  caption?: string;
}

const softShadow = {
  shadowColor: '#64748B',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

export function folderSummary(f: Pick<FolderRowData, 'itemCount' | 'folderCount'>) {
  const parts = [`${f.itemCount} ${f.itemCount === 1 ? 'item' : 'items'}`];
  if (f.folderCount > 0) parts.push(`${f.folderCount} ${f.folderCount === 1 ? 'folder' : 'folders'}`);
  return parts.join(' · ');
}

export function FolderRow({ folder, onPress }: { folder: FolderRowData; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white p-4 rounded-[20px] flex-row items-center"
      style={softShadow}
    >
      <View className="p-3 rounded-xl mr-4" style={{ backgroundColor: `${folder.color}15` }}>
        <Folder color={folder.color} size={24} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-800 font-bold text-lg mb-0.5" numberOfLines={1}>
          {folder.name}
        </Text>
        <Text className="text-slate-500 text-sm font-medium" numberOfLines={1}>
          {folder.caption ?? folderSummary(folder)}
        </Text>
      </View>
      <ChevronRight color="#CBD5E1" size={20} />
    </TouchableOpacity>
  );
}
