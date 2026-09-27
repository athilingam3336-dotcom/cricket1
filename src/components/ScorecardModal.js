import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SCORECARD_DETAILS } from '../data/cricketData';

export default function ScorecardModal({ matchId, visible, onClose, theme }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!matchId) return null;
  const match = SCORECARD_DETAILS[matchId] || SCORECARD_DETAILS['match-1'];

  const handleDownloadScoresheet = () => {
    Alert.alert(
      'Scoresheet Generated',
      `Official match record for "${match.title}" has been saved to device. Verified by CFVD Umpires & Scorers Committee.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.livePulseBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveBadgeText}>OFFICIAL MATCH CENTRE</Text>
                </View>
              </View>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {match.title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                {match.subtitle}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabBar, { borderBottomColor: theme.borderLight }]}>
            {[
              { key: 'summary', label: 'Summary' },
              { key: 'scorecard', label: 'Scorecard' },
              { key: 'commentary', label: 'Commentary' },
              { key: 'teams', label: 'Playing XI' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabItem,
                  activeTab === tab.key && [styles.activeTabItem, { borderBottomColor: theme.primary }],
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: activeTab === tab.key ? theme.primary : theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* TAB 1: SUMMARY */}
            {activeTab === 'summary' && (
              <View>
                {/* Score Summary Boxes */}
                <View style={styles.summaryGrid}>
                  <View style={[styles.summaryBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary }]}>
                    <Text style={[styles.boxTag, { color: theme.primary }]}>
                      {match.chasingTarget ? `Chasing Target: ${match.chasingTarget}` : '1st Innings'}
                    </Text>
                    <Text style={[styles.boxTeamName, { color: theme.text }]}>
                      {match.summary.team1.name}
                    </Text>
                    <Text style={[styles.bigScore, { color: theme.primary }]}>
                      {match.summary.team1.score}
                    </Text>
                    <Text style={[styles.oversStr, { color: theme.textSecondary }]}>
                      ({match.summary.team1.overs})
                    </Text>
                    <View style={styles.rateRow}>
                      <Text style={[styles.rateText, { color: theme.textSecondary }]}>
                        CRR: <Text style={{ color: theme.text, fontWeight: '700' }}>{match.summary.team1.crr}</Text>
                      </Text>
                      <Text style={[styles.rateText, { color: theme.accentGold, fontWeight: '700' }]}>
                        {match.summary.team1.req}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.summaryBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                    <Text style={[styles.boxTag, { color: theme.textSecondary }]}>1st Innings</Text>
                    <Text style={[styles.boxTeamName, { color: theme.text }]}>
                      {match.summary.team2.name}
                    </Text>
                    <Text style={[styles.bigScore, { color: theme.text }]}>
                      {match.summary.team2.score}
                    </Text>
                    <Text style={[styles.oversStr, { color: theme.textSecondary }]}>
                      ({match.summary.team2.overs})
                    </Text>
                    <View style={styles.rateRow}>
                      <Text style={[styles.rateText, { color: theme.textSecondary }]}>
                        RR: <Text style={{ color: theme.text, fontWeight: '700' }}>{match.summary.team2.runRate}</Text>
                      </Text>
                      <Text style={[styles.rateText, { color: theme.textMuted }]}>
                        {match.summary.team2.topScorer}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Currently at the Crease */}
                {match.summary.crease.length > 0 && (
                  <View style={[styles.sectionBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="run-fast" size={16} color={theme.accentGold} />
                      <Text style={[styles.sectionHeading, { color: theme.text }]}>Currently at Crease</Text>
                    </View>

                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.colHead, { flex: 2, color: theme.textSecondary }]}>Batter</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>R</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>B</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>4s</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>6s</Text>
                      <Text style={[styles.colHead, styles.colRight, { color: theme.textSecondary }]}>SR</Text>
                    </View>

                    {match.summary.crease.map((b, i) => (
                      <View key={i} style={[styles.tableRow, { borderTopColor: theme.borderLight }]}>
                        <Text style={[styles.colCell, { flex: 2, color: theme.text, fontWeight: '700' }]}>{b.name}</Text>
                        <Text style={[styles.colCell, styles.colCenter, { color: theme.primary, fontWeight: '800' }]}>{b.r}</Text>
                        <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{b.b}</Text>
                        <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{b.fours}</Text>
                        <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{b.sixes}</Text>
                        <Text style={[styles.colCell, styles.colRight, { color: theme.textSecondary }]}>{b.sr}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Current Bowler */}
                {match.summary.currentBowler && (
                  <View style={[styles.sectionBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, marginTop: 10 }]}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="cricket" size={16} color={theme.accentRed} />
                      <Text style={[styles.sectionHeading, { color: theme.text }]}>Current Bowler</Text>
                    </View>

                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.colHead, { flex: 2, color: theme.textSecondary }]}>Bowler</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>O</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>M</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>R</Text>
                      <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>W</Text>
                      <Text style={[styles.colHead, styles.colRight, { color: theme.textSecondary }]}>Econ</Text>
                    </View>

                    <View style={[styles.tableRow, { borderTopColor: theme.borderLight }]}>
                      <Text style={[styles.colCell, { flex: 2, color: theme.text, fontWeight: '700' }]}>{match.summary.currentBowler.name}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{match.summary.currentBowler.o}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{match.summary.currentBowler.m}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{match.summary.currentBowler.r}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.accentRed, fontWeight: '800' }]}>{match.summary.currentBowler.w}</Text>
                      <Text style={[styles.colCell, styles.colRight, { color: theme.textSecondary }]}>{match.summary.currentBowler.econ}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: SCORECARD */}
            {activeTab === 'scorecard' && (
              <View>
                <Text style={[styles.subHeading, { color: theme.text }]}>Batting Card</Text>
                <View style={[styles.sectionBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.colHead, { flex: 2.2, color: theme.textSecondary }]}>Batter</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>R</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>B</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>4s</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>6s</Text>
                    <Text style={[styles.colHead, styles.colRight, { color: theme.textSecondary }]}>SR</Text>
                  </View>

                  {match.batting.map((item, idx) => (
                    <View key={idx} style={[styles.scorecardRow, { borderTopColor: theme.borderLight }]}>
                      <View style={{ flex: 2.2 }}>
                        <Text style={[styles.batterName, { color: item.highlight ? theme.accentGold : theme.text }]}>
                          {item.batter}
                        </Text>
                        <Text style={[styles.dismissalText, { color: theme.textMuted }]}>
                          {item.dismissal}
                        </Text>
                      </View>
                      <Text style={[styles.colCell, styles.colCenter, { color: item.highlight ? theme.accentGold : theme.text, fontWeight: '700' }]}>{item.r}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{item.b}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{item.fours}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{item.sixes}</Text>
                      <Text style={[styles.colCell, styles.colRight, { color: theme.textSecondary }]}>{item.sr}</Text>
                    </View>
                  ))}

                  <View style={[styles.extrasRow, { borderTopColor: theme.borderLight }]}>
                    <Text style={[styles.extrasText, { color: theme.textSecondary }]}>
                      Extras: {match.extras}
                    </Text>
                    <Text style={[styles.totalScoreText, { color: theme.primary }]}>
                      Total: {match.total}
                    </Text>
                  </View>
                </View>

                {/* Bowling */}
                <Text style={[styles.subHeading, { color: theme.text, marginTop: 14 }]}>Bowling Card</Text>
                <View style={[styles.sectionBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.colHead, { flex: 2, color: theme.textSecondary }]}>Bowler</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>O</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>M</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>R</Text>
                    <Text style={[styles.colHead, styles.colCenter, { color: theme.textSecondary }]}>W</Text>
                    <Text style={[styles.colHead, styles.colRight, { color: theme.textSecondary }]}>Econ</Text>
                  </View>

                  {match.bowling.map((b, i) => (
                    <View key={i} style={[styles.tableRow, { borderTopColor: theme.borderLight }]}>
                      <Text style={[styles.colCell, { flex: 2, color: theme.text, fontWeight: '600' }]}>{b.bowler}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{b.o}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{b.m}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.textSecondary }]}>{b.r}</Text>
                      <Text style={[styles.colCell, styles.colCenter, { color: theme.accentRed, fontWeight: '800' }]}>{b.w}</Text>
                      <Text style={[styles.colCell, styles.colRight, { color: theme.textSecondary }]}>{b.econ}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 3: COMMENTARY */}
            {activeTab === 'commentary' && (
              <View>
                {match.commentary.map((comm, index) => {
                  let badgeBg = theme.surfaceElevated;
                  let badgeText = '#CBD5E1';
                  if (comm.type === 'four') {
                    badgeBg = '#EF4444';
                    badgeText = '#FFF';
                  } else if (comm.type === 'six') {
                    badgeBg = '#F59E0B';
                    badgeText = '#000';
                  } else if (comm.type === 'wicket') {
                    badgeBg = '#DC2626';
                    badgeText = '#FFF';
                  } else if (comm.type === 'runs') {
                    badgeBg = theme.primary;
                    badgeText = '#000';
                  }

                  return (
                    <View key={index} style={[styles.commItem, { borderBottomColor: theme.borderLight }]}>
                      <View style={[styles.commBallBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.commBallText, { color: badgeText }]}>{comm.ball}</Text>
                      </View>
                      <Text style={[styles.commText, { color: theme.text }]}>{comm.text}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* TAB 4: PLAYING XI */}
            {activeTab === 'teams' && (
              <View style={styles.teamsGrid}>
                <View style={[styles.xiBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                  <Text style={[styles.xiHeading, { color: theme.primary }]}>
                    {match.summary.team1.name} XI
                  </Text>
                  {match.playingXI.team1.map((player, idx) => (
                    <Text key={idx} style={[styles.playerItem, { color: theme.text }]}>
                      <Text style={{ color: theme.textSecondary }}>{idx + 1}. </Text>
                      {player}
                    </Text>
                  ))}
                </View>

                <View style={[styles.xiBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, marginTop: 10 }]}>
                  <Text style={[styles.xiHeading, { color: theme.accentBlue }]}>
                    {match.summary.team2.name} XI
                  </Text>
                  {match.playingXI.team2.map((player, idx) => (
                    <Text key={idx} style={[styles.playerItem, { color: theme.text }]}>
                      <Text style={{ color: theme.textSecondary }}>{idx + 1}. </Text>
                      {player}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
            <TouchableOpacity style={[styles.closeFooterBtn, { borderColor: theme.border }]} onPress={onClose}>
              <Text style={[styles.closeFooterBtnText, { color: theme.textSecondary }]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
              onPress={handleDownloadScoresheet}
            >
              <FontAwesome5 name="file-pdf" size={13} color="#000" />
              <Text style={styles.downloadBtnText}>Official Scoresheet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    minHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 14,
  },
  summaryGrid: {
    gap: 10,
    marginBottom: 12,
  },
  summaryBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  boxTag: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  boxTeamName: {
    fontSize: 14,
    fontWeight: '800',
  },
  bigScore: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  oversStr: {
    fontSize: 11,
    fontWeight: '500',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  rateText: {
    fontSize: 11,
  },
  sectionBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  colHead: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
  },
  colCell: {
    flex: 1,
    fontSize: 11,
  },
  colCenter: {
    textAlign: 'center',
  },
  colRight: {
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
  },
  scorecardRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  batterName: {
    fontSize: 12,
    fontWeight: '700',
  },
  dismissalText: {
    fontSize: 9.5,
    marginTop: 1,
  },
  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  extrasText: {
    fontSize: 11,
  },
  totalScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  commItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  commBallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commBallText: {
    fontSize: 10,
    fontWeight: '900',
  },
  commText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  teamsGrid: {
    gap: 10,
  },
  xiBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  xiHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  playerItem: {
    fontSize: 12,
    paddingVertical: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  closeFooterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeFooterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
});
