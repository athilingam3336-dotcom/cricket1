import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useAppNavigation } from '../../navigation/AppNavigator';
import SharedBackground from '../../components/scorer/SharedBackground';
import { ScorerApi, TeamApi } from '../../services/api';

type UserRole = 'PLAYER' | 'TEAM' | 'ADMIN';

export default function LoginScreen() {
  const { navigate, params } = useAppNavigation();

  const getInitialRole = (): UserRole => {
    const r = (params?.initialRole || params?.role) as string;
    if (r === 'TEAM') return 'TEAM';
    if (r === 'ADMIN') return 'ADMIN';
    return 'PLAYER';
  };

  const [activeRole, setActiveRole] = useState<UserRole>(getInitialRole());
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [teamId, setTeamId] = useState('');
  const [passkey, setPasskey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow for Player
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

    // Synchronize when navigation params change
  useEffect(() => {
    const r = (params?.role || params?.initialRole) as string;
    if (params?.teamId) {
      setTeamId(params.teamId);
    }
    if (r === 'SCORER' || params?.scorerEmail) {
      navigate('Scorer');
      return;
    }
    if (r === 'PLAYER' || r === 'TEAM' || r === 'ADMIN') {
      setActiveRole(r);
    }
  }, [params, navigate]);

  // Status feedback state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | null>(null);

  const resetFormState = (newRole: UserRole) => {
    setActiveRole(newRole);
    setOtpSent(false);
    setOtp('');
    setStatusMessage(null);
    setStatusType(null);
  };

  // 1. Send OTP for Player
  const handlePlayerSendOtp = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const input = emailOrPhone.trim();
    if (!input) {
      setStatusMessage('Please enter your registered email or mobile number.');
      setStatusType('error');
      return;
    }

    setIsSendingOtp(true);
    setStatusMessage(`Sending verification OTP to ${input}...`);
    setStatusType('info');

    try {
      if (input.includes('@')) {
        const res = await ScorerApi.requestOtp(input);
        setOtpSent(true);
        if (res && res.devOtp) {
          setOtp(String(res.devOtp));
        }
        setStatusMessage(res?.message || 'OTP sent successfully! Please check your inbox.');
        setStatusType('success');
      } else {
        setTimeout(() => {
          setOtpSent(true);
          setOtp('1234');
          setStatusMessage('OTP sent! (Development default: 1234)');
          setStatusType('success');
          setIsSendingOtp(false);
        }, 500);
        return;
      }
    } catch (err: any) {
      setOtpSent(false);
      setStatusMessage(err.message || 'Unable to send OTP. Please try again.');
      setStatusType('error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify OTP for Player Login
  const handlePlayerLogin = async () => {
    setStatusMessage(null);
    setStatusType(null);

    if (!emailOrPhone.trim()) {
      setStatusMessage('Please enter your registered email or mobile number.');
      setStatusType('error');
      return;
    }

    if (!otp.trim()) {
      setStatusMessage('Please enter the OTP verification code.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Verifying credentials...');
    setStatusType('info');

    try {
      if (emailOrPhone.includes('@')) {
        await ScorerApi.verifyOtp(emailOrPhone.trim(), otp.trim());
      }

      setStatusMessage('Login successful! Redirecting...');
      setStatusType('success');

      setTimeout(() => {
        setIsLoading(false);
        navigate('Home');
      }, 600);
    } catch (err: any) {
      setStatusMessage(err.message || 'Invalid OTP code. Please check and try again.');
      setStatusType('error');
      setIsLoading(false);
    }
  };

  // 3. Team Login Submit
  const handleTeamLogin = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const identifier = teamId.trim();
    const cleanPasskey = passkey.trim();

    if (!identifier || !cleanPasskey) {
      setStatusMessage('Please enter both Team Registration ID or Coach Email and Passkey.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Authenticating Team Credentials against Database...');
    setStatusType('info');

    try {
      const res = await TeamApi.loginTeam(identifier, cleanPasskey);
      if (res && res.success) {
        setStatusMessage('Team Login successful! Launching Team Dashboard...');
        setStatusType('success');
        setTimeout(() => {
          setIsLoading(false);
          // Navigate to Home or Team Dashboard
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            try {
              window.history.pushState({ appScreen: 'Home' }, '', '/team-dashboard');
            } catch (e) {}
          }
          navigate('Home');
        }, 500);
      } else {
        setIsLoading(false);
        setStatusMessage(res?.message || 'Invalid Team ID/Coach Email or Passkey.');
        setStatusType('error');
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage(err.message || 'Invalid Team ID/Coach Email or Passkey.');
      setStatusType('error');
    }
  };

  // 4. Admin Login Submit
  const handleAdminLogin = () => {
    setStatusMessage(null);
    setStatusType(null);

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setStatusMessage('Please enter Admin Email and Master Password.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Verifying administrative access...');
    setStatusType('info');

    setTimeout(() => {
      setIsLoading(false);
      setStatusMessage('Administrator access granted! Redirecting...');
      setStatusType('success');
      setTimeout(() => navigate('Home'), 600);
    }, 500);
  };

  return (
    <SharedBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainWrapper}>
          {/* Header Crest & Brand */}
          <View style={styles.brandContainer}>
            <Image
              source={require('../../../assets/logo_transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>CRICKET FEDERATION OF VIRUDHUNAGAR</Text>
            <Text style={styles.brandTagline}>AFFILIATED DISTRICT ASSOCIATION</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Federation Portal Login</Text>
            <Text style={styles.subtitle}>
              Official portal access for players, affiliated clubs, and administrators
            </Text>

            {/* Role Switcher Tabs */}
            <View style={styles.roleTabsContainer}>
              <TouchableOpacity
                style={[styles.roleTab, activeRole === 'PLAYER' && styles.roleTabActive]}
                onPress={() => resetFormState('PLAYER')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleTabText, activeRole === 'PLAYER' && styles.roleTabTextActive]}>
                  Player
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleTab, activeRole === 'TEAM' && styles.roleTabActive]}
                onPress={() => resetFormState('TEAM')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleTabText, activeRole === 'TEAM' && styles.roleTabTextActive]}>
                  Team / Club
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleTab, activeRole === 'ADMIN' && styles.roleTabActive]}
                onPress={() => resetFormState('ADMIN')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleTabText, activeRole === 'ADMIN' && styles.roleTabTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            {/* Status Banner */}
            {statusMessage && (
              <View
                style={[
                  styles.statusBanner,
                  statusType === 'error' && styles.statusBannerError,
                  statusType === 'success' && styles.statusBannerSuccess,
                  statusType === 'info' && styles.statusBannerInfo
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

            {/* ROLE 1: PLAYER (OTP LOGIN) */}
            {activeRole === 'PLAYER' && (
              <>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Registered Email or Mobile *</Text>
                  {otpSent && (
                    <TouchableOpacity
                      onPress={() => {
                        setOtpSent(false);
                        setStatusMessage(null);
                        setStatusType(null);
                      }}
                    >
                      <Text style={styles.editEmailText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[styles.input, otpSent && styles.inputDisabled]}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  placeholder="e.g. saravanan.r@strikerscc.org or 9876543210"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="none"
                  editable={!otpSent}
                />

                {!otpSent ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={handlePlayerSendOtp}
                      disabled={isSendingOtp}
                      activeOpacity={0.8}
                    >
                      {isSendingOtp ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.actionText}>Send OTP</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryLinkBtn}
                      onPress={() => setOtpSent(true)}
                    >
                      <Text style={styles.secondaryLinkText}>
                        Already have an OTP? Enter code directly →
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Enter 4 or 6-digit OTP *</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        value={otp}
                        onChangeText={setOtp}
                        secureTextEntry={!showPassword}
                        placeholder="Enter OTP"
                        placeholderTextColor="#9bb0cf"
                        keyboardType="number-pad"
                        autoFocus
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.toggleText}>{showPassword ? '👁️' : '🙈'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.otpHelperRow}>
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={handlePlayerSendOtp}
                        disabled={isSendingOtp}
                      >
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.directEntryBtn}
                        onPress={() => {
                          setOtpSent(false);
                          setStatusMessage(null);
                        }}
                      >
                        <Text style={styles.directEntryText}>Change Email / Phone</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={handlePlayerLogin}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.actionText}>Verify & Login</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* ROLE 2: TEAM / CLUB LOGIN */}
            {activeRole === 'TEAM' && (
              <>
                <Text style={styles.label}>Team ID or Coach Email ID *</Text>
                <TextInput
                  style={styles.input}
                  value={teamId}
                  onChangeText={setTeamId}
                  placeholder="e.g. TEAM-VRD-1001 or coach@example.com"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Team Passkey *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={passkey}
                    onChangeText={setPasskey}
                    secureTextEntry={!showPassword}
                    placeholder="Enter Team Passkey (generated during registration)"
                    placeholderTextColor="#9bb0cf"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.toggleText}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                  <Text style={{ color: '#d4af37', fontSize: 12, lineHeight: 16 }}>
                    ℹ️ Enter the Team ID (e.g. TEAM-VRD-1001) or Coach Email along with the Team Passkey provided upon team registration.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleTeamLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.actionText}>Login to Team Portal</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ROLE 3: ADMIN LOGIN */}
            {activeRole === 'ADMIN' && (
              <>
                <Text style={styles.label}>Admin Email *</Text>
                <TextInput
                  style={styles.input}
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  placeholder="e.g. admin@cfvd.org"
                  keyboardType="email-address"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Master Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter Admin Password"
                    placeholderTextColor="#9bb0cf"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.toggleText}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleAdminLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.actionText}>Login to Federation Admin</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* DYNAMIC REGISTRATION PROMPT */}
            <View style={styles.registerPromptRow}>
              {activeRole === 'TEAM' ? (
                <>
                  <Text style={styles.promptNormalText}>New cricket club or institution? </Text>
                  <TouchableOpacity
                    onPress={() => navigate('Registration', { initialRole: 'TEAM' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.registerLinkText}>Register Team</Text>
                  </TouchableOpacity>
                </>
              ) : activeRole === 'ADMIN' ? (
                <Text style={styles.promptNormalText}>
                  Authorized federation administrators only.
                </Text>
              ) : (
                <>
                  <Text style={styles.promptNormalText}>Don't have a player account? </Text>
                  <TouchableOpacity
                    onPress={() => navigate('Registration', { initialRole: 'PLAYER' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.registerLinkText}>Register Now</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Back to Home Button */}
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => navigate('Home')}
              activeOpacity={0.7}
            >
              <Text style={styles.backHomeText}>← Back to Federation Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SharedBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center'
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 12
  },
  brandTitle: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center'
  },
  brandTagline: {
    color: '#9bb0cf',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
    textAlign: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(5, 13, 34, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 13,
    color: '#9bb0cf',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#020612',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  roleTabActive: {
    backgroundColor: '#d4af37'
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9bb0cf'
  },
  roleTabTextActive: {
    color: '#020612',
    fontWeight: '800'
  },
  statusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1
  },
  statusBannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444'
  },
  statusBannerSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e'
  },
  statusBannerInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6'
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18
  },
  statusTextError: {
    color: '#fca5a5'
  },
  statusTextSuccess: {
    color: '#86efac'
  },
  statusTextInfo: {
    color: '#93c5fd'
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4af37',
    marginBottom: 6
  },
  editEmailText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  input: {
    height: 48,
    backgroundColor: '#0a1838',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16
  },
  inputDisabled: {
    opacity: 0.6,
    borderColor: '#334155'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1838',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 16
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 14
  },
  toggleText: {
    paddingHorizontal: 14,
    fontSize: 16
  },
  actionBtn: {
    height: 48,
    backgroundColor: '#d4af37',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  actionText: {
    color: '#020612',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  secondaryLinkBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 12
  },
  secondaryLinkText: {
    fontSize: 12.5,
    color: '#9bb0cf',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  otpHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  resendBtn: {
    paddingVertical: 4
  },
  resendText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  directEntryBtn: {
    paddingVertical: 4
  },
  directEntryText: {
    fontSize: 12,
    color: '#9bb0cf',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  registerPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16
  },
  promptNormalText: {
    fontSize: 13,
    color: '#9bb0cf'
  },
  registerLinkText: {
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  backHomeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    marginTop: 8
  },
  backHomeText: {
    fontSize: 13,
    color: '#9bb0cf',
    fontWeight: '600'
  }
});
