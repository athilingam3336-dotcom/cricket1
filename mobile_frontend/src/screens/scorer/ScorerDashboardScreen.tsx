import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import MatchCard from '../../components/scorer/MatchCard';
import { MatchData } from '../../data/scorerMockData';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function ScorerDashboardScreen() {
  const { navigate, onExit } = useScorerNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const styles = getStyles(isDesktop);

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [stats, setStats] = useState({
    liveMatches: 1,
    upcomingMatches: 1,
    completedMatches: 1,
    assignedMatches: 3
  });
  const [scorer, setScorer] = useState({ name: 'S. Ramesh', id: 'SCR-101' });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await ScorerApi.getDashboard();
      if (res && res.data) {
        setStats({
          liveMatches: res.data.liveMatches,
          upcomingMatches: res.data.upcomingMatches,
          completedMatches: res.data.completedMatches,
          assignedMatches: res.data.assignedMatches
        });
        if (res.data.matches && res.data.matches.length > 0) {
          setMatches(res.data.matches);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard fetch warning, using seeded defaults:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to exit the scorer console?');
      if (confirmed) onExit();
    } else {
      Alert.alert('Logout', 'Are you sure you want to exit the scorer console?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', onPress: () => onExit() }
      ]);
    }
  };

  const upcomingMatches = matches.filter(m => m.status === 'Upcoming');
  const liveMatches = matches.filter(m => m.status === 'Live');
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const totalAssigned = stats.assignedMatches || matches.length;

  const chartSegments = [
    { id: 'Live', label: 'Live Matches', count: stats.liveMatches, color: '#ef4444', desc: 'Currently scoring' },
    { id: 'Upcoming', label: 'Upcoming', count: stats.upcomingMatches, color: '#3b82f6', desc: 'Next scheduled' },
    { id: 'Completed', label: 'Completed', count: stats.completedMatches, color: '#10b981', desc: 'Recently finished' }
  ];

  const getConicGradient = () => {
    let gradient = '';
    let currentPercentage = 0;
    const total = totalAssigned > 0 ? totalAssigned : 1;
    chartSegments.forEach((seg, index) => {
      const percentage = (seg.count / total) * 100;
      if (percentage === 0) return;
      const isSelected = selectedFilter === seg.id || !selectedFilter;
      const color = isSelected ? seg.color : '#cbd5e1';
      gradient += `${color} ${currentPercentage}% ${currentPercentage + percentage}%`;
      currentPercentage += percentage;
      if (index < chartSegments.length - 1) gradient += ', ';
    });
    return `conic-gradient(${gradient})`;
  };

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
            <Text style={styles.scorerName}>{scorer.name}</Text>
            <Text style={styles.scorerId}>{scorer.id}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentWrapper}>
        {/* STATS & DONUT CHART SECTION */}
        <View style={styles.chartSectionContainer}>
          <View style={styles.chartLegendCol}>
            {chartSegments.map((segment) => {
              const isSelected = selectedFilter === segment.id;
              return (
                <TouchableOpacity
                  key={segment.id}
                  style={[
                    styles.legendCard,
                    isSelected && { borderColor: segment.color, borderWidth: 2, backgroundColor: '#ffffff' }
                  ]}
                  onPress={() => setSelectedFilter(isSelected ? null : segment.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                    <View>
                      <Text style={styles.legendTitle}>{segment.label}</Text>
                      <Text style={styles.legendDesc}>{segment.desc}</Text>
                    </View>
                  </View>
                  <Text style={[styles.legendCount, { color: segment.color }]}>{segment.count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DIAGRAM SECTION */}
          <View style={styles.chartDiagramCol}>
            {Platform.OS === 'web' ? (
              <div style={{
                position: 'relative',
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: getConicGradient(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 36, fontWeight: 'bold', color: '#1e293b' }}>{totalAssigned}</span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {selectedFilter ? selectedFilter : 'Assigned'}
                  </span>
                </div>
              </div>
            ) : (
              <View style={styles.fallbackCircle}>
                <Text style={styles.fallbackCircleNum}>{totalAssigned}</Text>
                <Text style={styles.fallbackCircleText}>Assigned</Text>
              </View>
            )}
          </View>
        </View>

        {/* QUICK ACTIONS PANEL */}
        <View style={styles.quickActionsPanel}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, selectedFilter === 'Live' && { backgroundColor: '#ef4444' }]} 
              onPress={() => {
                if (selectedFilter === 'Live' && liveMatches.length > 0) {
                  navigate('LiveScoring', { matchId: liveMatches[0].id });
                } else {
                  setSelectedFilter('Live');
                }
              }}
            >
              <Text style={styles.primaryActionText}>LIVE SCORING</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryActionBtn, selectedFilter === null && { borderColor: '#b45309', borderWidth: 2, backgroundColor: '#fefce8' }]} 
              onPress={() => setSelectedFilter(null)}
            >
              <Text style={[styles.secondaryActionText, selectedFilter === null && { color: '#b45309' }]}>ASSIGNED MATCHES</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryActionBtn, selectedFilter === 'Completed' && { borderColor: '#10b981', borderWidth: 2, backgroundColor: '#f0fdf4' }]} 
              onPress={() => setSelectedFilter('Completed')}
            >
              <Text style={[styles.secondaryActionText, selectedFilter === 'Completed' && { color: '#166534' }]}>RECENT SCORECARDS</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentGrid}>
          {/* MAIN LEFT COLUMN - LIVE & UPCOMING */}
          <View style={styles.mainCol}>
            {(!selectedFilter || selectedFilter === 'Live') && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>LIVE MATCHES</Text>
                {liveMatches.length > 0 ? (
                  liveMatches.map(match => (
                    <MatchCard key={match.id} match={match} variant="live" />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No live matches right now.</Text>
                )}
              </View>
            )}

            {(!selectedFilter || selectedFilter === 'Upcoming') && (
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
            )}
          </View>

          {/* RIGHT COLUMN - RECENT MATCHES */}
          <View style={styles.sideCol}>
            {(!selectedFilter || selectedFilter === 'Completed') && (
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
            )}
          </View>
        </View>
        </View>

        <SharedFooter />
      </ScrollView>
    </View>
  );
}

const getStyles = (isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  
  // HEADER
  header: {
    padding: 16,
    paddingHorizontal: isDesktop ? 24 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 32, height: 32, marginRight: 10 },
  title: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  subtitle: { color: '#b45309', fontSize: 11, marginTop: 1, fontWeight: '600' },
  
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  scorerInfo: { marginRight: 24, alignItems: 'flex-end', display: isDesktop ? 'flex' : 'none' },
  scorerName: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  scorerId: { color: '#64748b', fontSize: 11 },
  
  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  
  // LAYOUT
  scroll: { flexGrow: 1 },
  contentWrapper: { padding: isDesktop ? 24 : 16, paddingBottom: 40, flex: 1 },
  
  // CHART SECTION
  chartSectionContainer: { flexDirection: isDesktop ? 'row' : 'column-reverse', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  chartLegendCol: { flex: 1, justifyContent: 'center', paddingRight: isDesktop ? 32 : 0 },
  chartDiagramCol: { flex: 1, alignItems: 'center', justifyContent: 'center', borderLeftWidth: isDesktop ? 1 : 0, borderBottomWidth: isDesktop ? 0 : 1, borderColor: '#e2e8f0', paddingVertical: isDesktop ? 0 : 24, marginBottom: isDesktop ? 0 : 24 },
  legendCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.9)' },
  legendDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  legendTitle: { color: '#1e293b', fontSize: 15, fontWeight: 'bold' },
  legendDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  legendCount: { fontSize: 22, fontWeight: 'bold' },
  fallbackCircle: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#f8fafc', borderWidth: 8, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  fallbackCircleNum: { fontSize: 40, fontWeight: 'bold', color: '#1e293b' },
  fallbackCircleText: { fontSize: 12, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  // QUICK ACTIONS
  quickActionsPanel: { backgroundColor: 'rgba(255, 255, 255, 0.75)', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionTitle: { color: '#b45309', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  actionRow: { flexDirection: isDesktop ? 'row' : 'column', gap: 12 },
  primaryActionBtn: { backgroundColor: '#eab308', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, alignItems: 'center' },
  primaryActionText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
  secondaryActionBtn: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryActionText: { color: '#334155', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },

  // CONTENT GRID
  contentGrid: { flexDirection: isDesktop ? 'row' : 'column', gap: 20 },
  mainCol: { flex: 2 },
  sideCol: { flex: 1 },
  
  section: { marginBottom: 24 },
  sectionHeader: { color: '#1e293b', fontSize: 15, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(226, 232, 240, 0.8)', paddingBottom: 8 },
  emptyText: { color: '#64748B', fontSize: 14, fontStyle: 'italic', paddingVertical: 16 }
});
