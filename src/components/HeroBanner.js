import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { localAssets } from '../utils/assets';
import { QUICK_METRICS } from '../data/cricketData';

export default function HeroBanner({ theme, onOpenRegister, onNavigateMatches, onNavigateStandings }) {
  return (
    <View style={styles.container}>
      {/* Background Stadium Card */}
      <ImageBackground
        source={localAssets.stadium}
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 16 }}
      >
        {/* Dark / Gold Gradient Overlay */}
        <View style={styles.overlay}>
          {/* Watermark Crest */}
          <Image
            source={localAssets.logo}
            style={styles.watermark}
            resizeMode="contain"
          />

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 55, 0.25)', borderColor: theme.primary }]}>
              <MaterialCommunityIcons name="shield-check" size={11} color={theme.primary} />
              <Text style={[styles.badgePillText, { color: theme.primary }]}>OFFICIAL DISTRICT BODY</Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: 'rgba(59, 130, 246, 0.25)', borderColor: '#3B82F6' }]}>
              <MaterialCommunityIcons name="certificate" size={11} color="#60A5FA" />
              <Text style={[styles.badgePillText, { color: '#93C5FD' }]}>AFFILIATED TO TNCA</Text>
            </View>
          </View>

          {/* Main Title & Subtitle */}
          <Text style={styles.mainTitle}>
            THE PINNACLE OF{'\n'}
            <Text style={{ color: theme.primary }}>VIRUDHUNAGAR CRICKET</Text>
          </Text>

          <Text style={styles.subTitle}>
            Sanctioning official district multi-day leagues, T20 trophies, school tournaments, and player pathways to Ranji Trophy & TNPL.
          </Text>

          {/* Action Buttons */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: theme.primary }]}
              onPress={onOpenRegister}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="id-card" size={13} color="#000" />
              <Text style={styles.primaryCtaText}>Player Enrollment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryCta, { borderColor: theme.primary }]}
              onPress={onNavigateMatches}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cricket" size={16} color={theme.primary} />
              <Text style={[styles.secondaryCtaText, { color: theme.primary }]}>Live Match Centre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* Metrics Strip */}
      <View style={styles.metricsGrid}>
        {QUICK_METRICS.map((metric) => (
          <View
            key={metric.id}
            style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons
              name={metric.icon}
              size={20}
              color={theme.primary}
              style={styles.metricIcon}
            />
            <Text style={[styles.metricValue, { color: theme.primary }]}>{metric.value}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  imageBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 270,
  },
  overlay: {
    padding: 16,
    backgroundColor: 'rgba(7, 13, 30, 0.88)',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 170,
    height: 170,
    opacity: 0.12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mainTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 26,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
    marginBottom: 16,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  primaryCtaText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  secondaryCtaText: {
    fontWeight: '700',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIcon: {
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
});
