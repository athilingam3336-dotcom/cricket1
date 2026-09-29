import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useWindowDimensions, Modal } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import { assignedMatches } from '../../data/scorerMockData';
import SharedFooter from '../../components/scorer/SharedFooter';

export default function LiveScoringScreen() {
  const { navigate, params } = useScorerNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const matchId = params?.matchId || 'M002';
  const match = assignedMatches.find(m => m.id === matchId) || assignedMatches[1];
  const styles = getStyles(isDesktop);

  // Match State
  const [runs, setRuns] = useState(145);
  const [wickets, setWickets] = useState(4);
  const [balls, setBalls] = useState(92); // 15.2 overs
  const [history, setHistory] = useState<any[]>([]);
  const [showEndModal, setShowEndModal] = useState(false);

  // Batter/Bowler state (mock)
  const [striker, setStriker] = useState({ name: 'Suresh Kumar', runs: 42, balls: 30, fours: 4, sixes: 1 });
  const [nonStriker, setNonStriker] = useState({ name: 'Muthu Raj', runs: 18, balls: 14, fours: 2, sixes: 0 });
  const [bowler, setBowler] = useState({ name: 'Karthik N', overs: 2.2, runs: 16, wickets: 1, maiden: 0 });

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
    
    const benchNames = ['Vijay', 'Dinesh', 'Ashwin', 'Murugan', 'Saravanan', 'Arun', 'Prakash', 'Ganesh', 'Kamal'];
    const newBatterName = benchNames[wickets % benchNames.length];
    setStriker({ name: newBatterName, runs: 0, balls: 0, fours: 0, sixes: 0 });
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
    setShowEndModal(true);
  };

  return (
    <View style={styles.container}>
      {/* End Innings Modal */}
      <Modal visible={showEndModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>End Innings</Text>
             <Text style={styles.modalMessage}>Are you sure you want to end this innings?</Text>
             <View style={styles.modalStatsBox}>
                <Text style={styles.modalStatsText}>Score: {runs}/{wickets}</Text>
                <Text style={styles.modalStatsText}>Overs: {getOvers(balls)}</Text>
             </View>
             <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEndModal(false)}>
                   <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => { setShowEndModal(false); navigate('Scorecard', { matchId }); }}>
                   <Text style={styles.modalConfirmText}>End Innings</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

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

      <ScrollView contentContainerStyle={styles.scroll}>
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
              {[0, 1, 2, 3, 4, 6].map(run => {
                const isBoundary = run === 4 || run === 6;
                const isDot = run === 0;
                
                let btnStyle: any = styles.scoreBtnNormal;
                let textStyle: any = styles.scoreBtnTextNormal;
                if (run === 4) { btnStyle = styles.scoreBtnFour; textStyle = styles.scoreBtnTextBoundary; }
                else if (run === 6) { btnStyle = styles.scoreBtnSix; textStyle = styles.scoreBtnTextBoundary; }
                else if (isDot) { btnStyle = styles.scoreBtnDot; textStyle = styles.scoreBtnTextDot; }

                return (
                  <TouchableOpacity key={run} style={[styles.scoreBtn, btnStyle]} onPress={() => handleScore(run, 'normal')}>
                    <Text style={[styles.scoreBtnText, textStyle]}>{run}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={[styles.scoreBtn, styles.wicketBtn]} onPress={handleWicket}>
                <Text style={[styles.scoreBtnText, styles.wicketBtnText]}>W</Text>
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
      
      <SharedFooter />
      </ScrollView>
    </View>
  );
}

const getStyles = (isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { 
    padding: 12, paddingHorizontal: isDesktop ? 24 : 12, backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    borderBottomWidth: 1, borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  backText: { color: '#334155', fontWeight: 'bold', fontSize: 12 },
  title: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  headerRight: {},
  liveBadge: { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  liveBadgeText: { color: '#ef4444', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  
  scroll: { flexGrow: 1 },
  mainLayout: { flex: 1, padding: isDesktop ? 24 : 12, justifyContent: 'space-between' },
  
  // TOP SECTION
  topSection: { flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 16 },
  scoreBoardCard: { 
    flex: isDesktop ? 1 : undefined,
    backgroundColor: 'rgba(255, 255, 255, 0.65)', padding: 20, borderRadius: 8, 
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  battingTeam: { color: '#b45309', fontSize: 13, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreText: { color: '#1e293b', fontSize: 48, fontWeight: 'bold' },
  oversText: { color: '#64748b', fontSize: 20, marginLeft: 10, fontWeight: '600' },
  rrText: { color: '#475569', fontSize: 13, marginTop: 6, fontWeight: '600' },
  
  playersContainer: { flex: isDesktop ? 1.5 : undefined, gap: 16, justifyContent: 'space-between' },
  playerCard: { backgroundColor: 'rgba(255, 255, 255, 0.65)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', flex: 1, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  playerRole: { color: '#64748b', fontSize: 11, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  playerName: { color: '#1e293b', fontSize: 14, fontWeight: '600' },
  striker: { fontWeight: 'bold', color: '#b45309' },
  playerStats: { color: '#1e293b', fontSize: 14, fontWeight: 'bold' },
  
  // BOTTOM SECTION
  controlsSection: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  controlPanel: { flex: 1, justifyContent: 'center' },
  sectionTitle: { color: '#b45309', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  
  controlsGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 6, marginBottom: 16 },
  scoreBtn: { flex: 1, borderWidth: 1, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  scoreBtnNormal: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  scoreBtnDot: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  scoreBtnFour: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  scoreBtnSix: { backgroundColor: '#eab308', borderColor: '#ca8a04' },
  wicketBtn: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
  
  scoreBtnText: { fontSize: 20, fontWeight: '900' },
  scoreBtnTextNormal: { color: '#1d4ed8' },
  scoreBtnTextDot: { color: '#475569' },
  scoreBtnTextBoundary: { color: '#ffffff' },
  wicketBtnText: { color: '#ffffff' },
  
  extrasGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 6, marginBottom: 16 },
  extraBtn: { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', height: 44, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  extraBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 13 },
  
  actionPanel: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  undoBtn: { borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' },
  scorecardBtn: { borderColor: '#eab308', backgroundColor: '#fefce8' },
  endBtn: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  actionBtnText: { fontWeight: 'bold', fontSize: 12 },
  scorecardBtnText: { color: '#b45309', fontWeight: 'bold', fontSize: 12 },
  endBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', width: '100%', maxWidth: 400, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20 },
  modalStatsBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center' },
  modalStatsText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { color: '#475569', fontWeight: 'bold', fontSize: 14 },
  modalConfirmBtn: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: '#ef4444', alignItems: 'center' },
  modalConfirmText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
