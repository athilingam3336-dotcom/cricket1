import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GROUNDS_DATA } from '../data/cricketData';
import { getAsset } from '../utils/assets';

export default function GroundsSection({ theme }) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <MaterialCommunityIcons name="stadium-variant" size={12} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>PLAYING VENUES</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>District Cricket Facilities & Grounds</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          BCCI-curated turf wickets, indoor practice nets, and floodlit grounds adhering to professional match standards
        </Text>
      </View>

      <View style={styles.groundsList}>
        {GROUNDS_DATA.map((ground) => (
          <View
            key={ground.id}
            style={[styles.groundCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.imageWrap}>
              <Image
                source={getAsset(ground.imageKey)}
                style={styles.groundImg}
                resizeMode="cover"
              />
              <View style={[styles.groundBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.groundBadgeText}>{ground.badge}</Text>
              </View>
            </View>

            <View style={styles.groundInfo}>
              <Text style={[styles.groundName, { color: theme.text }]}>{ground.name}</Text>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={13} color={theme.primary} />
                <Text style={[styles.locationText, { color: theme.textSecondary }]}>{ground.location}</Text>
              </View>
              <Text style={[styles.descText, { color: theme.textSecondary }]}>{ground.desc}</Text>

              {/* Facilities pills */}
              <View style={styles.facilitiesRow}>
                {ground.facilities.map((fac, idx) => (
                  <View key={idx} style={[styles.facPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                    <MaterialCommunityIcons name="check" size={11} color={theme.accentGold} />
                    <Text style={[styles.facText, { color: theme.text }]}>{fac}</Text>
                  </View>
                ))}
              </View>
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
  groundsList: {
    gap: 12,
  },
  groundCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  groundImg: {
    width: '100%',
    height: '100%',
  },
  groundBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  groundBadgeText: {
    color: '#000',
    fontSize: 9.5,
    fontWeight: '900',
  },
  groundInfo: {
    padding: 12,
  },
  groundName: {
    fontSize: 14,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
  },
  descText: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  facPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  facText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
