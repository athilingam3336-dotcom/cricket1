import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MatchData } from '../../data/scorerMockData';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';

interface Props {
  match: MatchData;
  variant?: 'live' | 'upcoming' | 'completed';
}

export default function MatchCard({ match, variant = 'upcoming' }: Props) {
  const { navigate } = useScorerNavigation();

  const handleAction = () => {
    if (match.status === 'Upcoming' || match.status === 'Live') {
      navigate('LiveScoring', { matchId: match.id });
    } else {
      navigate('Scorecard', { matchId: match.id });
    }
  };

  const isLive = variant === 'live' || match.status === 'Live';
  const isCompleted = variant === 'completed' || match.status === 'Completed';

  if (isLive) {
    return (
      <View style={[styles.card, styles.liveCard]}>
        <View style={styles.liveHeader}>
          <Text style={styles.tournamentText}>{match.tournament}</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.redDot} />
            <Text style={styles.liveBadgeText}>LIVE NOW</Text>
          </View>
        </View>
        
        <View style={styles.liveTeamsRow}>
          <View style={styles.teamCol}>
            <Text style={styles.liveTeamName}>{match.teamA}</Text>
            <Text style={styles.liveScore}>{match.scoreA || 'Yet to Bat'}</Text>
          </View>
          <View style={styles.vsCol}>
            <Text style={styles.liveVs}>VS</Text>
          </View>
          <View style={styles.teamColRight}>
            <Text style={styles.liveTeamNameRight}>{match.teamB}</Text>
            <Text style={[styles.liveScoreRight, { fontSize: match.scoreB ? 24 : 14, color: match.scoreB ? '#FFF' : '#8A99B5' }]}>
              {match.scoreB || 'Yet to Bat'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{match.venue} • {match.format}</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleAction}>
          <Text style={styles.primaryBtnText}>CONTINUE SCORING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={[styles.card, styles.completedCard]}>
        <Text style={styles.tournamentText}>{match.tournament}</Text>
        
        <View style={styles.compactRow}>
          <Text style={styles.compactTeam}>{match.teamA}</Text>
          <Text style={styles.compactScore}>{match.scoreA}</Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={styles.compactTeam}>{match.teamB}</Text>
          <Text style={styles.compactScore}>{match.scoreB}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>{match.result}</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleAction}>
            <Text style={styles.secondaryBtnText}>VIEW SCORECARD</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Upcoming default
  return (
    <View style={styles.card}>
      <View style={styles.upcomingHeader}>
        <Text style={styles.tournamentText}>{match.tournament}</Text>
        <View style={styles.upcomingBadge}><Text style={styles.upcomingBadgeText}>UPCOMING</Text></View>
      </View>
      
      <View style={styles.upcomingTeamsRow}>
        <Text style={styles.upcomingTeam}>{match.teamA}</Text>
        <Text style={styles.upcomingVs}>VS</Text>
        <Text style={styles.upcomingTeam}>{match.teamB}</Text>
      </View>
      
      <Text style={styles.metaTextCentered}>{match.date} • {match.venue} • {match.format}</Text>
      
      <View style={styles.centerBtnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleAction}>
          <Text style={styles.secondaryBtnText}>VIEW MATCH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A1325',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  liveCard: {
    borderColor: 'rgba(220, 38, 38, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  completedCard: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#070C18',
  },
  
  // LIVE STYLES
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 10, marginBottom: 12 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  liveBadgeText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  tournamentText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  
  liveTeamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamCol: { flex: 1 },
  teamColRight: { flex: 1, alignItems: 'flex-end' },
  vsCol: { width: 40, alignItems: 'center' },
  liveTeamName: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  liveTeamNameRight: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4, textAlign: 'right' },
  liveScore: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  liveScoreRight: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'right' },
  liveVs: { color: '#64748B', fontSize: 13, fontWeight: 'bold' },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metaText: { color: '#8A99B5', fontSize: 12 },
  metaTextCentered: { color: '#8A99B5', fontSize: 12, textAlign: 'center', marginBottom: 16, marginTop: 4 },
  
  primaryBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 4, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  
  // UPCOMING STYLES
  upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  upcomingBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  upcomingBadgeText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  upcomingTeamsRow: { alignItems: 'center', marginBottom: 10 },
  upcomingTeam: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  upcomingVs: { color: '#64748B', fontSize: 12, marginVertical: 4, fontWeight: 'bold' },
  centerBtnRow: { alignItems: 'center' },
  
  // COMPLETED STYLES
  compactRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  compactTeam: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  compactScore: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  resultText: { color: '#10B981', fontSize: 13, fontWeight: '600', flex: 1, paddingRight: 10 },
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  secondaryBtnText: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }
});
