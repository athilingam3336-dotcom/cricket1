import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import SharedFooter from '../../components/scorer/SharedFooter';

export default function ScorerAuthScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // Register State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [association, setAssociation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { navigate, onExit } = useScorerNavigation();

  const handleLogin = () => {
    if (!email || !otp) {
      Alert.alert('Error', 'Please enter email and OTP.');
      return;
    }
    // Simple mock auth for demonstration
    if (otp === '1234') {
      navigate('Dashboard');
    } else {
      Alert.alert('Error', 'Invalid OTP. Use 1234 for testing.');
    }
  };

  const handleRegister = () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    Alert.alert('Success', 'Registration submitted for admin approval!');
    setIsLoginMode(true);
  };

  const handleResendOTP = () => {
    Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} style={styles.backBtn}>
          <Text style={styles.backText}>← Exit to Main</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cardContainer}>
          <View style={styles.logoContainer}>
          <Image source={require('../../../assets/logo_transparent.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.mainTitle}>CRICKET FEDERATION OF</Text>
          <Text style={styles.mainSubtitle}>VIRUDHUNAGAR DISTRICT</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{isLoginMode ? 'Scorer Portal Login' : 'Scorer Registration'}</Text>
          <Text style={styles.subtitle}>{isLoginMode ? 'Enter your details and OTP to access' : 'Create an account to become a scorer'}</Text>

          {!isLoginMode && (
            <>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your Name" placeholderTextColor="#9bb0cf" autoCapitalize="words" />
            </>
          )}

          <Text style={styles.label}>Email Address *</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={isLoginMode ? "admin@example.com" : "scorer@test.com"} keyboardType="email-address" placeholderTextColor="#9bb0cf" autoCapitalize="none" />

          {isLoginMode ? (
            <>
              <Text style={styles.label}>Enter OTP (Use 1234 for testing) *</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} value={otp} onChangeText={setOtp} secureTextEntry={!showPassword} placeholder="Enter 1234" placeholderTextColor="#9bb0cf" keyboardType="number-pad" />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotBtn} onPress={handleResendOTP}>
                <Text style={styles.forgotText}>Resend OTP?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleLogin}>
                <Text style={styles.actionText}>Verify & Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter mobile" keyboardType="phone-pad" placeholderTextColor="#9bb0cf" />

              <Text style={styles.label}>Cricket Association / District *</Text>
              <TextInput style={styles.input} value={association} onChangeText={setAssociation} placeholder="e.g. Virudhunagar District" placeholderTextColor="#9bb0cf" />

              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Enter password" placeholderTextColor="#9bb0cf" />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} placeholder="Confirm password" placeholderTextColor="#9bb0cf" />

              <TouchableOpacity style={styles.actionBtn} onPress={handleRegister}>
                <Text style={styles.actionText}>Register as Scorer</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={styles.linkBtn}>
            <Text style={styles.linkText}>
              {isLoginMode ? "Don't have an account? Register" : "Already have an account? Login"}
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
  header: { padding: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  backBtn: { alignSelf: 'flex-start', padding: 8, paddingLeft: 0 },
  backText: { color: '#eab308', fontSize: 18, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  mainTitle: { color: '#1e293b', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  mainSubtitle: { color: '#b45309', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  scroll: { flexGrow: 1, width: '100%' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, paddingBottom: 40, width: '100%' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', maxWidth: 450, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  title: { color: '#1e293b', fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 13, marginBottom: 24, textAlign: 'center' },
  label: { color: '#334155', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: '#f8fafc', color: '#1e293b', borderWidth: 1, borderColor: '#cbd5e1', padding: 14, borderRadius: 6, marginBottom: 16, fontSize: 15 },
  passwordContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, marginBottom: 16, alignItems: 'center', paddingRight: 10 },
  passwordInput: { flex: 1, color: '#1e293b', padding: 14, fontSize: 15 },
  toggleText: { color: '#0f172a', fontSize: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#0f172a', fontSize: 13, fontWeight: '600' },
  actionBtn: { backgroundColor: '#eab308', padding: 16, borderRadius: 6, alignItems: 'center', marginTop: 4, shadowColor: '#eab308', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  actionText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  linkBtn: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#b45309', textDecorationLine: 'underline', fontSize: 14, fontWeight: '500' }
});
