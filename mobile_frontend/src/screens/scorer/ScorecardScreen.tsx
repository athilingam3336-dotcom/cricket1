import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigationContext';
import { assignedMatches } from '../../data/scorerMockData';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function ScorecardScreen() {
  const { navigate, params } = useScorerNavigation();
  const matchId = params?.matchId || 'M002';
  const defaultMatch = assignedMatches.find(m => m.id === matchId) || assignedMatches[1];

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const insetsTop = Platform.OS === 'android' ? 36 : Platform.OS === 'ios' ? 44 : 0;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scorecardData, setScorecardData] = useState<any>(null);
  const [activeInningsTab, setActiveInningsTab] = useState<number>(0);

  useEffect(() => {
    loadScorecard();
  }, [matchId]);

  const loadScorecard = async () => {
    try {
      setIsLoading(true);
      const res = await ScorerApi.getScorecard(matchId);
      if (res && res.data) {
        setScorecardData(res.data);
      }
    } catch (e) {
      // Fallback to initial display
    } finally {
      setIsLoading(false);
    }
  };

  const match = scorecardData?.match || defaultMatch;
  const inningsList = scorecardData?.innings && scorecardData.innings.length > 0 
    ? scorecardData.innings 
    : [
        {
          id: 'inn-1',
          battingTeam: defaultMatch.teamA || 'Virudhunagar Strikers',
          bowlingTeam: defaultMatch.teamB || 'Sivakasi Super Kings',
          score: defaultMatch.scoreA || '145/4 (15.2 Ov)',
          runs: 145,
          wickets: 4,
          overs: '15.2',
          extras: { total: 11, breakdown: 'wd 6, nb 1, b 2, lb 2' },
          batters: [
            { id: '1', name: 'Suresh Kumar (c)', runs: 42, balls: 30, fours: 4, sixes: 1, strikeRate: 140.0, dismissal: 'not out' },
            { id: '2', name: 'Muthu Raj', runs: 12, balls: 10, fours: 1, sixes: 0, strikeRate: 120.0, dismissal: 'b Karthik N' },
            { id: '3', name: 'Vijay', runs: 18, balls: 14, fours: 2, sixes: 0, strikeRate: 128.5, dismissal: 'not out' },
            { id: '4', name: 'R. Vignesh', runs: 35, balls: 22, fours: 3, sixes: 2, strikeRate: 159.1, dismissal: 'c Saravanan b Karthik N' },
            { id: '5', name: 'Anand K', runs: 27, balls: 16, fours: 2, sixes: 1, strikeRate: 168.8, dismissal: 'run out' }
          ],
          bowlers: [
            { id: '1', name: 'Karthik N', overs: '3.2', maidens: 0, runs: 24, wickets: 2, economy: 7.20 },
            { id: '2', name: 'Saravanan', overs: '4.0', maidens: 1, runs: 18, wickets: 1, economy: 4.50 },
            { id: '3', name: 'G. Balaji', overs: '4.0', maidens: 0, runs: 38, wickets: 0, economy: 9.50 },
            { id: '4', name: 'Murugan P', overs: '4.0', maidens: 0, runs: 54, wickets: 0, economy: 13.50 }
          ],
          fallOfWickets: [
            { wicket: 1, score: 28, batter: 'Muthu Raj', over: '3.1' },
            { wicket: 2, score: 79, batter: 'R. Vignesh', over: '9.4' },
            { wicket: 3, score: 118, batter: 'Anand K', over: '13.2' }
          ]
        },
        {
          id: 'inn-2',
          battingTeam: defaultMatch.teamB || 'Sivakasi Super Kings',
          bowlingTeam: defaultMatch.teamA || 'Virudhunagar Strikers',
          score: defaultMatch.scoreB || '132/8 (20.0 Ov)',
          runs: 132,
          wickets: 8,
          overs: '20.0',
          extras: { total: 8, breakdown: 'wd 5, nb 1, lb 2' },
          batters: [
            { id: 'b1', name: 'K. Meenakshi', runs: 51, balls: 38, fours: 5, sixes: 2, strikeRate: 134.2, dismissal: 'c Vijay b Suresh' },
            { id: 'b2', name: 'T. Bala', runs: 22, balls: 20, fours: 2, sixes: 0, strikeRate: 110.0, dismissal: 'b Muthu Raj' },
            { id: 'b3', name: 'N. Muthuraman', runs: 15, balls: 18, fours: 1, sixes: 0, strikeRate: 83.3, dismissal: 'lbw b Vijay' },
            { id: 'b4', name: 'D. Kumar', runs: 8, balls: 12, fours: 0, sixes: 0, strikeRate: 66.7, dismissal: 'c & b Vijay' }
          ],
          bowlers: [
            { id: 'bw1', name: 'Suresh Kumar', overs: '4.0', maidens: 0, runs: 28, wickets: 2, economy: 7.00 },
            { id: 'bw2', name: 'Muthu Raj', overs: '4.0', maidens: 0, runs: 24, wickets: 3, economy: 6.00 },
            { id: 'bw3', name: 'Vijay', overs: '4.0', maidens: 1, runs: 19, wickets: 2, economy: 4.75 }
          ],
          fallOfWickets: [
            { wicket: 1, score: 35, batter: 'T. Bala', over: '5.2' },
            { wicket: 2, score: 78, batter: 'N. Muthuraman', over: '11.4' }
          ]
        }
      ];

  const currentInnings = inningsList[activeInningsTab] || inningsList[0];

  // Dynamic Statistics Calculations for the active innings
  const inningsStats = useMemo(() => {
    if (!currentInnings) return null;
    const batters = currentInnings.batters || [];
    let boundaryRuns = 0;
    let total4s = 0;
    let total6s = 0;
    let totalRuns = currentInnings.runs || 0;
    let totalBalls = 0;

    batters.forEach((b: any) => {
      const f = b.fours || 0;
      const s = b.sixes || 0;
      total4s += f;
      total6s += s;
      boundaryRuns += f * 4 + s * 6;
      totalBalls += b.balls || 0;
    });

    if (totalRuns === 0) {
      totalRuns = batters.reduce((acc: number, b: any) => acc + (b.runs || 0), 0) + (currentInnings.extras?.total || 0);
    }

    const extrasRuns = currentInnings.extras?.total || 0;
    const runningRuns = Math.max(0, totalRuns - boundaryRuns - extrasRuns);

    const boundaryPct = totalRuns > 0 ? Math.round((boundaryRuns / totalRuns) * 100) : 0;
    const runningPct = totalRuns > 0 ? Math.round((runningRuns / totalRuns) * 100) : 0;
    const extrasPct = totalRuns > 0 ? Math.max(0, 100 - boundaryPct - runningPct) : 0;

    const runRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 6).toFixed(2) : '0.00';

    return {
      totalRuns,
      total4s,
      total6s,
      boundaryRuns,
      runningRuns,
      extrasRuns,
      boundaryPct,
      runningPct,
      extrasPct,
      runRate
    };
  }, [currentInnings]);

  return (
    <View style={styles.container}>
      {/* 1. RESPONSIVE HEADER WITH SAFE AREA INSETS */}
      <View style={[styles.header, { paddingTop: styles.header.paddingTop + insetsTop }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.badgeLive}>
            <Text style={styles.badgeLiveText}>
              {match.status || 'Match Scorecard'}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>Match Scorecard & Statistics</Text>
        <Text style={styles.subtitle}>
          {match.tournament || 'Virudhunagar District Championship 2026'} • {match.venue || 'Kamarajar Stadium'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentWrapper}>
          {/* Match Result Banner */}
          {match.result && (
            <View style={styles.resultBanner}>
              <Text style={styles.resultEmoji}>🏆</Text>
              <Text style={styles.resultText}>{match.result}</Text>
            </View>
          )}

          {/* INNINGS TABS BAR */}
          {inningsList.length > 1 && (
            <View style={styles.tabContainer}>
              {inningsList.map((inn: any, idx: number) => (
                <TouchableOpacity
                  key={inn.id || idx}
                  style={[styles.tabButton, activeInningsTab === idx && styles.tabButtonActive]}
                  onPress={() => setActiveInningsTab(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, activeInningsTab === idx && styles.tabTextActive]}>
                    {inn.battingTeam} ({inn.score ? inn.score.split(' ')[0] : 'Innings'})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ACTIVE INNINGS HERO CARD */}
          <View style={styles.inningsHeroCard}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroBattingTeam}>{currentInnings.battingTeam}</Text>
              <Text style={styles.heroVersus}>vs {currentInnings.bowlingTeam || (match.teamA === currentInnings.battingTeam ? match.teamB : match.teamA)}</Text>
            </View>
            <View style={styles.heroRight}>
              <Text style={styles.heroScoreText}>{currentInnings.score}</Text>
              {inningsStats && (
                <Text style={styles.heroRunRateText}>Run Rate: {inningsStats.runRate} RPO</Text>
              )}
            </View>
          </View>

          {/* ─────────────────────────────────────────────────────────────
              DYNAMIC STATISTICAL VISUALIZATION: SCORING & BOUNDARY CHART
              ───────────────────────────────────────────────────────────── */}
          {inningsStats && (
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>📊</Text>
                <View>
                  <Text style={styles.statsCardTitle}>Innings Scoring Distribution & Boundaries</Text>
                  <Text style={styles.statsCardSubtitle}>Visual breakdown of runs scored from boundaries vs running</Text>
                </View>
              </View>

              {/* DONUT & HERO STAT METRICS ROW */}
              <View style={[styles.statsRow, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                {/* Visual Donut / Radial Ring */}
                <View style={styles.chartCol}>
                  <View
                    style={[
                      styles.donutOuterRing,
                      Platform.OS === 'web'
                        ? ({
                            background: `conic-gradient(#10b981 0% ${inningsStats.boundaryPct}%, #3b82f6 ${inningsStats.boundaryPct}% ${inningsStats.boundaryPct + inningsStats.runningPct}%, #f59e0b ${inningsStats.boundaryPct + inningsStats.runningPct}% 100%)`,
                            backgroundImage: `conic-gradient(#10b981 0% ${inningsStats.boundaryPct}%, #3b82f6 ${inningsStats.boundaryPct}% ${inningsStats.boundaryPct + inningsStats.runningPct}%, #f59e0b ${inningsStats.boundaryPct + inningsStats.runningPct}% 100%)`
                          } as any)
                        : {
                            borderWidth: 10,
                            borderColor: '#10b981',
                            borderTopColor: '#10b981',
                            borderRightColor: '#3b82f6',
                            borderBottomColor: '#f59e0b',
                            borderLeftColor: '#10b981',
                            backgroundColor: '#0a1432'
                          }
                    ]}
                  >
                    <View style={styles.donutHole}>
                      <Text style={styles.donutNumber}>{inningsStats.boundaryPct}%</Text>
                      <Text style={styles.donutUnitLabel}>BOUNDARIES</Text>
                    </View>
                  </View>
                </View>

                {/* 3 Metric Pills */}
                <View style={styles.metricsCol}>
                  <View style={[styles.metricPill, { borderLeftColor: '#10b981' }]}>
                    <View>
                      <Text style={styles.metricLabel}>Boundary Runs (4s & 6s)</Text>
                      <Text style={styles.metricSub}>{inningsStats.total4s} fours • {inningsStats.total6s} sixes</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#10b981' }]}>{inningsStats.boundaryRuns} r</Text>
                  </View>

                  <View style={[styles.metricPill, { borderLeftColor: '#3b82f6' }]}>
                    <View>
                      <Text style={styles.metricLabel}>Running Between Wickets</Text>
                      <Text style={styles.metricSub}>Singles, doubles & triples</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#3b82f6' }]}>{inningsStats.runningRuns} r</Text>
                  </View>

                  <View style={[styles.metricPill, { borderLeftColor: '#f59e0b' }]}>
                    <View>
                      <Text style={styles.metricLabel}>Extras Conceded</Text>
                      <Text style={styles.metricSub}>{currentInnings.extras?.breakdown || 'Wides, no-balls & byes'}</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{inningsStats.extrasRuns} r</Text>
                  </View>
                </View>
              </View>

              {/* Dynamic Proportional Distribution Bar */}
              <View style={styles.distributionBarWrapper}>
                <View style={styles.distributionBarTrack}>
                  {inningsStats.boundaryPct > 0 && (
                    <View style={[styles.distributionBarSegment, { width: `${inningsStats.boundaryPct}%`, backgroundColor: '#10b981' }]} />
                  )}
                  {inningsStats.runningPct > 0 && (
                    <View style={[styles.distributionBarSegment, { width: `${inningsStats.runningPct}%`, backgroundColor: '#3b82f6' }]} />
                  )}
                  {inningsStats.extrasPct > 0 && (
                    <View style={[styles.distributionBarSegment, { width: `${inningsStats.extrasPct}%`, backgroundColor: '#f59e0b' }]} />
                  )}
                </View>
                <View style={styles.distributionPctRow}>
                  <Text style={[styles.distributionPctText, { color: '#10b981' }]}>
                    {inningsStats.boundaryPct}% Boundaries
                  </Text>
                  <Text style={[styles.distributionPctText, { color: '#3b82f6' }]}>
                    {inningsStats.runningPct}% Running
                  </Text>
                  <Text style={[styles.distributionPctText, { color: '#f59e0b' }]}>
                    {inningsStats.extrasPct}% Extras
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              BATTING SCORECARD TABLE
              ───────────────────────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>🏏 Batting Scorecard</Text>
            <Text style={styles.sectionHeaderSub}>Innings of {currentInnings.battingTeam}</Text>
          </View>

          <View style={styles.tableWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%' }}>
              <View style={styles.tableInner}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.cell, styles.colName, styles.tableHeaderText]}>Batter</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>R</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>B</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>4s</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>6s</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>SR</Text>
                </View>

                {(currentInnings.batters || []).map((b: any, bIdx: number) => (
                  <View key={b.id || bIdx} style={[styles.tableRow, bIdx % 2 === 1 && styles.tableRowAlt]}>
                    <View style={styles.colName}>
                      <Text style={styles.playerName}>{b.name}</Text>
                      <Text style={styles.dismissal}>{b.dismissal || (b.isOut ? 'out' : 'not out')}</Text>
                    </View>
                    <Text style={[styles.cell, styles.colNum, styles.runsText]}>{b.runs}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{b.balls}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{b.fours}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{b.sixes}</Text>
                    <Text style={[styles.cell, styles.colNum, styles.srText]}>
                      {typeof b.strikeRate === 'number' ? b.strikeRate.toFixed(1) : b.strikeRate}
                    </Text>
                  </View>
                ))}

                {/* Extras Row */}
                <View style={styles.extrasRow}>
                  <Text style={styles.extrasText}>
                    Extras: {currentInnings.extras?.total || 0} ({currentInnings.extras?.breakdown || 'wides & no-balls'})
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={{ height: 24 }} />

          {/* ─────────────────────────────────────────────────────────────
              BOWLING SCORECARD TABLE
              ───────────────────────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>🎯 Bowling Figures</Text>
            <Text style={styles.sectionHeaderSub}>Attack by {currentInnings.bowlingTeam || 'Opponent'}</Text>
          </View>

          <View style={styles.tableWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%' }}>
              <View style={styles.tableInner}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.cell, styles.colName, styles.tableHeaderText]}>Bowler</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>O</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>M</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>R</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>W</Text>
                  <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>ECON</Text>
                </View>

                {(currentInnings.bowlers || []).map((bw: any, bwIdx: number) => (
                  <View key={bw.id || bwIdx} style={[styles.tableRow, bwIdx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={[styles.cell, styles.colName, styles.playerName]}>{bw.name}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{bw.overs}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{bw.maidens || 0}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{bw.runs}</Text>
                    <Text style={[styles.cell, styles.colNum, styles.wicketsText]}>{bw.wickets}</Text>
                    <Text style={[styles.cell, styles.colNum, styles.econText]}>
                      {typeof bw.economy === 'number' ? bw.economy.toFixed(2) : bw.economy}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* FALL OF WICKETS (If available) */}
          {Array.isArray(currentInnings.fallOfWickets) && currentInnings.fallOfWickets.length > 0 && (
            <View style={styles.fowCard}>
              <Text style={styles.fowTitle}>Fall of Wickets</Text>
              <View style={styles.fowRow}>
                {currentInnings.fallOfWickets.map((f: any, idx: number) => (
                  <View key={idx} style={styles.fowPill}>
                    <Text style={styles.fowPillScore}>{f.score}/{f.wicket}</Text>
                    <Text style={styles.fowPillSub}>({f.batter}, {f.over} ov)</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ACTION BUTTONS */}
          {(match.status === 'Live' || match.status === 'LIVE') && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigate('LiveScoring', { matchId })}>
              <Text style={styles.actionBtnText}>⚡ Back to Live Scoring Console</Text>
            </TouchableOpacity>
          )}
        </View>

        <SharedFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f2e9' },
  header: {
    padding: 16,
    paddingTop: 16,
    backgroundColor: '#0a1432',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(254, 215, 102, 0.35)',
    elevation: 4
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(254, 215, 102, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d4af37'
  },
  backText: { color: '#fde68a', fontWeight: 'bold', fontSize: 13 },
  badgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981'
  },
  badgeLiveText: { color: '#6ee7b7', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  subtitle: { color: 'rgba(254, 215, 102, 0.85)', fontSize: 12.5, marginTop: 4, fontWeight: '600' },
  scroll: { flexGrow: 1 },
  contentWrapper: { padding: 16, paddingBottom: 50, maxWidth: 1100, width: '100%', alignSelf: 'center' },

  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    marginBottom: 18,
    justifyContent: 'center',
    gap: 8
  },
  resultEmoji: { fontSize: 18 },
  resultText: { color: '#047857', fontWeight: '800', fontSize: 14 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'transparent'
  },
  tabButtonActive: {
    backgroundColor: '#0a1432',
    elevation: 2
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#fde68a',
    fontWeight: '800'
  },

  inningsHeroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a1432',
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 215, 102, 0.4)',
    elevation: 3
  },
  heroLeft: { flex: 1 },
  heroBattingTeam: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  heroVersus: { color: 'rgba(254, 215, 102, 0.75)', fontSize: 12, marginTop: 2, fontWeight: '600' },
  heroRight: { alignItems: 'flex-end' },
  heroScoreText: { color: '#fde68a', fontSize: 20, fontWeight: '900' },
  heroRunRateText: { color: '#93c5fd', fontSize: 11, marginTop: 2, fontWeight: '700' },

  // Dynamic Statistics Card Styling
  statsCard: {
    backgroundColor: '#0a1432',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 215, 102, 0.35)',
    marginBottom: 20,
    elevation: 3
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254, 215, 102, 0.15)',
    paddingBottom: 10
  },
  statsCardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  statsCardSubtitle: { color: 'rgba(180, 196, 230, 0.75)', fontSize: 11.5, marginTop: 2 },
  statsRow: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 14
  },
  chartCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6
  },
  donutOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3
  },
  donutHole: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#071026',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  donutNumber: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  donutUnitLabel: { color: 'rgba(147, 197, 253, 0.9)', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  metricsCol: {
    flex: 1,
    width: '100%',
    gap: 8
  },
  metricPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4
  },
  metricLabel: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },
  metricSub: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10.5 },
  metricValue: { fontSize: 15, fontWeight: '900' },

  distributionBarWrapper: { width: '100%', marginTop: 8 },
  distributionBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    overflow: 'hidden'
  },
  distributionBarSegment: { height: '100%' },
  distributionPctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  distributionPctText: { fontSize: 11, fontWeight: '700' },

  // Scorecard Tables Styling
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionHeaderTitle: { color: '#1e293b', fontSize: 15, fontWeight: '800' },
  sectionHeaderSub: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tableWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    elevation: 1
  },
  tableInner: { minWidth: 480 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  tableRowAlt: { backgroundColor: '#fafaf9' },
  tableHeader: {
    backgroundColor: '#fef3c7',
    borderBottomColor: '#fde68a',
    paddingVertical: 8
  },
  tableHeaderText: { color: '#92400e', fontWeight: '800' },
  cell: { color: '#334155', fontSize: 12.5, fontWeight: '600' },
  colName: { flex: 4, minWidth: 160 },
  colNum: { flex: 1.2, textAlign: 'center', minWidth: 36 },
  playerName: { color: '#0f172a', fontWeight: 'bold', fontSize: 13.5 },
  dismissal: { color: '#b45309', fontSize: 11, fontStyle: 'italic', marginTop: 1 },
  runsText: { color: '#0f172a', fontWeight: '900', fontSize: 13.5 },
  srText: { color: '#2563eb', fontWeight: '700' },
  wicketsText: { color: '#15803d', fontWeight: '900', fontSize: 13.5 },
  econText: { color: '#475569', fontWeight: '700' },
  extrasRow: { padding: 10, backgroundColor: '#fffbeb', borderTopWidth: 1, borderTopColor: '#fef3c7' },
  extrasText: { color: '#b45309', fontSize: 12, fontWeight: 'bold' },

  fowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fowTitle: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  fowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fowPill: {
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  fowPillScore: { color: '#ef4444', fontWeight: '800', fontSize: 12 },
  fowPillSub: { color: '#64748b', fontSize: 10.5 },

  actionBtn: {
    backgroundColor: '#d4af37',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 22,
    elevation: 3
  },
  actionBtnText: { color: '#0a1432', fontWeight: '900', fontSize: 14 }
});

