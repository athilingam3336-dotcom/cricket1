import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigationContext';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function ScorerAuthScreen() {
  const { navigate, onExit, params } = useScorerNavigation();

  const [isLoginMode, setIsLoginMode] = useState<boolean>(params?.initialMode !== 'register');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(params?.initialEmail || '');
  const [otp, setOtp] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [association, setAssociation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  // Confirmation Modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);

  // Status feedback states
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | null>(null);

  // Synchronize when navigation params change
  useEffect(() => {
    if (params?.initialMode === 'register') {
      setIsLoginMode(false);
    }
    if (params?.initialEmail) {
      setEmail(params.initialEmail);
    }
  }, [params]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // 1. Send OTP for Scorer Login
  const handleSendOTP = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setStatusMessage('Please enter your email address.');
      setStatusType('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setStatusMessage('Please enter a valid email address.');
      setStatusType('error');
      return;
    }

    setIsSendingOtp(true);
    setStatusMessage(`Verifying scorer accreditation for ${cleanEmail}...`);
    setStatusType('info');

    try {
      const res = await ScorerApi.sendScorerOtp(cleanEmail);
      if (res && res.success) {
        setOtpSent(true);
        setResendCountdown(30);
        setStatusMessage('OTP sent successfully. Check your registered email.');
        setStatusType('success');
      } else {
        setOtpSent(false);
        setStatusMessage(res?.message || 'Unable to send OTP. Please try again.');
        setStatusType('error');
      }
    } catch (err: any) {
      setOtpSent(false);

      // If account does NOT exist -> AUTOMATICALLY NAVIGATE to Register New Scorer page!
      // DO NOT show "Email not registered" dead-end! Preserve entered email!
      if (
        err.notFound ||
        err.status === 404 ||
        (err.message && (
          err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('register first') ||
          err.message.toLowerCase().includes('not registered')
        ))
      ) {
        setIsLoginMode(false);
        setOtpSent(false);
        setStatusMessage(null);
        setStatusType(null);
        return;
      }

      // If account exists but status = PENDING:
      if (err.scorerStatus === 'PENDING' || (err.message && err.message.toLowerCase().includes('pending admin approval'))) {
        setStatusMessage('Your scorer registration is pending admin approval.');
        setStatusType('error');
        return;
      }

      // If account exists but status = REJECTED:
      if (err.scorerStatus === 'REJECTED' || (err.message && err.message.toLowerCase().includes('rejected'))) {
        setStatusMessage('Your scorer registration was rejected. Please contact the administrator.');
        setStatusType('error');
        return;
      }

      setStatusMessage(err.message || 'Unable to send OTP. Please try again.');
      setStatusType('error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify Scorer OTP Login
  const handleLogin = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      setStatusMessage('Please enter your email address.');
      setStatusType('error');
      return;
    }

    if (!cleanOtp) {
      setStatusMessage('Please enter the OTP sent to your email.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Authenticating official scorer credentials...');
    setStatusType('info');

    try {
      const res = await ScorerApi.verifyScorerOtp(cleanEmail, cleanOtp);
      setStatusMessage('Authentication successful! Launching Scorer Dashboard...');
      setStatusType('success');

      setTimeout(() => {
        setIsLoading(false);
        navigate('Dashboard', { user: res.scorer || res.user });
      }, 500);
    } catch (err: any) {
      setStatusMessage(err.message || 'Invalid OTP. Please check and try again.');
      setStatusType('error');
      setIsLoading(false);
    }
  };

  // 3. Register New Scorer Submit
  const handleRegister = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanAssociation = association.trim();

    // Field validations
    if (!cleanName) {
      setStatusMessage('Please enter your Full Name.');
      setStatusType('error');
      return;
    }

    if (!cleanEmail) {
      setStatusMessage('Please enter your Email Address.');
      setStatusType('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setStatusMessage('Please provide a valid Email Address.');
      setStatusType('error');
      return;
    }

    if (!cleanPhone) {
      setStatusMessage('Please enter your Mobile Number.');
      setStatusType('error');
      return;
    }

    if (!cleanAssociation) {
      setStatusMessage('Please enter your Cricket Association / District.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Submitting scorer registration to Express.js backend...');
    setStatusType('info');

    try {
      const res = await ScorerApi.registerScorer({
        full_name: cleanName,
        email: cleanEmail,
        mobile: cleanPhone,
        association: cleanAssociation
      });

      setIsLoading(false);
      setStatusMessage(null);
      setStatusType(null);

      // Show professional confirmation modal
      setShowConfirmationModal(true);
    } catch (err: any) {
      setIsLoading(false);
      if (err.scorerStatus === 'REJECTED' || (err.message && err.message.toLowerCase().includes('rejected'))) {
        setStatusMessage('Your scorer registration was rejected. Please contact the administrator.');
      } else {
        setStatusMessage(err.message || 'Scorer registration failed. Please try again.');
      }
      setStatusType('error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (onExit) onExit('Home');
            else navigate('Auth');
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.title}>
              {isLoginMode ? 'Scorer Portal Login' : 'Register New Scorer'}
            </Text>
            <Text style={styles.subtitle}>
              {isLoginMode
                ? (otpSent ? 'Enter the 6-digit verification code sent to your email' : 'Official match day scoring access for certified scorers & umpires')
                : 'Accreditation request for official match day scoring panel'}
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

            {isLoginMode ? (
              // --- SCORER LOGIN MODE ---
              <>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Official Registered Email *</Text>
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
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. scorer@cfvd.org"
                  keyboardType="email-address"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="none"
                  editable={!otpSent}
                />

                {!otpSent ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleSendOTP}
                    disabled={isSendingOtp}
                    activeOpacity={0.8}
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator color="#020612" />
                    ) : (
                      <Text style={styles.actionText}>SEND SCORER OTP</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.label}>Enter 6-digit Scorer OTP *</Text>
                    <TextInput
                      style={styles.input}
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="Enter 6-digit Scorer OTP"
                      maxLength={6}
                      placeholderTextColor="#9bb0cf"
                      keyboardType="number-pad"
                      autoFocus
                    />

                    <View style={styles.otpHelperRow}>
                      <TouchableOpacity
                        style={[
                          styles.resendBtn,
                          (isSendingOtp || isLoading || resendCountdown > 0) && { opacity: 0.6 }
                        ]}
                        onPress={handleSendOTP}
                        disabled={isSendingOtp || isLoading || resendCountdown > 0}
                      >
                        <Text style={styles.resendText}>
                          {isSendingOtp
                            ? 'Sending...'
                            : resendCountdown > 0
                            ? `Resend OTP in ${resendCountdown}s`
                            : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtp('');
                          setStatusMessage(null);
                          setStatusType(null);
                        }}
                      >
                        <Text style={styles.changeEmailLink}>Back to Email</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={handleLogin}
                      disabled={isLoading || isSendingOtp}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#020612" />
                      ) : (
                        <Text style={styles.actionText}>Verify & Launch Scoring</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setIsLoginMode(false);
                    setOtpSent(false);
                    setStatusMessage(null);
                    setStatusType(null);
                  }}
                  style={styles.linkBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>
                    Need scorer accreditation? <Text style={styles.linkHighlight}>Register New Scorer</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // --- REGISTER NEW SCORER MODE ---
              <>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="words"
                />

                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. scorer@cfvd.org"
                  keyboardType="email-address"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9bb0cf"
                />

                <Text style={styles.label}>Cricket Association / District *</Text>
                <TextInput
                  style={styles.input}
                  value={association}
                  onChangeText={setAssociation}
                  placeholder="e.g. Virudhunagar District Cricket Association"
                  placeholderTextColor="#9bb0cf"
                />

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#020612" />
                  ) : (
                    <Text style={styles.actionText}>REGISTER AS SCORER</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsLoginMode(true);
                    setStatusMessage(null);
                    setStatusType(null);
                  }}
                  style={styles.linkBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>
                    Already have an approved account? <Text style={styles.linkHighlight}>Login</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <SharedFooter />
      </ScrollView>

      {/* CONFIRMATION POPUP / MODAL AFTER REGISTRATION */}
      {showConfirmationModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCheckCircle}>
              <Text style={styles.modalCheckMark}>{'\u2713'}</Text>
            </View>

            <Text style={styles.modalTitle}>Registration Submitted</Text>

            <Text style={styles.modalBody}>
              Your scorer registration has been submitted successfully.
            </Text>

            <View style={styles.statusBox}>
              <Text style={styles.statusBoxText}>Status: PENDING ADMIN APPROVAL</Text>
            </View>

            <Text style={styles.modalNotice}>
              An administrator must verify and approve your scorer account before you can access the Scorer Portal.
            </Text>

            <TouchableOpacity
              style={styles.modalOkBtn}
              onPress={() => {
                setShowConfirmationModal(false);
                setIsLoginMode(true);
                if (onExit) {
                  onExit('Home', { role: 'SCORER', scorerEmail: email.trim() });
                } else {
                  navigate('Auth');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020612',
    width: '100%'
  },
  header: {
    padding: 16,
    backgroundColor: '#081226',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    elevation: 4
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    paddingLeft: 0
  },
  backText: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: 'bold'
  },
  scroll: {
    flexGrow: 1,
    width: '100%'
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
    width: '100%'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  logo: {
    width: 75,
    height: 75,
    marginBottom: 10
  },
  mainTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.2
  },
  mainSubtitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  card: {
    backgroundColor: '#0a162e',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18
  },
  statusBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444'
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e'
  },
  statusInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6'
  },
  statusText: {
    fontSize: 13.5,
    lineHeight: 19
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
    color: '#e2e8f0',
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 6
  },
  editEmailText: {
    color: '#D4AF37',
    fontSize: 12.5,
    fontWeight: '700'
  },
  input: {
    backgroundColor: '#040d1f',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14.5,
    marginBottom: 16
  },
  inputDisabled: {
    backgroundColor: 'rgba(4, 13, 31, 0.6)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    color: '#94a3b8'
  },
  actionBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  actionText: {
    color: '#020612',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  otpHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  resendBtn: {
    paddingVertical: 4
  },
  resendText: {
    color: '#D4AF37',
    fontSize: 12.5,
    fontWeight: '700'
  },
  changeEmailLink: {
    color: '#94a3b8',
    fontSize: 12.5
  },
  linkBtn: {
    marginTop: 10,
    alignItems: 'center'
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 13.5
  },
  linkHighlight: {
    color: '#D4AF37',
    fontWeight: 'bold'
  },

  // Modal Backdrop & Card
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999
  },
  modalCard: {
    backgroundColor: '#0a162e',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12
  },
  modalCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  modalCheckMark: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '900'
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3
  },
  modalBody: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20
  },
  statusBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#eab308',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  statusBoxText: {
    color: '#fef08a',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  modalNotice: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 19
  },
  modalOkBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4
  },
  modalOkText: {
    color: '#020612',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8
  }
});
