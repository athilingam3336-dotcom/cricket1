import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigationContext';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function ScorecardScreen() {
  const { navigate, params } = useScorerNavigation();
  const matchId = params?.matchId || 'M003';
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const styles = getStyles(isDesktop);

  const [scorecard, setScorecard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadScorecard();
  }, [matchId]);

  const loadScorecard = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await ScorerApi.getScorecard(matchId);
      if (res && res.success && res.data) {
        setScorecard(res.data);
      } else {
        setErrorMessage('Unable to load scorecard');
      }
    } catch (err: any) {
      console.error('Scorecard API fetch error:', err.message);
      setErrorMessage('Unable to load scorecard');
    } finally {
      setIsLoading(false);
    }
  };

  const match = scorecard?.match || scorecard;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn}>
          <Text style={styles.backText}>&larr; Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Full Match Scorecard</Text>
        {match && (
          <Text style={styles.subtitle}>
            {match.tournament} &bull; {match.teamA} vs {match.teamB}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentWrapper}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#b45309" />
              <Text style={styles.loadingText}>Loading scorecard from database...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>{errorMessage}</Text>
              <Text style={styles.errorSubtitle}>Could not retrieve scorecard data from the server.</Text>
              <TouchableOpacity onPress={loadScorecard} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !scorecard || !scorecard.innings || scorecard.innings.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No scorecard data available for this match.</Text>
            </View>
          ) : (
            <>
              {/* MATCH SUMMARY BANNER */}
              <View style={styles.matchMetaCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Tournament:</Text>
                  <Text style={styles.metaVal}>{match.tournament}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Venue:</Text>
                  <Text style={styles.metaVal}>{match.venue}</Text>
                </View>
                {match.date && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Date:</Text>
                    <Text style={styles.metaVal}>{match.date} {match.time ? `&bull; ${match.time}` : ''}</Text>
                  </View>
                )}
                {match.status && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Status:</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{match.status}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* RESULT BANNER */}
              {match.result && (
                <View style={styles.resultBanner}>
                  <Text style={styles.resultText}>{match.result}</Text>
                </View>
              )}

              {/* INNINGS LIST */}
              {scorecard.innings.map((inn: any, idx: number) => (
                <View key={inn.id || idx} style={styles.inningsCard}>
                  {/* INNINGS TITLE BAR */}
                  <View style={styles.inningsHeader}>
                    <Text style={styles.inningsTitle}>{inn.battingTeam} Innings</Text>
                    <Text style={styles.inningsScore}>{inn.score}</Text>
                  </View>

                  {/* BATTING TABLE */}
                  <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.cell, styles.colName, styles.headerCell]}>Batter</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>R</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>B</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>4s</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>6s</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>SR</Text>
                    </View>

                    {inn.batters && inn.batters.length > 0 ? (
                      inn.batters.map((b: any, bIdx: number) => (
                        <View key={b.id || bIdx} style={styles.tableRow}>
                          <View style={styles.colName}>
                            <Text style={styles.playerName}>{b.name}</Text>
                            <Text style={styles.dismissal}>{b.dismissal}</Text>
                          </View>
                          <Text style={[styles.cell, styles.colNum, styles.runText]}>{b.runs}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{b.balls}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{b.fours}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{b.sixes}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{b.strikeRate}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.tableRow}>
                        <Text style={[styles.cell, { fontStyle: 'italic', padding: 8 }]}>Yet to bat</Text>
                      </View>
                    )}

                    {/* EXTRAS ROW */}
                    {inn.extras && (
                      <View style={styles.extrasRow}>
                        <Text style={styles.extrasLabel}>Extras:</Text>
                        <Text style={styles.extrasValue}>
                          {inn.extras.total} ({inn.extras.breakdown})
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* BOWLING TABLE */}
                  <View style={[styles.table, { marginTop: 14 }]}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.cell, styles.colName, styles.headerCell]}>Bowler</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>O</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>M</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>R</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>W</Text>
                      <Text style={[styles.cell, styles.colNum, styles.headerCell]}>ECON</Text>
                    </View>

                    {inn.bowlers && inn.bowlers.length > 0 ? (
                      inn.bowlers.map((bw: any, bwIdx: number) => (
                        <View key={bw.id || bwIdx} style={styles.tableRow}>
                          <Text style={[styles.cell, styles.colName, styles.playerName]}>{bw.name}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{bw.overs}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{bw.maidens}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{bw.runs}</Text>
                          <Text style={[styles.cell, styles.colNum, styles.wicketText]}>{bw.wickets}</Text>
                          <Text style={[styles.cell, styles.colNum]}>{bw.economy}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.tableRow}>
                        <Text style={[styles.cell, { fontStyle: 'italic', padding: 8 }]}>No bowling figures</Text>
                      </View>
                    )}
                  </View>

                  {/* FALL OF WICKETS */}
                  {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Fall of Wickets</Text>
                      <Text style={styles.detailSectionBody}>{inn.fallOfWickets.join(' &bull; ')}</Text>
                    </View>
                  )}

                  {/* PARTNERSHIPS */}
                  {inn.partnerships && inn.partnerships.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Partnerships</Text>
                      <View style={{ gap: 4 }}>
                        {inn.partnerships.map((p: any, pIdx: number) => (
                          <View key={pIdx} style={styles.partnershipLine}>
                            <Text style={styles.partnershipWicket}>{p.wicket}:</Text>
                            <Text style={styles.partnershipText}>{p.runs} runs ({p.balls} balls) &bull; {p.batters}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}

              {match.status === 'Live' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigate('LiveScoring', { matchId })}>
                  <Text style={styles.actionBtnText}>Back to Live Scoring</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <SharedFooter />
      </ScrollView>
    </View>
  );
}

function getStyles(isDesktop: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(226, 232, 240, 0.8)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3
    },
    backBtn: { marginBottom: 6 },
    backText: { color: '#b45309', fontSize: 13, fontWeight: 'bold' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '600' },
    scroll: { paddingBottom: 60 },
    contentWrapper: {
      padding: 16,
      maxWidth: 1000,
      width: '100%',
      alignSelf: 'center'
    },
    centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '500' },
    emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
    errorBox: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      borderWidth: 1,
      borderRadius: 8,
      padding: 24,
      alignItems: 'center',
      marginVertical: 24
    },
    errorTitle: { color: '#b91c1c', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    errorSubtitle: { color: '#7f1d1d', fontSize: 13, marginBottom: 16 },
    retryBtn: { backgroundColor: '#b45309', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 4 },
    retryText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

    // MATCH SUMMARY
    matchMetaCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.8)'
    },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
    metaLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    metaVal: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
    statusBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, borderColor: '#fde68a' },
    statusBadgeText: { color: '#b45309', fontSize: 11, fontWeight: 'bold' },

    // RESULT
    resultBanner: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      borderWidth: 1,
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
      alignItems: 'center'
    },
    resultText: { color: '#166534', fontWeight: 'bold', fontSize: 14 },

    // INNINGS
    inningsCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.8)',
      marginBottom: 20,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3
    },
    inningsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      paddingBottom: 8,
      marginBottom: 10
    },
    inningsTitle: { fontSize: 15, fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase' },
    inningsScore: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

    // TABLE
    table: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      overflow: 'hidden'
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center'
    },
    tableHeader: { backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0' },
    cell: { fontSize: 12, color: '#334155' },
    headerCell: { fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: 11 },
    colName: { flex: 3 },
    colNum: { flex: 1, textAlign: 'center' },
    playerName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
    dismissal: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 1 },
    runText: { fontWeight: 'bold', color: '#1e293b' },
    wicketText: { fontWeight: 'bold', color: '#b45309' },

    extrasRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#f8fafc'
    },
    extrasLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    extrasValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },

    detailSection: {
      marginTop: 12,
      padding: 10,
      backgroundColor: '#f8fafc',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#f1f5f9'
    },
    detailSectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
    detailSectionBody: { fontSize: 12, color: '#334155', lineHeight: 18 },
    partnershipLine: { flexDirection: 'row', gap: 6 },
    partnershipWicket: { fontSize: 12, fontWeight: '700', color: '#475569' },
    partnershipText: { fontSize: 12, color: '#334155' },

    actionBtn: {
      backgroundColor: '#eab308',
      paddingVertical: 12,
      borderRadius: 6,
      alignItems: 'center',
      marginTop: 12
    },
    actionBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 }
  });
}
