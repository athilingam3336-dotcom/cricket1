import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { localAssets } from '../utils/assets';

export default function AcademySection({ theme, onOpenAcademyAdmission }) {
  const handleDownloadProspectus = () => {
    Alert.alert(
      'Academy Prospectus (2026-27)',
      'Virudhunagar District Cricket Academy curriculum, fee structure, and trial schedule PDF downloaded.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
            <FontAwesome5 name="graduation-cap" size={11} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>CFVD HIGH PERFORMANCE</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Virudhunagar District Cricket Academy</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          Guided by BCCI & TNCA Certified Level 2 coaches, our academy offers year-round coaching, video biomechanics, physical conditioning, and match simulations for state trials.
        </Text>

        <View style={styles.featuresList}>
          <View style={[styles.featureItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
            <MaterialCommunityIcons name="target" size={18} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fTitle, { color: theme.text }]}>BCCI Level 1 & 2 Coaches</Text>
              <Text style={[styles.fDesc, { color: theme.textSecondary }]}>Personalized batting & bowling biomechanics</Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
            <MaterialCommunityIcons name="video" size={18} color={theme.accentGold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fTitle, { color: theme.text }]}>High-Speed Video Analysis</Text>
              <Text style={[styles.fDesc, { color: theme.textSecondary }]}>Real-time technical corrections and tactical coaching</Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
            <MaterialCommunityIcons name="dumbbell" size={18} color={theme.accentGreen} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fTitle, { color: theme.text }]}>Fitness & Physiotherapy</Text>
              <Text style={[styles.fDesc, { color: theme.textSecondary }]}>Yo-Yo test benchmarks and injury rehabilitation</Text>
            </View>
          </View>
        </View>

        <View style={styles.btnsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenAcademyAdmission}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="user-plus" size={12} color="#000" />
            <Text style={styles.primaryBtnText}>Academy Admission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.border }]}
            onPress={handleDownloadProspectus}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="download" size={15} color={theme.text} />
            <Text style={[styles.outlineBtnText, { color: theme.text }]}>Prospectus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  badgeRow: {
    marginBottom: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  desc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  fTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  fDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
  btnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
