import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import MatchCard from '../../components/scorer/MatchCard';
import { assignedMatches, mockScorerProfile } from '../../data/scorerMockData';

export default function ScorerDashboardScreen() {
  const { navigate } = useScorerNavigation();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => navigate('Auth') }
    ]);
  };

  const upcomingMatches = assignedMatches.filter(m => m.status === 'Upcoming');
  const liveMatches = assignedMatches.filter(m => m.status === 'Live');
  const completedMatches = assignedMatches.filter(m => m.status === 'Completed');

  return (
    <View style={styles.container}>
      {/* PROFESSIONAL HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../../assets/logo_transparent.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Scorer Dashboard</Text>
            <Text style={styles.subtitle}>Official Match Scoring Console</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.scorerInfo}>
            <Text style={styles.scorerName}>{mockScorerProfile.name}</Text>
            <Text style={styles.scorerId}>{mockScorerProfile.id}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* STATISTICS / SUMMARY SECTION */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{assignedMatches.length}</Text>
            <Text style={styles.summaryTitle}>Assigned Matches</Text>
            <Text style={styles.summaryDesc}>This season</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardLive]}>
            <Text style={[styles.summaryValue, styles.liveValue]}>{liveMatches.length}</Text>
            <View style={styles.liveLabelRow}>
              <View style={styles.redDot} />
              <Text style={styles.liveSummaryTitle}>Live Matches</Text>
            </View>
            <Text style={styles.summaryDesc}>Currently scoring</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{completedMatches.length}</Text>
            <Text style={styles.summaryTitle}>Completed</Text>
            <Text style={styles.summaryDesc}>Recently finished</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{upcomingMatches.length}</Text>
            <Text style={styles.summaryTitle}>Upcoming</Text>
            <Text style={styles.summaryDesc}>Next scheduled</Text>
          </View>
        </View>

        {/* QUICK ACTIONS PANEL */}
        <View style={styles.quickActionsPanel}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            {liveMatches.length > 0 && (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => navigate('LiveScoring', { matchId: liveMatches[0].id })}>
                <Text style={styles.primaryActionText}>LIVE SCORING</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => {}}>
              <Text style={styles.secondaryActionText}>ASSIGNED MATCHES</Text>
            </TouchableOpacity>
            {completedMatches.length > 0 && (
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => navigate('Scorecard', { matchId: completedMatches[0].id })}>
                <Text style={styles.secondaryActionText}>RECENT SCORECARDS</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contentGrid}>
          {/* MAIN LEFT COLUMN - LIVE & UPCOMING */}
          <View style={styles.mainCol}>
            {liveMatches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>LIVE MATCHES</Text>
                {liveMatches.map(match => (
                  <MatchCard key={match.id} match={match} variant="live" />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>UPCOMING MATCHES</Text>
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map(match => (
                  <MatchCard key={match.id} match={match} variant="upcoming" />
                ))
              ) : (
                <Text style={styles.emptyText}>No upcoming assigned matches.</Text>
              )}
            </View>
          </View>

          {/* RIGHT COLUMN - RECENT MATCHES */}
          <View style={styles.sideCol}>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>RECENT MATCHES</Text>
              {completedMatches.length > 0 ? (
                completedMatches.map(match => (
                  <MatchCard key={match.id} match={match} variant="completed" />
                ))
              ) : (
                <Text style={styles.emptyText}>No recently completed matches.</Text>
              )}
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020612' },
  
  // HEADER
  header: {
    padding: 16,
    paddingHorizontal: isDesktop ? 32 : 16,
    backgroundColor: '#050D22',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: 'rgba(212, 175, 55, 0.4)',
    borderBottomWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 40, height: 40, marginRight: 12 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  subtitle: { color: '#D4AF37', fontSize: 12, marginTop: 2, fontWeight: '500' },
  
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  scorerInfo: { marginRight: 16, alignItems: 'flex-end', display: isDesktop ? 'flex' : 'none' },
  scorerName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  scorerId: { color: '#8A99B5', fontSize: 11 },
  
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  // LAYOUT
  scroll: { padding: isDesktop ? 32 : 16, paddingBottom: 60, flexGrow: 1 },
  
  // SUMMARY GRID
  summaryGrid: { flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 32 },
  summaryCard: { flex: 1, backgroundColor: '#0A1325', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
  summaryCardLive: { borderColor: 'rgba(220, 38, 38, 0.4)', backgroundColor: 'rgba(220, 38, 38, 0.03)' },
  summaryValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 4 },
  liveValue: { color: '#EF4444' },
  summaryTitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  liveLabelRow: { flexDirection: 'row', alignItems: 'center' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  liveSummaryTitle: { color: '#EF4444', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDesc: { color: '#64748B', fontSize: 12, marginTop: 4 },
  
  // QUICK ACTIONS
  quickActionsPanel: { backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', marginBottom: 32 },
  sectionTitle: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  actionRow: { flexDirection: isDesktop ? 'row' : 'column', gap: 12 },
  primaryActionBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
  primaryActionText: { color: '#000', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  secondaryActionBtn: { backgroundColor: 'transparent', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.5)' },
  secondaryActionText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },

  // CONTENT GRID
  contentGrid: { flexDirection: isDesktop ? 'row' : 'column', gap: 24 },
  mainCol: { flex: 2 },
  sideCol: { flex: 1 },
  
  section: { marginBottom: 32 },
  sectionHeader: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 8 },
  emptyText: { color: '#64748B', fontSize: 14, fontStyle: 'italic', paddingVertical: 20 }
});
