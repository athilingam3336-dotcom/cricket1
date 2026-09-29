import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import { assignedMatches } from '../../data/scorerMockData';

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
               <Text style={styles.playerName}>Batter 1</Text>
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
               <Text style={styles.playerName}>Batter 2</Text>
               <Text style={styles.dismissal}>b Bowler 1</Text>
             </View>
             <Text style={[styles.cell, styles.colNum]}>12</Text>
             <Text style={[styles.cell, styles.colNum]}>10</Text>
             <Text style={[styles.cell, styles.colNum]}>1</Text>
             <Text style={[styles.cell, styles.colNum]}>0</Text>
             <Text style={[styles.cell, styles.colNum]}>120.0</Text>
          </View>
          <View style={styles.tableRow}>
             <View style={styles.colName}>
               <Text style={styles.playerName}>Batter 3</Text>
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
             <Text style={[styles.cell, styles.colName, styles.playerName]}>Bowler 1</Text>
             <Text style={[styles.cell, styles.colNum]}>3.2</Text>
             <Text style={[styles.cell, styles.colNum]}>0</Text>
             <Text style={[styles.cell, styles.colNum]}>24</Text>
             <Text style={[styles.cell, styles.colNum]}>1</Text>
             <Text style={[styles.cell, styles.colNum]}>7.20</Text>
          </View>
          <View style={styles.tableRow}>
             <Text style={[styles.cell, styles.colName, styles.playerName]}>Bowler 2</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020612' },
  header: { padding: 16, backgroundColor: 'rgba(5, 13, 34, 0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(212, 175, 55, 0.35)' },
  backBtn: { marginBottom: 10 },
  backText: { color: '#D4AF37', fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#9bb0cf', fontSize: 12, marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  resultBanner: { backgroundColor: 'rgba(21, 128, 61, 0.2)', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#15803d', marginBottom: 16, alignItems: 'center' },
  resultText: { color: '#15803d', fontWeight: 'bold' },
  inningsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a1838', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inningsTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  inningsScore: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  table: { backgroundColor: 'rgba(10, 24, 56, 0.92)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.35)', overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  tableHeader: { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  cell: { color: '#FFF', fontSize: 12 },
  colName: { flex: 3 },
  colNum: { flex: 1, textAlign: 'center' },
  playerName: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  dismissal: { color: '#9bb0cf', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  extrasRow: { padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  extrasText: { color: '#e6edf8', fontSize: 12, fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#D4AF37', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 20 },
  actionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});
