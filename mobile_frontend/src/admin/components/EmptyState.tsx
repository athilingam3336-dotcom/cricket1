/**
 * src/admin/components/EmptyState.tsx
 * Professional Empty State Component for Cricket Association Admin Panel.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionText && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.btnText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 12
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
    marginBottom: 16
  },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: '#0f2452',
    borderRadius: 8
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  }
});

export default EmptyState;
