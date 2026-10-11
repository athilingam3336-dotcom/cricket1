/**
 * src/admin/components/LoadingSkeleton.tsx
 * Professional Loading Skeleton Component for Cricket Association Admin Panel.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  rows?: number;
  count?: number;
  type?: 'line' | 'table' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius
        },
        style
      ]}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Skeleton width="25%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="15%" height={16} />
        <Skeleton width="10%" height={16} />
      </View>
      {Array.from({ length: rows }).map((_, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Skeleton width="25%" height={18} />
          <Skeleton width="20%" height={16} />
          <Skeleton width="20%" height={16} />
          <Skeleton width="15%" height={22} borderRadius={6} />
          <Skeleton width="10%" height={28} borderRadius={6} />
        </View>
      ))}
    </View>
  );
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.cardGrid}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.cardSkeleton}>
          <Skeleton width="40%" height={14} style={{ marginBottom: 10 }} />
          <Skeleton width="60%" height={28} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={12} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
    opacity: 0.7
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20
  },
  cardSkeleton: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18
  }
});

export const LoadingSkeleton: React.FC<SkeletonProps> = ({ type = 'line', rows = 5, count = 4, ...props }) => {
  if (type === 'table') return <TableSkeleton rows={rows} />;
  if (type === 'card') return <CardGridSkeleton count={count} />;
  return <Skeleton {...props} />;
};

export default LoadingSkeleton;
