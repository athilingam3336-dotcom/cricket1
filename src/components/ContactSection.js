import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function ContactSection({ theme }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Player Registration & Verification');
  const [message, setMessage] = useState('');

  const subjects = [
    'Player Registration & Verification',
    'Club Affiliation & League Entry',
    'District Turf Ground Booking',
    'Umpire & Scorer Clinic',
    'Grievance / Ombudsman',
  ];

  const handleSendMessage = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your Full Name.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Required', 'Please describe your inquiry message.');
      return;
    }

    Alert.alert(
      '✓ Message Logged',
      `Thank you ${name}! Your official communication regarding "${subject}" has been logged with the CFVD Secretariat. You will receive an official response within 2 business days.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setEmail('');
            setPhone('');
            setMessage('');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <MaterialCommunityIcons name="email-fast" size={12} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>GET IN TOUCH</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Federation Secretariat</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          For tournament registrations, ground bookings, and official inquiries
        </Text>
      </View>

      {/* Contact Info Cards */}
      <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="office-building-marker" size={18} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>Headquarters Address:</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              District Sports Complex Stadium, Collectorate Campus,{'\n'}Virudhunagar, Tamil Nadu - 626 002.
            </Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderTopColor: theme.borderLight }]}>
          <MaterialCommunityIcons name="phone" size={18} color={theme.accentGreen} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>Official Helpline:</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              +91 (04562) 282 445 / +91 94431 88290
            </Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderTopColor: theme.borderLight }]}>
          <MaterialCommunityIcons name="email" size={18} color={theme.accentBlue} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>Email Secretariat:</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              secretary@virudhunagarcricket.tnca.in
            </Text>
          </View>
        </View>
      </View>

      {/* Message Form */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Send an Official Message</Text>
        <Text style={[styles.formSub, { color: theme.textSecondary }]}>
          Submit inquiry directly to the Honorary Secretary
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
            placeholder="e.g. R. Subramanian"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
              placeholder="name@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.text }]}>Mobile Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Department / Category *</Text>
          <View style={styles.chipsWrap}>
            {subjects.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[
                  styles.chip,
                  {
                    backgroundColor: subject === sub ? theme.primary : theme.surfaceElevated,
                    borderColor: subject === sub ? theme.primary : theme.borderLight,
                  },
                ]}
                onPress={() => setSubject(sub)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: subject === sub ? '#000' : theme.textSecondary, fontWeight: subject === sub ? '800' : '500' },
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Message Details *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
            placeholder="Please state your inquiry with Club or Player ID..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: theme.primary }]}
          onPress={handleSendMessage}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="paper-plane" size={13} color="#000" />
          <Text style={styles.sendBtnText}>Send Official Communication</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  sectionHead: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  sectionTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  formCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  formSub: {
    fontSize: 11,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  chipsWrap: {
    gap: 4,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10.5,
  },
  textArea: {
    height: 70,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  sendBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
});
