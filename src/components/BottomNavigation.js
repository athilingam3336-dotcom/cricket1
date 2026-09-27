import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function BottomNavigation({ currentTab, setTab, theme }) {
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home-variant', isMaterial: true },
    { key: 'matches', label: 'Matches', icon: 'cricket', isMaterial: true, badge: '2' },
    { key: 'tables', label: 'Tables', icon: 'format-list-numbered', isMaterial: true },
    { key: 'stats', label: 'Stats', icon: 'chart-line', isMaterial: true },
    { key: 'more', label: 'More', icon: 'dots-horizontal-circle', isMaterial: true },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {tabs.map((t) => {
        const isActive = currentTab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabBtn}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={t.icon}
                size={22}
                color={isActive ? theme.primary : theme.textSecondary}
              />
              {t.badge && (
                <View style={[styles.badge, { backgroundColor: theme.accentRed }]}>
                  <Text style={styles.badgeText}>{t.badge}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.primary : theme.textSecondary,
                  fontWeight: isActive ? '800' : '500',
                },
              ]}
            >
              {t.label}
            </Text>
            {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    borderRadius: 7,
    paddingHorizontal: 4,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
