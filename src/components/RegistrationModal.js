import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { TALUKS, SPECIALTIES, REGISTRATION_TYPES } from '../data/cricketData';

export default function RegistrationModal({ visible, onClose, theme, initialCategory }) {
  const [category, setCategory] = useState(initialCategory || 'player_senior');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [taluk, setTaluk] = useState('Virudhunagar');
  const [speciality, setSpeciality] = useState('Top Order Batter');
  const [mobile, setMobile] = useState('');
  const [tncaId, setTncaId] = useState('');
  const [agreed, setAgreed] = useState(true);

  const handleSubmit = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Field', 'Please enter your Full Name.');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Missing Field', 'Please enter your Contact Mobile number.');
      return;
    }
    if (!agreed) {
      Alert.alert('Required', 'Please accept the declaration to proceed.');
      return;
    }

    const token = 'CFVD-' + Math.floor(100000 + Math.random() * 900000);
    const categoryObj = REGISTRATION_TYPES.find((t) => t.value === category);
    const catLabel = categoryObj ? categoryObj.label : category;

    Alert.alert(
      '✓ Application Submitted',
      `Registration Application Submitted Successfully!\n\nCandidate: ${fullName}\nCategory: ${catLabel}\nTaluk: ${taluk}\nSpecialization: ${speciality}\n\nApplication Reference ID: ${token}\n\nPlease save this Reference ID for the selection trials document verification at the District Sports Complex office.`,
      [
        {
          text: 'Save & Close',
          onPress: () => {
            onClose();
            setFullName('');
            setMobile('');
            setDob('');
            setTncaId('');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>CFVD & TNCA ENROLLMENT</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Season 2026-27 Registration</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Official registration for players, clubs, coaches, and match officials
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Registration Category *</Text>
              <View style={styles.chipsWrap}>
                {REGISTRATION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: category === t.value ? theme.primary : theme.surfaceElevated,
                        borderColor: category === t.value ? theme.primary : theme.borderLight,
                      },
                    ]}
                    onPress={() => setCategory(t.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: category === t.value ? '#000' : theme.textSecondary, fontWeight: category === t.value ? '800' : '500' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name (as in Aadhaar/Birth Cert) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                placeholder="e.g. K. Praveen Kumar"
                placeholderTextColor={theme.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Date of Birth (YYYY-MM-DD) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                placeholder="2008-04-15"
                placeholderTextColor={theme.textMuted}
                value={dob}
                onChangeText={setDob}
              />
            </View>

            {/* Taluk */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Taluk / Area in Virudhunagar *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizChipScroll}>
                {TALUKS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chipSmall,
                      {
                        backgroundColor: taluk === t ? theme.primary : theme.surfaceElevated,
                        borderColor: taluk === t ? theme.primary : theme.borderLight,
                      },
                    ]}
                    onPress={() => setTaluk(t)}
                  >
                    <Text
                      style={[
                        styles.chipSmallText,
                        { color: taluk === t ? '#000' : theme.textSecondary, fontWeight: taluk === t ? '800' : '500' },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Specialization */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Primary Specialization *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizChipScroll}>
                {SPECIALTIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chipSmall,
                      {
                        backgroundColor: speciality === s ? theme.accentGold : theme.surfaceElevated,
                        borderColor: speciality === s ? theme.accentGold : theme.borderLight,
                      },
                    ]}
                    onPress={() => setSpeciality(s)}
                  >
                    <Text
                      style={[
                        styles.chipSmallText,
                        { color: speciality === s ? '#000' : theme.textSecondary, fontWeight: speciality === s ? '800' : '500' },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mobile & TNCA ID */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.text }]}>Contact Mobile *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                  placeholder="+91 94430 00000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.text }]}>TNCA ID (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                  placeholder="TNCA-VRD-2025-089"
                  placeholderTextColor={theme.textMuted}
                  value={tncaId}
                  onChangeText={setTncaId}
                />
              </View>
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={agreed ? theme.primary : theme.textMuted}
              />
              <Text style={[styles.checkboxText, { color: theme.textSecondary }]}>
                I hereby certify that all information submitted is true to the best of my knowledge and I agree to abide by CFVD & TNCA regulations.
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="check-circle" size={14} color="#000" />
              <Text style={styles.submitBtnText}>Submit Application & Generate Token</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    maxHeight: 520,
  },
  bodyContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  chipsWrap: {
    gap: 6,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
  },
  horizChipScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  chipSmall: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipSmallText: {
    fontSize: 11,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
});
