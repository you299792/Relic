import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { AlertTriangle, ExternalLink, X } from 'lucide-react-native';
import { RelicItem } from '../../types/models';

interface DuplicateAlertModalProps {
  visible: boolean;
  reason?: string;
  matchedItem?: RelicItem;
  onDismiss: () => void;
  onSaveAnyway: () => void;
  onViewExisting?: (item: RelicItem) => void;
}

export function DuplicateAlertModal({
  visible,
  reason,
  matchedItem,
  onDismiss,
  onSaveAnyway,
  onViewExisting,
}: DuplicateAlertModalProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header Icon */}
              <View style={styles.iconCircle}>
                <AlertTriangle size={28} color="#D97706" strokeWidth={2.2} />
              </View>

              <Text style={styles.title}>Duplicate Detected</Text>
              <Text style={styles.subtitle}>
                Relic found an item in your archive that matches what you are trying to save.
              </Text>

              {/* Duplicate Details Box */}
              <View style={styles.detailsBox}>
                <Text style={styles.reasonText}>{reason || 'A matching item already exists.'}</Text>
                {matchedItem && (
                  <View style={styles.matchedItemPreview}>
                    <Text style={styles.matchedItemTitle} numberOfLines={1}>
                      Existing: {matchedItem.title}
                    </Text>
                    <Text style={styles.matchedItemMeta}>
                      Saved: {matchedItem.savedAt || 'Previously'} • Type: {matchedItem.category.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                {matchedItem && onViewExisting && (
                  <TouchableOpacity
                    style={styles.viewExistingBtn}
                    onPress={() => onViewExisting(matchedItem)}
                    activeOpacity={0.8}
                  >
                    <ExternalLink size={16} color="#4F46E5" />
                    <Text style={styles.viewExistingText}>View Existing Item</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onDismiss}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Edit Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveAnywayBtn}
                    onPress={onSaveAnyway}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveAnywayText}>Save Anyway</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Close Button Top Right */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onDismiss}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 8,
  },
  matchedItemPreview: {
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: 8,
    marginTop: 4,
  },
  matchedItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
  matchedItemMeta: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  viewExistingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
  },
  viewExistingText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  saveAnywayBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAnywayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
