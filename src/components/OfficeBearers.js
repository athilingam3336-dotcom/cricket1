import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { OFFICE_BEARERS } from '../data/cricketData';

export default function OfficeBearers({ theme }) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <FontAwesome5 name="landmark" size={10} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>GOVERNING BODY</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Heritage & Office Bearers</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          The accredited administration guiding district cricket under Tamil Nadu Cricket Association
        </Text>
      </View>

      {/* Heritage card */}
      <View style={[styles.heritageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.heritageText, { color: theme.textSecondary }]}>
          The <Text style={{ color: theme.text, fontWeight: '800' }}>Cricket Federation of Virudhunagar District (CFVD)</Text> is the sole governing body for cricket within the district. Our official emblem features the sacred temple gopuram of <Text style={{ color: theme.primary, fontWeight: '800' }}>Srivilliputhur</Text>, symbolizing the resilience, discipline, and sporting pride of our cricketers.
        </Text>
      </View>

      <Text style={[styles.subHead, { color: theme.text }]}>Honorary Apex Council (2025 – 2028)</Text>

      <View style={styles.bearersGrid}>
        {OFFICE_BEARERS.map((bearer, idx) => (
          <View
            key={idx}
            style={[
              styles.bearerCard,
              {
                backgroundColor: theme.surface,
                borderColor: bearer.highlight ? theme.primary : theme.borderLight,
              },
            ]}
          >
            <View style={[styles.avatarWrap, { backgroundColor: bearer.highlight ? theme.primary : theme.surfaceElevated }]}>
              <FontAwesome5 name="user-tie" size={16} color={bearer.highlight ? '#000' : theme.primary} />
            </View>
            <Text style={[styles.bearerName, { color: theme.text }]} numberOfLines={1}>{bearer.name}</Text>
            <Text style={[styles.bearerRole, { color: theme.primary }]}>{bearer.role}</Text>
            <Text style={[styles.bearerTenure, { color: theme.textMuted }]}>{bearer.tenure}</Text>
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
  heritageCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  heritageText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  subHead: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  bearersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bearerCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  bearerName: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  bearerRole: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
  bearerTenure: {
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 2,
  },
});
