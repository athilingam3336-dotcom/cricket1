/**
 * src/admin/components/AdminProtectedRoute.tsx
 * Route Guard enforcing Admin-Only access.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminLoginPage from '../pages/AdminLoginPage';

interface Props {
  children: React.ReactNode;
  onExitToPublic?: () => void;
  onUnauthorized?: () => void;
}

export const AdminProtectedRoute: React.FC<Props> = ({ children, onExitToPublic, onUnauthorized }) => {
  const { isAuthenticated, isLoading, adminUser } = useAdminAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f2452" />
        <Text style={styles.loadingText}>Verifying administrator credentials...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !adminUser || adminUser.role !== 'ADMIN') {
    if (onUnauthorized) {
      onUnauthorized();
      return null;
    }
    return <AdminLoginPage onLoginSuccess={() => {}} onBackToHome={onExitToPublic} />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600'
  }
});

export default AdminProtectedRoute;
