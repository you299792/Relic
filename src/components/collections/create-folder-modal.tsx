import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLLECTION_COLORS } from '../../hooks/useCollections';

interface CreateFolderModalProps {
  visible: boolean;
  title?: string;
  defaultColor?: string;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export function CreateFolderModal(props: CreateFolderModalProps) {
  // Remount the inner form every time the sheet opens so its state starts fresh
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      {props.visible && <Form {...props} />}
    </Modal>
  );
}

function Form({ title = 'NEW FOLDER', defaultColor, onClose, onCreate }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColor ?? COLLECTION_COLORS[0]);
  const canCreate = name.trim().length > 0;
  const submit = () => canCreate && onCreate(name, color);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-[28px] px-5 pt-5 pb-9" onPress={(e) => e.stopPropagation()}>
          <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest mb-3">{title}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor="#94A3B8"
            autoFocus
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={submit}
            className="bg-slate-100 rounded-2xl px-4 py-3.5 text-base text-slate-800 mb-4"
          />
          <View className="flex-row gap-3 mb-5">
            {COLLECTION_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                accessibilityLabel={`Color ${c}`}
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#CBD5E1' }}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={submit}
            disabled={!canCreate}
            activeOpacity={0.85}
            className={`rounded-2xl py-3.5 items-center ${canCreate ? 'bg-indigo-600' : 'bg-indigo-300'}`}
          >
            <Text className="text-white text-base font-bold">Create folder</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
