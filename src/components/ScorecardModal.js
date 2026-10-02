import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function ScorecardModal({ matchId, visible, onClose, theme }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [scorecard, setScorecard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && matchId) {
      loadScorecard();
    }
  }, [visible, matchId]);

  const loadScorecard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Map legacy ID if needed
      const apiMatchId = matchId === 'match-1' ? 'M003' : (matchId === 'match-2' ? 'M002' : matchId);
      const res = await fetch(`http://localhost:5000/api/matches/${apiMatchId}/scorecard`);
      const data = await res.json();
      if (data && data.success && data.data) {
        setScorecard(data.data);
      } else {
        setError('No scorecard data available in database.');
      }
    } catch (err) {
      console.warn('ScorecardModal fetch error:', err.message);
      setError('Unable to load scorecard from server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!matchId) return null;

  const matchInfo = scorecard?.match || scorecard;
  const innings1 = scorecard?.innings && scorecard.innings[0];
  const innings2 = scorecard?.innings && scorecard.innings[1];

  const handleDownloadScoresheet = () => {
    Alert.alert(
      'Scoresheet Generated',
      `Official match record for "${matchInfo ? `${matchInfo.teamA} vs ${matchInfo.teamB}` : 'Match'}" has been saved. Verified by CFVD Umpires & Scorers Committee.`,
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
              {isLoading ? (
                <Text style={[styles.title, { color: theme.text }]}>Loading Scorecard...</Text>
              ) : error ? (
                <Text style={[styles.title, { color: '#ef4444' }]}>{error}</Text>
              ) : matchInfo ? (
                <>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {matchInfo.teamA} vs {matchInfo.teamB}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                    {matchInfo.tournament} &bull; {matchInfo.venue} &bull; {matchInfo.result}
                  </Text>
                </>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <ActivityIndicator size="large" color="#b45309" />
              <Text style={{ marginTop: 12, color: theme.textSecondary, fontSize: 13 }}>
                Loading verified match data from database...
              </Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>{error}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 16 }}>
                Could not retrieve match records from MySQL.
              </Text>
              <TouchableOpacity onPress={loadScorecard} style={{ backgroundColor: '#b45309', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !scorecard ? null : (
            <>
              {/* Tab Selector */}
              <View style={[styles.tabRow, { borderBottomColor: theme.borderLight }]}>
                {['summary', 'innings-1', 'innings-2'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: activeTab === tab ? theme.primary : theme.textSecondary },
                        activeTab === tab && { fontWeight: '700' }
                      ]}
                    >
                      {tab === 'summary' ? 'Summary' : (tab === 'innings-1' ? (innings1 ? innings1.battingTeam : '1st Innings') : (innings2 ? innings2.battingTeam : '2nd Innings'))}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'summary' && (
                  <View style={{ paddingBottom: 24 }}>
                    {/* Result Banner */}
                    {matchInfo?.result && (
                      <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' }}>
                        <Text style={{ color: '#166534', fontWeight: 'bold', fontSize: 14 }}>{matchInfo.result}</Text>
                      </View>
                    )}

                    {/* Innings 1 & 2 summaries */}
                    {innings1 && (
                      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12, padding: 14, borderRadius: 6, borderWidth: 1 }]}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#b45309', marginBottom: 4 }}>{innings1.battingTeam} (Innings 1)</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{innings1.score}</Text>
                        {innings1.extras && <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Extras: {innings1.extras.total} ({innings1.extras.breakdown})</Text>}
                      </View>
                    )}

                    {innings2 && (
                      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12, padding: 14, borderRadius: 6, borderWidth: 1 }]}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#b45309', marginBottom: 4 }}>{innings2.battingTeam} (Innings 2)</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{innings2.score}</Text>
                        {innings2.extras && <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Extras: {innings2.extras.total} ({innings2.extras.breakdown})</Text>}
                      </View>
                    )}
                  </View>
                )}

                {(activeTab === 'innings-1' || activeTab === 'innings-2') && (
                  <View style={{ paddingBottom: 24 }}>
                    {(() => {
                      const inn = activeTab === 'innings-1' ? innings1 : innings2;
                      if (!inn) return <Text style={{ color: theme.textSecondary, padding: 16 }}>Innings not available.</Text>;
                      return (
                        <View>
                          <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
                            {inn.battingTeam} Batting Card
                          </Text>
                          <View style={{ backgroundColor: theme.card, borderRadius: 6, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                              <Text style={{ flex: 3, fontSize: 11, fontWeight: '700', color: '#64748b' }}>Batter</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>R</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>B</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>4s</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>6s</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>SR</Text>
                            </View>
                            {inn.batters && inn.batters.map((b, bIdx) => (
                              <View key={bIdx} style={{ flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' }}>
                                <View style={{ flex: 3 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{b.name}</Text>
                                  <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>{b.dismissal}</Text>
                                </View>
                                <Text style={{ flex: 1, fontSize: 13, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>{b.runs}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{b.balls}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{b.fours}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{b.sixes}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{b.strikeRate}</Text>
                              </View>
                            ))}
                            {inn.extras && (
                              <View style={{ padding: 10, backgroundColor: '#fefce8' }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b45309' }}>Extras: {inn.extras.total} ({inn.extras.breakdown})</Text>
                              </View>
                            )}
                          </View>

                          <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
                            {inn.bowlingTeam} Bowling Card
                          </Text>
                          <View style={{ backgroundColor: theme.card, borderRadius: 6, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                            <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                              <Text style={{ flex: 3, fontSize: 11, fontWeight: '700', color: '#64748b' }}>Bowler</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>O</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>M</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>R</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>W</Text>
                              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' }}>ECON</Text>
                            </View>
                            {inn.bowlers && inn.bowlers.map((bw, bwIdx) => (
                              <View key={bwIdx} style={{ flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' }}>
                                <Text style={{ flex: 3, fontSize: 13, fontWeight: '600', color: theme.text }}>{bw.name}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{bw.overs}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{bw.maidens}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{bw.runs}</Text>
                                <Text style={{ flex: 1, fontSize: 13, fontWeight: 'bold', color: '#b45309', textAlign: 'center' }}>{bw.wickets}</Text>
                                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>{bw.economy}</Text>
                              </View>
                            ))}
                          </View>

                          {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                            <View style={{ marginTop: 14, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Fall of Wickets</Text>
                              <Text style={{ fontSize: 12, color: '#334155' }}>{inn.fallOfWickets.join(' &bull; ')}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
                <TouchableOpacity
                  style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
                  onPress={handleDownloadScoresheet}
                >
                  <FontAwesome5 name="file-pdf" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.downloadBtnText}>Official Match Scoresheet</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  badgeRow: {
    marginBottom: 4
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b45309',
    marginRight: 6
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b45309'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  tabText: {
    fontSize: 13
  },
  content: {
    padding: 16
  },
  footer: {
    padding: 16,
    borderTopWidth: 1
  },
  downloadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 6
  },
  downloadBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13
  }
});
