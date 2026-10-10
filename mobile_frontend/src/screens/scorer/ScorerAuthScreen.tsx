import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi, setAuthToken, setCurrentUser } from '../../services/api';

export default function ScorerAuthScreen() {
  const { navigate, onExit } = useScorerNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Status feedback states
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | null>(null);

  const handleLogin = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setStatusMessage('Please enter your registered email address.');
      setStatusType('error');
      return;
    }

    if (!cleanPass) {
      setStatusMessage('Please enter your password.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Authenticating credentials...');
    setStatusType('info');

    try {
      const res = await ScorerApi.loginWithPassword(cleanEmail, cleanPass, 'SCORER');
      
      if (res?.token) {
        setAuthToken(res.token);
        if (res.user) setCurrentUser(res.user);
      }

      setStatusMessage('Login successful! Redirecting to Scorer Dashboard...');
      setStatusType('success');

      setTimeout(() => {
        setIsLoading(false);
        navigate('Dashboard', { user: res.user });
      }, 500);

    } catch (err: any) {
      setIsLoading(false);
      const rawMsg = err.message || 'Login failed. Please check your credentials.';
      setStatusMessage(rawMsg);
      setStatusType('error');
    }
  };

  const handleDemoFill = () => {
    setEmail('ramesh@gmail.com');
    setPassword('1234');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onExit?.()} style={styles.backBtn}>
          <Text style={styles.backText}>← Exit to Main</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.cardContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo_transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.mainTitle}>CRICKET FEDERATION OF</Text>
            <Text style={styles.mainSubtitle}>VIRUDHUNAGAR DISTRICT</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Login Here</Text>
              <TouchableOpacity onPress={handleDemoFill}>
                <Text style={styles.demoFillBtn}>⚡ Demo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Login Here with your registered Scorer Email and Password
            </Text>

            {statusMessage && (
              <View
                style={[
                  styles.statusBanner,
                  statusType === 'error' && styles.statusError,
                  statusType === 'success' && styles.statusSuccess,
                  statusType === 'info' && styles.statusInfo
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    statusType === 'error' && styles.statusTextError,
                    statusType === 'success' && styles.statusTextSuccess,
                    statusType === 'info' && styles.statusTextInfo
                  ]}
                >
                  {statusMessage}
                </Text>
              </View>
            )}

            <Text style={styles.label}>Official Scorer Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. ramesh@gmail.com"
              keyboardType="email-address"
              placeholderTextColor="#9bb0cf"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Account Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9bb0cf"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleText}>{showPassword ? '👁️' : '🔒'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionText}>Login Here as Scorer →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.postMessage({ type: 'OPEN_REGISTRATION_SCREEN', initialRole: 'SCORER' }, '*');
                }
              }}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>
                Need to register? Register Here
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <SharedFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', width: '100%' },
  header: { padding: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { alignSelf: 'flex-start', padding: 8, paddingLeft: 0 },
  backText: { color: '#eab308', fontSize: 16, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  mainTitle: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  mainSubtitle: { color: '#b45309', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  scroll: { flexGrow: 1, width: '100%' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, paddingBottom: 40, width: '100%' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', maxWidth: 450, elevation: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { color: '#1e293b', fontSize: 20, fontWeight: 'bold' },
  demoFillBtn: { color: '#0284c7', fontSize: 12, fontWeight: 'bold', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  subtitle: { color: '#64748b', fontSize: 13, marginBottom: 20 },
  statusBanner: { padding: 12, borderRadius: 6, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  statusSuccess: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  statusInfo: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  statusText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  statusTextError: { color: '#b91c1c' },
  statusTextSuccess: { color: '#15803d' },
  statusTextInfo: { color: '#1d4ed8' },
  label: { color: '#334155', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: '#f8fafc', color: '#1e293b', borderWidth: 1, borderColor: '#cbd5e1', padding: 14, borderRadius: 6, marginBottom: 16, fontSize: 15 },
  passwordContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, marginBottom: 16, alignItems: 'center', paddingRight: 12 },
  passwordInput: { flex: 1, color: '#1e293b', padding: 14, fontSize: 15 },
  toggleText: { fontSize: 16 },
  actionBtn: { backgroundColor: '#eab308', padding: 16, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  actionText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  btnDisabled: { opacity: 0.6 },
  linkBtn: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#b45309', textDecorationLine: 'underline', fontSize: 13, fontWeight: '600' }
});