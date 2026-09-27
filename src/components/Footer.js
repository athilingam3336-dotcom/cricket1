import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { localAssets } from '../utils/assets';

export default function Footer({ theme, onOpenRegister, onNavigateMatches, onNavigateStandings }) {
  const showInfo = (title, message) => {
    Alert.alert(title, message);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderTopColor: theme.border }]}>
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <Image source={localAssets.logo} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainName, { color: theme.text }]}>Cricket Federation of Virudhunagar District</Text>
          <Text style={[styles.motto, { color: theme.primary }]}>"Enjoy the game and chase your dreams"</Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: theme.textSecondary }]}>
        The accredited governing cricket administration for Virudhunagar district, affiliated with The Tamil Nadu Cricket Association (TNCA). Dedicated to preserving the spirit of cricket and nurturing state & national champions.
      </Text>

      {/* Affiliation Tag */}
      <View style={[styles.affilBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="certificate" size={13} color={theme.accentGold} />
        <Text style={[styles.affilText, { color: theme.primary }]}>
          Affiliated to TNCA & Recognized by SDAT
        </Text>
      </View>

      {/* Social Links */}
      <View style={styles.socialRow}>
        {[
          { icon: 'facebook', label: 'Facebook' },
          { icon: 'twitter', label: 'X (Twitter)' },
          { icon: 'instagram', label: 'Instagram' },
          { icon: 'youtube', label: 'YouTube' },
          { icon: 'whatsapp', label: 'WhatsApp' },
        ].map((s, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.socialIcon, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}
            onPress={() => showInfo(s.label, `Official CFVD ${s.label} channel.`)}
          >
            <MaterialCommunityIcons name={s.icon} size={15} color={theme.primary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Nav Grid */}
      <View style={[styles.quickNav, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
        <TouchableOpacity onPress={onNavigateMatches} style={styles.navLink}>
          <MaterialCommunityIcons name="chevron-right" size={13} color={theme.primary} />
          <Text style={[styles.navLinkText, { color: theme.textSecondary }]}>Live Matches & Scores</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNavigateStandings} style={styles.navLink}>
          <MaterialCommunityIcons name="chevron-right" size={13} color={theme.primary} />
          <Text style={[styles.navLinkText, { color: theme.textSecondary }]}>League Points Table</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenRegister} style={styles.navLink}>
          <MaterialCommunityIcons name="chevron-right" size={13} color={theme.primary} />
          <Text style={[styles.navLinkText, { color: theme.textSecondary }]}>Player ID Enrollment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => showInfo('League By-Laws', 'TNCA District Cricket By-Laws & Code of Ethics.')}
          style={styles.navLink}
        >
          <MaterialCommunityIcons name="chevron-right" size={13} color={theme.primary} />
          <Text style={[styles.navLinkText, { color: theme.textSecondary }]}>Integrity & By-Laws</Text>
        </TouchableOpacity>
      </View>

      {/* Copyright */}
      <Text style={[styles.copyText, { color: theme.textMuted }]}>
        © 2026 Cricket Federation of Virudhunagar District. All Rights Reserved. Affiliated to The Tamil Nadu Cricket Association (TNCA).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  logo: {
    width: 38,
    height: 38,
  },
  mainName: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  motto: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },
  desc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  affilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  affilText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNav: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 10,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLinkText: {
    fontSize: 11,
  },
  copyText: {
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 13,
  },
});
