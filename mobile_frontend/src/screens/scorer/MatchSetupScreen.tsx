import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, useWindowDimensions } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function MatchSetupScreen() {
  const { navigate, params } = useScorerNavigation();
  const matchId = params?.matchId || 'M001';
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const styles = getStyles(isDesktop);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);

  // Toss state
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  useEffect(() => {
    loadSetupData();
  }, [matchId]);

  const loadSetupData = async () => {
    try {
      setIsLoading(true);
      const res = await ScorerApi.getMatchSetup(matchId);
      if (res && res.data) {
        setSetupData(res.data);
        setTossWinner(res.data.tossWinner || res.data.teamA?.id || '');
        if (res.data.tossDecision) {
          setTossDecision(res.data.tossDecision);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load match setup:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!tossWinner) {
      const msg = 'Please select the Toss Winner before starting the match.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Toss Required', msg);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        tossWinner,
        tossDecision,
        teamAPlayingXI: (setupData?.teamAPlayers || []).slice(0, 11).map((p: any) => p.id),
        teamBPlayingXI: (setupData?.teamBPlayers || []).slice(0, 11).map((p: any) => p.id)
      };

      const res = await ScorerApi.startMatch(matchId, payload);
      if (res && res.success) {
        navigate('LiveScoring', { matchId });
      }
    } catch (err: any) {
      const msg = err.message || 'Error starting match';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Start Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#b45309" />
        <Text style={styles.loadingText}>Loading Match Information & Squads...</Text>
      </View>
    );
  }

  const teamA = setupData?.teamA || { id: 'T001', name: 'Team A' };
  const teamB = setupData?.teamB || { id: 'T002', name: 'Team B' };
  const teamAPlayers = setupData?.teamAPlayers || [];
  const teamBPlayers = setupData?.teamBPlayers || [];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn}>
          <Text style={styles.backText}>&larr; Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Match Setup & Playing XI</Text>
        <Text style={styles.subtitle}>
          {setupData?.tournament || 'VPL 2026'} &bull; {teamA.name} vs {teamB.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentWrapper}>
          
          {/* MATCH INFO BANNER */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Match Details</Text>
            <View style={styles.grid2}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Tournament</Text>
                <Text style={styles.infoVal}>{setupData?.tournament || 'Virudhunagar Premier League 2026'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoVal}>{setupData?.venue || 'Kamarajar Stadium, Virudhunagar'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Match Format / Overs</Text>
                <Text style={styles.infoVal}>T20 &bull; {setupData?.overs || 20} Overs per side</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{setupData?.status || 'SCHEDULED'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* TOSS SECTION */}
          <View style={[styles.card, styles.tossCard]}>
            <Text style={styles.cardHeader}>Toss Configuration</Text>
            <Text style={styles.sectionHelp}>Select the toss winner and their decision to initiate scoring</Text>
            
            <View style={styles.tossBlock}>
              <Text style={styles.fieldLabel}>Toss Won By:</Text>
              <View style={styles.tossOptionsRow}>
                <TouchableOpacity
                  style={[styles.tossBtn, tossWinner === teamA.id && styles.tossBtnActive]}
                  onPress={() => setTossWinner(teamA.id)}
                >
                  <Text style={[styles.tossBtnText, tossWinner === teamA.id && styles.tossBtnTextActive]}>
                    {teamA.name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tossBtn, tossWinner === teamB.id && styles.tossBtnActive]}
                  onPress={() => setTossWinner(teamB.id)}
                >
                  <Text style={[styles.tossBtnText, tossWinner === teamB.id && styles.tossBtnTextActive]}>
                    {teamB.name}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tossBlock}>
              <Text style={styles.fieldLabel}>Elected To:</Text>
              <View style={styles.tossOptionsRow}>
                <TouchableOpacity
                  style={[styles.tossBtn, tossDecision === 'BAT' && styles.tossBtnActive]}
                  onPress={() => setTossDecision('BAT')}
                >
                  <Text style={[styles.tossBtnText, tossDecision === 'BAT' && styles.tossBtnTextActive]}>
                    BAT FIRST
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tossBtn, tossDecision === 'BOWL' && styles.tossBtnActive]}
                  onPress={() => setTossDecision('BOWL')}
                >
                  <Text style={[styles.tossBtnText, tossDecision === 'BOWL' && styles.tossBtnTextActive]}>
                    BOWL FIRST
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Toss summary announcement */}
            {tossWinner ? (
              <View style={styles.tossSummary}>
                <Text style={styles.tossSummaryText}>
                  &bull; {tossWinner === teamA.id ? teamA.name : teamB.name} won the toss and elected to {tossDecision.toLowerCase()} first.
                </Text>
              </View>
            ) : null}
          </View>

          {/* SQUADS & PLAYING XI */}
          <View style={styles.squadsRow}>
            {/* Team A Squad */}
            <View style={[styles.card, styles.squadCard]}>
              <View style={styles.squadHeaderRow}>
                <Text style={styles.squadTitle}>{teamA.name}</Text>
                <View style={styles.xiBadge}><Text style={styles.xiBadgeText}>Playing XI</Text></View>
              </View>
              <View style={styles.playerList}>
                {teamAPlayers.slice(0, 11).map((p: any, idx: number) => (
                  <View key={p.id || idx} style={styles.playerItem}>
                    <Text style={styles.playerNumber}>#{p.jersey_number || idx + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{p.name}</Text>
                      <Text style={styles.playerRole}>{p.role || 'Player'}</Text>
                    </View>
                    {idx === 0 && <View style={styles.cBadge}><Text style={styles.cBadgeText}>C</Text></View>}
                    {p.role === 'WICKET_KEEPER' && <View style={styles.wkBadge}><Text style={styles.wkBadgeText}>WK</Text></View>}
                  </View>
                ))}
              </View>
            </View>

            {/* Team B Squad */}
            <View style={[styles.card, styles.squadCard]}>
              <View style={styles.squadHeaderRow}>
                <Text style={styles.squadTitle}>{teamB.name}</Text>
                <View style={styles.xiBadge}><Text style={styles.xiBadgeText}>Playing XI</Text></View>
              </View>
              <View style={styles.playerList}>
                {teamBPlayers.slice(0, 11).map((p: any, idx: number) => (
                  <View key={p.id || idx} style={styles.playerItem}>
                    <Text style={styles.playerNumber}>#{p.jersey_number || idx + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{p.name}</Text>
                      <Text style={styles.playerRole}>{p.role || 'Player'}</Text>
                    </View>
                    {idx === 0 && <View style={styles.cBadge}><Text style={styles.cBadgeText}>C</Text></View>}
                    {p.role === 'WICKET_KEEPER' && <View style={styles.wkBadge}><Text style={styles.wkBadgeText}>WK</Text></View>}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* MATCH OFFICIALS */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Match Officials</Text>
            <View style={styles.grid2}>
              <View style={styles.officialCol}>
                <Text style={styles.officialRole}>On-Field Umpire 1</Text>
                <Text style={styles.officialName}>K. Sundaram (TNCA)</Text>
              </View>
              <View style={styles.officialCol}>
                <Text style={styles.officialRole}>On-Field Umpire 2</Text>
                <Text style={styles.officialName}>P. Velmurugan (TNCA)</Text>
              </View>
              <View style={styles.officialCol}>
                <Text style={styles.officialRole}>Official Scorer</Text>
                <Text style={styles.officialName}>S. Ramesh (SCR-101)</Text>
              </View>
              <View style={styles.officialCol}>
                <Text style={styles.officialRole}>Match Referee</Text>
                <Text style={styles.officialName}>R. Senthil Kumar</Text>
              </View>
            </View>
          </View>

          {/* ACTION BUTTON */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.startMatchBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleStartMatch}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.startMatchText}>START MATCH &amp; BEGIN SCORING</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      <SharedFooter />
    </View>
  );
}

function getStyles(isDesktop: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '500' },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(226, 232, 240, 0.8)',
      backgroundColor: 'rgba(255, 255, 255, 0.8)'
    },
    backBtn: { marginBottom: 6 },
    backText: { color: '#b45309', fontSize: 13, fontWeight: 'bold' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
    scroll: { paddingBottom: 60 },
    contentWrapper: {
      padding: 16,
      maxWidth: 1000,
      width: '100%',
      alignSelf: 'center'
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.8)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3
    },
    tossCard: {
      borderColor: 'rgba(234, 179, 8, 0.5)',
      borderLeftWidth: 4,
      borderLeftColor: '#eab308'
    },
    cardHeader: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    sectionHelp: { fontSize: 12, color: '#64748b', marginBottom: 12 },
    grid2: { flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap' },
    infoCol: { width: isDesktop ? '50%' : '100%', marginBottom: 12 },
    infoLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '600' },
    infoVal: { fontSize: 14, color: '#1e293b', fontWeight: '600', marginTop: 2 },
    statusBadge: {
      backgroundColor: '#fef3c7',
      borderColor: '#fde68a',
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 4
    },
    statusBadgeText: { color: '#b45309', fontSize: 11, fontWeight: 'bold' },
    tossBlock: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8, textTransform: 'uppercase' },
    tossOptionsRow: { flexDirection: 'row', gap: 12 },
    tossBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      backgroundColor: '#ffffff',
      alignItems: 'center'
    },
    tossBtnActive: {
      borderColor: '#eab308',
      backgroundColor: '#fefce8',
      borderWidth: 2
    },
    tossBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    tossBtnTextActive: { color: '#b45309', fontWeight: 'bold' },
    tossSummary: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      borderWidth: 1,
      borderRadius: 6,
      padding: 10,
      marginTop: 4
    },
    tossSummaryText: { color: '#166534', fontSize: 13, fontWeight: '600' },
    squadsRow: { flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 16 },
    squadCard: { flex: 1, marginBottom: 0 },
    squadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    squadTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    xiBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
    xiBadgeText: { color: '#0369a1', fontSize: 10, fontWeight: 'bold' },
    playerList: {},
    playerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9'
    },
    playerNumber: { width: 36, fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    playerName: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
    playerRole: { fontSize: 10, color: '#64748b' },
    cBadge: { backgroundColor: '#fef08a', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3, marginRight: 4 },
    cBadgeText: { color: '#854d0e', fontSize: 10, fontWeight: 'bold' },
    wkBadge: { backgroundColor: '#bae6fd', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
    wkBadgeText: { color: '#0369a1', fontSize: 10, fontWeight: 'bold' },
    officialCol: { width: isDesktop ? '50%' : '100%', marginBottom: 10 },
    officialRole: { fontSize: 11, color: '#64748b' },
    officialName: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
    actionContainer: { marginTop: 8, marginBottom: 24, alignItems: 'center' },
    startMatchBtn: {
      backgroundColor: '#eab308',
      paddingVertical: 14,
      paddingHorizontal: 36,
      borderRadius: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      width: isDesktop ? 360 : '100%',
      alignItems: 'center'
    },
    startMatchText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 }
  });
}
