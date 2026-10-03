import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { localAssets } from '../utils/assets';
import { floodlightStyles } from '../theme/colors';

export default function Header({
  theme,
  isDark,
  toggleTheme,
  floodlightMode,
  cycleFloodlightMode,
  onOpenLogin,
  onOpenRegister,
}) {
  const currentFl = floodlightStyles[floodlightMode] || floodlightStyles.on;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.topRow}>
        {/* Brand Block */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoWrapper, { borderColor: theme.primary }]}>
            <Image
              source={localAssets.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleWrapper}>
            <Text style={[styles.mainTitle, { color: theme.text }]} numberOfLines={1}>
              CRICKET FEDERATION
            </Text>
            <Text style={[styles.subTitle, { color: theme.primary }]} numberOfLines={1}>
              OF VIRUDHUNAGAR DISTRICT
            </Text>
            <View style={styles.affiliationRow}>
              <MaterialCommunityIcons name="certificate" size={11} color={theme.accentGold} />
              <Text style={[styles.affiliationText, { color: theme.textSecondary }]}>
                Affiliated to TNCA
              </Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          {/* Single Main Auth Option: Login */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenLogin || onOpenRegister}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="sign-in-alt" size={11} color="#000" />
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>

          {/* Floodlight Toggle */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                borderColor: currentFl.indicatorColor,
                backgroundColor: floodlightMode !== 'off' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              },
            ]}
            onPress={cycleFloodlightMode}
            activeOpacity={0.7}
            accessibilityLabel="Cycle Floodlights"
          >
            <MaterialCommunityIcons
              name={currentFl.icon}
              size={18}
              color={currentFl.indicatorColor}
            />
          </TouchableOpacity>

          {/* Theme Toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Theme"
          >
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={16}
              color={isDark ? theme.accentGold : '#F59E0B'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: '#070D1E',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logo: {
    width: 38,
    height: 38,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  affiliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    gap: 4,
  },
  affiliationText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  loginBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  registerBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
