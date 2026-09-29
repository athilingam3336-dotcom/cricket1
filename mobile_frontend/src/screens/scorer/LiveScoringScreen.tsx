import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import { assignedMatches } from '../../data/scorerMockData';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

export default function LiveScoringScreen() {
  const { navigate, params } = useScorerNavigation();
  const matchId = params?.matchId || 'M002';
  const match = assignedMatches.find(m => m.id === matchId) || assignedMatches[1];

  // Match State
  const [runs, setRuns] = useState(145);
  const [wickets, setWickets] = useState(4);
  const [balls, setBalls] = useState(92); // 15.2 overs
  const [history, setHistory] = useState<any[]>([]);

  // Batter/Bowler state (mock)
  const [striker, setStriker] = useState({ name: 'Batter 1', runs: 42, balls: 30, fours: 4, sixes: 1 });
  const [nonStriker, setNonStriker] = useState({ name: 'Batter 2', runs: 18, balls: 14, fours: 2, sixes: 0 });
  const [bowler, setBowler] = useState({ name: 'Bowler 1', overs: 2.2, runs: 16, wickets: 1, maiden: 0 });

  const getOvers = (b: number) => {
    const overs = Math.floor(b / 6);
    const extraBalls = b % 6;
    return `${overs}.${extraBalls}`;
  };

  const handleScore = (run: number, type: 'normal' | 'wide' | 'noball' | 'bye' | 'legbye') => {
    // Save state for undo
    setHistory([...history, { runs, wickets, balls, striker, nonStriker, bowler }]);

    let runToAdd = run;
    let ballToAdd = 1;
    let isExtra = false;

    if (type === 'wide' || type === 'noball') {
      runToAdd += 1;
      ballToAdd = 0;
      isExtra = true;
    }

    setRuns(runs + runToAdd);
    setBalls(balls + ballToAdd);

    // Update bowler
    setBowler({
      ...bowler,
      runs: bowler.runs + runToAdd,
      overs: ballToAdd > 0 ? parseFloat(getOvers((Math.floor(bowler.overs) * 6) + Math.round((bowler.overs % 1) * 10) + 1)) : bowler.overs
    });

    // Update batter if not extra
    if (!isExtra || type === 'noball') {
      if (type === 'normal') {
        const newStrikerRuns = striker.runs + run;
        const newStrikerBalls = striker.balls + 1;
        const newFours = run === 4 ? striker.fours + 1 : striker.fours;
        const newSixes = run === 6 ? striker.sixes + 1 : striker.sixes;

        setStriker({ ...striker, runs: newStrikerRuns, balls: newStrikerBalls, fours: newFours, sixes: newSixes });

        // Switch strike on odd runs or end of over
        if (run % 2 !== 0 || (balls + ballToAdd) % 6 === 0) {
           const temp = striker;
           setStriker({ ...nonStriker, runs: nonStriker.runs, balls: nonStriker.balls, fours: nonStriker.fours, sixes: nonStriker.sixes });
           setNonStriker({ ...temp, runs: newStrikerRuns, balls: newStrikerBalls, fours: newFours, sixes: newSixes });
        }
      }
    } else {
       if (type === 'bye' || type === 'legbye') {
         setStriker({ ...striker, balls: striker.balls + 1 });
         if (run % 2 !== 0 || (balls + ballToAdd) % 6 === 0) {
           const temp = striker;
           setStriker(nonStriker);
           setNonStriker({ ...temp, balls: temp.balls + 1 });
         }
       }
    }
  };

  const handleWicket = () => {
    if (wickets >= 10) return;
    setHistory([...history, { runs, wickets, balls, striker, nonStriker, bowler }]);
    setWickets(wickets + 1);
    setBalls(balls + 1);
    setBowler({
      ...bowler,
      wickets: bowler.wickets + 1,
      overs: parseFloat(getOvers((Math.floor(bowler.overs) * 6) + Math.round((bowler.overs % 1) * 10) + 1))
    });
    setStriker({ name: `Batter ${wickets + 3}`, runs: 0, balls: 0, fours: 0, sixes: 0 });
  };

  const undoLastBall = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setRuns(lastState.runs);
      setWickets(lastState.wickets);
      setBalls(lastState.balls);
      setStriker(lastState.striker);
      setNonStriker(lastState.nonStriker);
      setBowler(lastState.bowler);
      setHistory(history.slice(0, -1));
    }
  };

  const confirmEndInnings = () => {
    Alert.alert('End Innings', 'Are you sure you want to end this innings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Innings', style: 'destructive', onPress: () => navigate('Scorecard', { matchId }) }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn}>
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{match.teamA} vs {match.teamB}</Text>
            <Text style={styles.subtitle}>{match.tournament} | {match.venue}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE SCORING</Text></View>
        </View>
      </View>

      <View style={styles.mainLayout}>
        {/* TOP SECTION: SCOREBOARD & PLAYERS */}
        <View style={styles.topSection}>
          <View style={styles.scoreBoardCard}>
            <Text style={styles.battingTeam}>{match.teamA} (Batting)</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>{runs}/{wickets}</Text>
              <Text style={styles.oversText}>({getOvers(balls)})</Text>
            </View>
            <Text style={styles.rrText}>CRR: {balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00'}</Text>
          </View>

          <View style={styles.playersContainer}>
            <View style={styles.playerCard}>
              <Text style={styles.playerRole}>BATTERS</Text>
              <View style={styles.playerRow}>
                <Text style={[styles.playerName, styles.striker]}>* {striker.name}</Text>
                <Text style={styles.playerStats}>{striker.runs} ({striker.balls})</Text>
              </View>
              <View style={styles.playerRow}>
                <Text style={styles.playerName}>  {nonStriker.name}</Text>
                <Text style={styles.playerStats}>{nonStriker.runs} ({nonStriker.balls})</Text>
              </View>
            </View>
            
            <View style={styles.playerCard}>
               <Text style={styles.playerRole}>CURRENT BOWLER</Text>
               <View style={styles.playerRow}>
                 <Text style={styles.playerName}>{bowler.name}</Text>
                 <Text style={styles.playerStats}>{bowler.overs} ov | {bowler.runs}/{bowler.wickets}</Text>
               </View>
            </View>
          </View>
        </View>

        {/* BOTTOM SECTION: CONTROLS */}
        <View style={styles.controlsSection}>
          <View style={styles.controlPanel}>
            <Text style={styles.sectionTitle}>RUNS</Text>
            <View style={styles.controlsGrid}>
              {[0, 1, 2, 3, 4, 6].map(run => (
                <TouchableOpacity key={run} style={styles.scoreBtn} onPress={() => handleScore(run, 'normal')}>
                  <Text style={styles.scoreBtnText}>{run}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.scoreBtn, styles.wicketBtn]} onPress={handleWicket}>
                <Text style={styles.scoreBtnText}>W</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>EXTRAS</Text>
            <View style={styles.extrasGrid}>
              <TouchableOpacity style={styles.extraBtn} onPress={() => handleScore(0, 'wide')}>
                <Text style={styles.extraBtnText}>Wide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.extraBtn} onPress={() => handleScore(0, 'noball')}>
                <Text style={styles.extraBtnText}>No Ball</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.extraBtn} onPress={() => handleScore(1, 'bye')}>
                <Text style={styles.extraBtnText}>Bye</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.extraBtn} onPress={() => handleScore(1, 'legbye')}>
                <Text style={styles.extraBtnText}>Leg Bye</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.actionPanel}>
            <TouchableOpacity style={[styles.actionBtn, styles.undoBtn]} onPress={undoLastBall} disabled={history.length === 0}>
              <Text style={[styles.actionBtnText, { color: history.length === 0 ? '#495e80' : '#FFF' }]}>Undo Last Ball</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.scorecardBtn]} onPress={() => navigate('Scorecard', { matchId })}>
               <Text style={styles.scorecardBtnText}>View Full Scorecard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.endBtn]} onPress={confirmEndInnings}>
               <Text style={styles.endBtnText}>End Innings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020612' },
  header: { 
    padding: 16, backgroundColor: '#050D22', 
    borderBottomWidth: 1, borderBottomColor: 'rgba(212, 175, 55, 0.35)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16, padding: 8, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 4 },
  backText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 13 },
  title: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  subtitle: { color: '#8A99B5', fontSize: 12, marginTop: 2 },
  headerRight: {},
  liveBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  liveBadgeText: { color: '#EF4444', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  
  mainLayout: { flex: 1, padding: isDesktop ? 24 : 12, justifyContent: 'space-between' },
  
  // TOP SECTION
  topSection: { flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 16 },
  scoreBoardCard: { 
    flex: isDesktop ? 1 : undefined,
    backgroundColor: '#0A1325', padding: 24, borderRadius: 8, 
    borderWidth: 1, borderColor: '#D4AF37', 
    alignItems: 'center', justifyContent: 'center'
  },
  battingTeam: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreText: { color: '#FFF', fontSize: 56, fontWeight: 'bold' },
  oversText: { color: '#8A99B5', fontSize: 24, marginLeft: 12, fontWeight: '600' },
  rrText: { color: '#FFF', fontSize: 15, marginTop: 8, fontWeight: '500' },
  
  playersContainer: { flex: isDesktop ? 1.5 : undefined, gap: 12, justifyContent: 'space-between' },
  playerCard: { backgroundColor: '#070C18', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flex: 1, justifyContent: 'center' },
  playerRole: { color: '#8A99B5', fontSize: 11, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  playerName: { color: '#FFF', fontSize: 15, fontWeight: '500' },
  striker: { fontWeight: 'bold', color: '#D4AF37' },
  playerStats: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  
  // BOTTOM SECTION
  controlsSection: { flex: 1, backgroundColor: '#0A1325', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-between' },
  controlPanel: { flex: 1, justifyContent: 'center' },
  sectionTitle: { color: '#8A99B5', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  
  controlsGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, marginBottom: 24 },
  scoreBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.4)', height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  wicketBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' },
  scoreBtnText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  
  extrasGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, marginBottom: 20 },
  extraBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', height: 50, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  extraBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  actionPanel: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: { flex: 1, height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  undoBtn: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' },
  scorecardBtn: { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  endBtn: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },
  scorecardBtnText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 13 },
  endBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 }
});
