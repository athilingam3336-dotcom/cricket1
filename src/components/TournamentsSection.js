import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { TOURNAMENTS_DATA } from '../data/cricketData';

export default function TournamentsSection({ theme, onNavigateStandings, onOpenRegister }) {
  const handleDownloadFixtures = (title) => {
    Alert.alert(
      'Fixtures Downloaded',
      `Official schedule and venue handbook for "${title}" has been saved to your downloads.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <FontAwesome5 name="trophy" size={11} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>LEAGUE STRUCTURE</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Official Sanctioned Tournaments</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Promoting multi-day red-ball traditional cricket and modern white-ball tournaments across Virudhunagar
        </Text>
      </View>

      <View style={styles.tournamentsList}>
        {TOURNAMENTS_DATA.map((t) => (
          <View
            key={t.id}
            style={[styles.tCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.tBadge, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
                <Text style={[styles.tBadgeText, { color: theme.primary }]}>{t.badge}</Text>
              </View>
              <View style={[styles.tBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}>
                <Text style={[styles.tBadgeText, { color: '#60A5FA' }]}>{t.format}</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.tTitle, { color: theme.text }]}>{t.title}</Text>
            <Text style={[styles.tSubtitle, { color: theme.primary }]}>{t.subtitle}</Text>
            <Text style={[styles.tDesc, { color: theme.textSecondary }]}>{t.desc}</Text>

            {/* Specs */}
            <View style={[styles.specsWrap, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
              {t.specs.map((spec, sidx) => (
                <View key={sidx} style={styles.specItem}>
                  <MaterialCommunityIcons name="check-circle" size={12} color={theme.accentGold} />
                  <Text style={[styles.specText, { color: theme.textSecondary }]}>{spec}</Text>
                </View>
              ))}
            </View>

            {/* Footer Buttons */}
            <View style={styles.tFooter}>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: theme.primary }]}
                onPress={onNavigateStandings}
              >
                <Text style={[styles.outlineBtnText, { color: theme.primary }]}>View Table</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleDownloadFixtures(t.title)}
              >
                <Text style={styles.primaryBtnText}>Fixtures PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  tournamentsList: {
    gap: 12,
  },
  tCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  tTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
    marginBottom: 6,
  },
  tDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  specsWrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    gap: 4,
    marginBottom: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specText: {
    fontSize: 11,
  },
  tFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  outlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
});
