import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Plus, LucideIcon } from 'lucide-react-native';

interface FABProps {
  onPress: () => void;
  icon?: LucideIcon;
  iconColor?: string;
  iconSize?: number;
  backgroundColor?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function FAB({
  onPress,
  icon: Icon = Plus,
  iconColor = '#FFFFFF',
  iconSize = 28,
  backgroundColor = '#4F46E5', // Indigo-600 matching Relic primary
  style,
  accessibilityLabel = 'Add item',
}: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.fab,
        { backgroundColor },
        styles.shadow,
        style,
      ]}
    >
      <Icon color={iconColor} size={iconSize} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 104, // Positioned above the 76px bottom tab bar
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  shadow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
