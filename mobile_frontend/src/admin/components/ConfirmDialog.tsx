/**
 * src/admin/components/ConfirmDialog.tsx
 * Confirmation Dialog Modal for Administrative Operations (Approve, Reject, Delete).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { CloseIcon } from './Icons';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  confirmLabel,
  cancelText = 'Cancel',
  cancelLabel,
  variant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Please specify the reason...',
  onConfirm,
  onCancel
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const activeConfirmText = confirmLabel || confirmText;
  const activeCancelText = cancelLabel || cancelText;

  if (!visible) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    onConfirm(reason.trim());
    setReason('');
  };

  let confirmBg = '#0f2452';
  if (variant === 'danger') confirmBg = '#dc2626';
  if (variant === 'success') confirmBg = '#059669';
  if (variant === 'warning') confirmBg = '#d97706';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <CloseIcon size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.message}>{message}</Text>

          {requireReason && (
            <View style={styles.inputArea}>
              <Text style={styles.inputLabel}>Reason / Remark *</Text>
              <TextInput
                style={[styles.textInput, reasonError && styles.inputError]}
                value={reason}
                onChangeText={(t) => {
                  setReason(t);
                  if (reasonError && t.trim()) setReasonError(false);
                }}
                placeholder={reasonPlaceholder}
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
              {reasonError && (
                <Text style={styles.errorText}>A reason is required to proceed.</Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>{activeCancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmBg }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>{activeConfirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    padding: 4
  },
  message: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16
  },
  inputArea: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 68
  },
  inputError: {
    borderColor: '#ef4444'
  },
  errorText: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  confirmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  }
});

export default ConfirmDialog;
