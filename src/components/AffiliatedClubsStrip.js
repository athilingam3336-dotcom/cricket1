import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AFFILIATED_CLUBS } from '../data/cricketData';

export default function AffiliatedClubsStrip({ theme }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
      <Text style={[styles.heading, { color: theme.primary }]}>AFFILIATED CLUBS & TALUK TEAMS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
        {AFFILIATED_CLUBS.map((club, idx) => (
          <View
            key={idx}
            style={[styles.clubChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="shield" size={13} color={theme.accentGold} />
            <Text style={[styles.clubText, { color: theme.text }]}>{club}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 16,
  },
  heading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  clubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  clubText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
