import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import { assignedMatches } from '../../data/scorerMockData';
import SharedFooter from '../../components/scorer/SharedFooter';

export default function ScorecardScreen() {
  const { navigate, params } = useScorerNavigation();
  const matchId = params?.matchId || 'M002';
  const match = assignedMatches.find(m => m.id === matchId) || assignedMatches[1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Full Scorecard</Text>
        <Text style={styles.subtitle}>{match.tournament} | {match.teamA} vs {match.teamB}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentWrapper}>
        {/* Match Result Banner */}
        {match.result && (
          <View style={styles.resultBanner}>
            <Text style={styles.resultText}>{match.result}</Text>
          </View>
        )}

        <View style={styles.inningsContainer}>
          <Text style={styles.inningsTitle}>{match.teamA} Innings</Text>
          <Text style={styles.inningsScore}>{match.scoreA || '145/4 (15.2 Ov)'}</Text>
        </View>

        {/* Batting Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
             <Text style={[styles.cell, styles.colName]}>Batter</Text>
             <Text style={[styles.cell, styles.colNum]}>R</Text>
             <Text style={[styles.cell, styles.colNum]}>B</Text>
             <Text style={[styles.cell, styles.colNum]}>4s</Text>
             <Text style={[styles.cell, styles.colNum]}>6s</Text>
             <Text style={[styles.cell, styles.colNum]}>SR</Text>
          </View>
          <View style={styles.tableRow}>
             <View style={styles.colName}>
               <Text style={styles.playerName}>Suresh Kumar</Text>
               <Text style={styles.dismissal}>not out</Text>
             </View>
             <Text style={[styles.cell, styles.colNum]}>42</Text>
             <Text style={[styles.cell, styles.colNum]}>30</Text>
             <Text style={[styles.cell, styles.colNum]}>4</Text>
             <Text style={[styles.cell, styles.colNum]}>1</Text>
             <Text style={[styles.cell, styles.colNum]}>140.0</Text>
          </View>
          <View style={styles.tableRow}>
             <View style={styles.colName}>
               <Text style={styles.playerName}>Muthu Raj</Text>
               <Text style={styles.dismissal}>b Karthik N</Text>
             </View>
             <Text style={[styles.cell, styles.colNum]}>12</Text>
             <Text style={[styles.cell, styles.colNum]}>10</Text>
             <Text style={[styles.cell, styles.colNum]}>1</Text>
             <Text style={[styles.cell, styles.colNum]}>0</Text>
             <Text style={[styles.cell, styles.colNum]}>120.0</Text>
          </View>
          <View style={styles.tableRow}>
             <View style={styles.colName}>
               <Text style={styles.playerName}>Vijay</Text>
               <Text style={styles.dismissal}>not out</Text>
             </View>
             <Text style={[styles.cell, styles.colNum]}>18</Text>
             <Text style={[styles.cell, styles.colNum]}>14</Text>
             <Text style={[styles.cell, styles.colNum]}>2</Text>
             <Text style={[styles.cell, styles.colNum]}>0</Text>
             <Text style={[styles.cell, styles.colNum]}>128.5</Text>
          </View>
          <View style={styles.extrasRow}>
             <Text style={styles.extrasText}>Extras: 11 (wd 6, nb 1, b 2, lb 2)</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />

        {/* Bowling Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
             <Text style={[styles.cell, styles.colName]}>Bowler</Text>
             <Text style={[styles.cell, styles.colNum]}>O</Text>
             <Text style={[styles.cell, styles.colNum]}>M</Text>
             <Text style={[styles.cell, styles.colNum]}>R</Text>
             <Text style={[styles.cell, styles.colNum]}>W</Text>
             <Text style={[styles.cell, styles.colNum]}>ECON</Text>
          </View>
          <View style={styles.tableRow}>
             <Text style={[styles.cell, styles.colName, styles.playerName]}>Karthik N</Text>
             <Text style={[styles.cell, styles.colNum]}>3.2</Text>
             <Text style={[styles.cell, styles.colNum]}>0</Text>
             <Text style={[styles.cell, styles.colNum]}>24</Text>
             <Text style={[styles.cell, styles.colNum]}>1</Text>
             <Text style={[styles.cell, styles.colNum]}>7.20</Text>
          </View>
          <View style={styles.tableRow}>
             <Text style={[styles.cell, styles.colName, styles.playerName]}>Saravanan</Text>
             <Text style={[styles.cell, styles.colNum]}>4.0</Text>
             <Text style={[styles.cell, styles.colNum]}>1</Text>
             <Text style={[styles.cell, styles.colNum]}>18</Text>
             <Text style={[styles.cell, styles.colNum]}>2</Text>
             <Text style={[styles.cell, styles.colNum]}>4.50</Text>
          </View>
        </View>

        {match.status === 'Live' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigate('LiveScoring', { matchId })}>
            <Text style={styles.actionBtnText}>Back to Live Scoring</Text>
          </TouchableOpacity>
        )}
        </View>
        <SharedFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.65)', borderBottomWidth: 1, borderBottomColor: 'rgba(226, 232, 240, 0.8)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start', padding: 10, paddingHorizontal: 16, backgroundColor: '#fefce8', borderRadius: 4, borderWidth: 1, borderColor: '#eab308' },
  backText: { color: '#b45309', fontWeight: 'bold', fontSize: 13 },
  title: { color: '#1e293b', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#b45309', fontSize: 13, marginTop: 4, fontWeight: '600' },
  scroll: { flexGrow: 1 },
  contentWrapper: { padding: 16, paddingBottom: 40 },
  resultBanner: { backgroundColor: 'rgba(240, 253, 244, 0.85)', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(187, 247, 208, 0.85)', marginBottom: 16, alignItems: 'center' },
  resultText: { color: '#16a34a', fontWeight: 'bold', fontSize: 13 },
  inningsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.65)', padding: 16, borderRadius: 6, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  inningsTitle: { color: '#b45309', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  inningsScore: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
  table: { backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(226, 232, 240, 0.8)', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' },
  tableHeader: { backgroundColor: 'rgba(254, 243, 199, 0.65)', borderBottomColor: '#fde68a' },
  cell: { color: '#334155', fontSize: 12, fontWeight: '600' },
  colName: { flex: 3 },
  colNum: { flex: 1, textAlign: 'center' },
  playerName: { color: '#1e293b', fontWeight: 'bold', fontSize: 14 },
  dismissal: { color: '#b45309', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  extrasRow: { padding: 12, backgroundColor: 'rgba(254, 243, 199, 0.45)' },
  extrasText: { color: '#b45309', fontSize: 13, fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#eab308', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 20, shadowColor: '#eab308', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  actionBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }
});
