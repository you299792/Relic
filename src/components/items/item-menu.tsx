import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react-native';

interface ItemMenuProps {
  title: string;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  className?: string;
  style?: object;
  iconColor?: string;
}

export function ItemMenu({
  title,
  onEdit,
  onDelete,
  className = 'bg-white/90 w-9 h-9 rounded-full items-center justify-center',
  style,
  iconColor = '#475569',
}: ItemMenuProps) {
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setVisible(false);
    setConfirming(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={(e) => {
          e?.stopPropagation?.();
          setVisible(true);
        }}
        hitSlop={8}
        activeOpacity={0.7}
        className={className}
        style={style}
        accessibilityLabel="Item options"
      >
        <MoreVertical size={18} color={iconColor} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={close}>
          <Pressable
            className="bg-white rounded-t-[28px] px-5 pt-5 pb-9"
            onPress={(e) => e.stopPropagation()}
          >
            {confirming ? (
              <>
                <Text className="text-slate-900 text-lg font-extrabold mb-1.5">Delete item?</Text>
                <Text className="text-slate-500 text-sm mb-5" numberOfLines={2}>
                  {`"${title}" will be permanently removed. This can't be undone.`}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setConfirming(false)}
                    activeOpacity={0.8}
                    className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center"
                  >
                    <Text className="text-slate-700 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      close();
                      await onDelete();
                    }}
                    activeOpacity={0.8}
                    className="flex-1 bg-red-500 py-3.5 rounded-2xl items-center"
                  >
                    <Text className="text-white font-bold">Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest mb-3" numberOfLines={1}>
                  {title.toUpperCase()}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    close();
                    onEdit();
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 py-3.5"
                >
                  <View className="bg-indigo-50 w-10 h-10 rounded-full items-center justify-center">
                    <Pencil size={18} color="#4F46E5" />
                  </View>
                  <Text className="text-slate-800 text-base font-semibold">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setConfirming(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 py-3.5"
                >
                  <View className="bg-red-50 w-10 h-10 rounded-full items-center justify-center">
                    <Trash2 size={18} color="#EF4444" />
                  </View>
                  <Text className="text-red-500 text-base font-semibold">Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
