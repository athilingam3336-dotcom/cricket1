import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BATTING_LEADERS, BOWLING_LEADERS } from '../data/cricketData';

export default function StatsSection({ theme }) {
  const [activeLeaderboard, setActiveLeaderboard] = useState('batting');

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <MaterialCommunityIcons name="chart-line" size={12} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>PERFORMANCE RECORDS</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Season 2026-27 Top Performers</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Leading run scorers and top wicket-takers in official district competitions
        </Text>
      </View>

      {/* Switcher */}
      <View style={[styles.switchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.switchBtn,
            activeLeaderboard === 'batting' && { backgroundColor: '#F97316' },
          ]}
          onPress={() => setActiveLeaderboard('batting')}
        >
          <MaterialCommunityIcons name="cricket" size={14} color={activeLeaderboard === 'batting' ? '#FFF' : theme.textSecondary} />
          <Text
            style={[
              styles.switchBtnText,
              { color: activeLeaderboard === 'batting' ? '#FFF' : theme.textSecondary, fontWeight: activeLeaderboard === 'batting' ? '800' : '600' },
            ]}
          >
            Orange Cap (Batting)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchBtn,
            activeLeaderboard === 'bowling' && { backgroundColor: '#8B5CF6' },
          ]}
          onPress={() => setActiveLeaderboard('bowling')}
        >
          <FontAwesome5 name="bullseye" size={12} color={activeLeaderboard === 'bowling' ? '#FFF' : theme.textSecondary} />
          <Text
            style={[
              styles.switchBtnText,
              { color: activeLeaderboard === 'bowling' ? '#FFF' : theme.textSecondary, fontWeight: activeLeaderboard === 'bowling' ? '800' : '600' },
            ]}
          >
            Purple Cap (Bowling)
          </Text>
        </TouchableOpacity>
      </View>

      {/* BATTING CARD */}
      {activeLeaderboard === 'batting' && (
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderBottomColor: theme.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.capIconWrap, { backgroundColor: '#F97316' }]}>
                <FontAwesome5 name="hat-cowboy-side" size={13} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.cardHeadTitle, { color: theme.text }]}>Leading Run Scorers</Text>
                <Text style={[styles.cardHeadSub, { color: theme.textSecondary }]}>Orange Cap Standings</Text>
              </View>
            </View>
            <View style={[styles.capBadge, { backgroundColor: '#F97316' }]}>
              <Text style={styles.capBadgeText}>BATTING</Text>
            </View>
          </View>

          <View style={styles.tableHead}>
            <Text style={[styles.thCell, { flex: 2, color: theme.textSecondary }]}>Player</Text>
            <Text style={[styles.thCell, styles.center, { color: theme.textSecondary }]}>Inns</Text>
            <Text style={[styles.thCell, styles.center, { color: theme.textSecondary }]}>Avg</Text>
            <Text style={[styles.thCell, styles.center, { color: theme.textSecondary }]}>SR</Text>
            <Text style={[styles.thCell, styles.right, { color: '#F97316', fontWeight: '900' }]}>Runs</Text>
          </View>

          {BATTING_LEADERS.map((item) => (
            <View key={item.pos} style={[styles.tableRow, { borderTopColor: theme.borderLight }]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.posBadge, item.pos === 1 && { backgroundColor: '#F97316' }]}>
                  <Text style={[styles.posBadgeText, item.pos === 1 && { color: '#FFF' }]}>{item.pos}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.playerSub, { color: theme.textMuted }]} numberOfLines={1}>{item.team}</Text>
                </View>
              </View>
              <Text style={[styles.tdCell, styles.center, { color: theme.textSecondary }]}>{item.inns}</Text>
              <Text style={[styles.tdCell, styles.center, { color: theme.textSecondary }]}>{item.avg}</Text>
              <Text style={[styles.tdCell, styles.center, { color: theme.textSecondary }]}>{item.sr}</Text>
              <Text style={[styles.tdCell, styles.right, { color: '#F97316', fontWeight: '900' }]}>{item.runs}</Text>
            </View>
          ))}
        </View>
      )}

      {/* BOWLING CARD */}
      {activeLeaderboard === 'bowling' && (
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderBottomColor: theme.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.capIconWrap, { backgroundColor: '#8B5CF6' }]}>
                <FontAwesome5 name="hat-cowboy-side" size={13} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.cardHeadTitle, { color: theme.text }]}>Leading Wicket Takers</Text>
                <Text style={[styles.cardHeadSub, { color: theme.textSecondary }]}>Purple Cap Standings</Text>
              </View>
            </View>
            <View style={[styles.capBadge, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.capBadgeText}>BOWLING</Text>
            </View>
          </View>

          <View style={styles.tableHead}>
            <Text style={[styles.thCell, { flex: 2, color: theme.textSecondary }]}>Player</Text>
            <Text style={[styles.thCell, styles.center, { color: theme.textSecondary }]}>Overs</Text>
            <Text style={[styles.thCell, styles.center, { color: theme.textSecondary }]}>BBI</Text>
            <Text style={[styles.thCell, styles.center, { color: theme.textSecondary }]}>Econ</Text>
            <Text style={[styles.thCell, styles.right, { color: '#8B5CF6', fontWeight: '900' }]}>Wkts</Text>
          </View>

          {BOWLING_LEADERS.map((item) => (
            <View key={item.pos} style={[styles.tableRow, { borderTopColor: theme.borderLight }]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.posBadge, item.pos === 1 && { backgroundColor: '#8B5CF6' }]}>
                  <Text style={[styles.posBadgeText, item.pos === 1 && { color: '#FFF' }]}>{item.pos}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.playerSub, { color: theme.textMuted }]} numberOfLines={1}>{item.team}</Text>
                </View>
              </View>
              <Text style={[styles.tdCell, styles.center, { color: theme.textSecondary }]}>{item.overs}</Text>
              <Text style={[styles.tdCell, styles.center, { color: theme.textSecondary }]}>{item.bbi}</Text>
              <Text style={[styles.tdCell, styles.center, { color: theme.textSecondary }]}>{item.econ}</Text>
              <Text style={[styles.tdCell, styles.right, { color: '#8B5CF6', fontWeight: '900' }]}>{item.wkts}</Text>
            </View>
          ))}
        </View>
      )}
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
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
  },
  switchBtnText: {
    fontSize: 11.5,
  },
  statCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardHeadSub: {
    fontSize: 10,
  },
  capBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  capBadgeText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  thCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
  },
  tdCell: {
    flex: 1,
    fontSize: 11,
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  posBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  playerName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  playerSub: {
    fontSize: 9.5,
  },
});
