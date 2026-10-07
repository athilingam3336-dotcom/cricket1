import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useWindowDimensions, Modal, Platform } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import { assignedMatches } from '../../data/scorerMockData';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function LiveScoringScreen() {
  const { navigate, params } = useScorerNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const matchId = params?.matchId || 'M002';
  const initialMatch = assignedMatches.find(m => m.id === matchId) || assignedMatches[1];
  const styles = getStyles(isDesktop);

  const [matchInfo, setMatchInfo] = useState<any>(initialMatch);

  // Match State
  const [runs, setRuns] = useState(145);
  const [wickets, setWickets] = useState(4);
  const [balls, setBalls] = useState(92); // 15.2 overs
  const [history, setHistory] = useState<any[]>([]);
  const [showEndModal, setShowEndModal] = useState(false);

  // Batter/Bowler state
  const [striker, setStriker] = useState<any>({ id: 'P301', name: 'Suresh Kumar', runs: 42, balls: 30, fours: 4, sixes: 1 });
  const [nonStriker, setNonStriker] = useState<any>({ id: 'P302', name: 'Muthu Raj', runs: 18, balls: 14, fours: 2, sixes: 0 });
  const [bowler, setBowler] = useState<any>({ id: 'P403', name: 'Karthik N', overs: 2.2, runs: 16, wickets: 1, maiden: 0 });

  // AI Fielding & Commentary State
  const [selectedFieldPosition, setSelectedFieldPosition] = useState<string>('Cover');
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [isLoadingCommentary, setIsLoadingCommentary] = useState<boolean>(false);

  const getOvers = (b: number) => {
    const overs = Math.floor(b / 6);
    const extraBalls = b % 6;
    return `${overs}.${extraBalls}`;
  };

  useEffect(() => {
    loadLiveState();

    // Connect to Socket.IO real-time updates
    const socket = ScorerApi.connectSocket(matchId, (payload) => {
      if (payload && payload.score) {
        const parts = payload.score.split('/');
        if (parts.length === 2) {
          setRuns(parseInt(parts[0], 10) || 0);
          setWickets(parseInt(parts[1], 10) || 0);
        }
      }
    });

    return () => {
      ScorerApi.disconnectSocket();
    };
  }, [matchId]);

  const loadLiveState = async () => {
    try {
      const res = await ScorerApi.getLiveState(matchId);
      if (res && res.data) {
        const d = res.data;
        if (d.match) {
          setMatchInfo({
            ...initialMatch,
            teamA: d.innings?.battingTeam || initialMatch.teamA,
            teamB: d.innings?.bowlingTeam || initialMatch.teamB,
            tournament: d.match.tournament || initialMatch.tournament,
            venue: d.match.venue || initialMatch.venue
          });
        }
        if (d.innings) {
          setRuns(d.innings.totalRuns ?? runs);
          setWickets(d.innings.wickets ?? wickets);
          if (typeof d.innings.ballsTotal === 'number') {
            setBalls(d.innings.ballsTotal);
          }
        }
        if (d.striker) {
          setStriker({
            id: d.striker.id || 'P301',
            name: d.striker.name,
            runs: d.striker.runs || 0,
            balls: d.striker.balls || 0,
            fours: d.striker.fours || 0,
            sixes: d.striker.sixes || 0
          });
        }
        if (d.nonStriker) {
          setNonStriker({
            id: d.nonStriker.id || 'P302',
            name: d.nonStriker.name,
            runs: d.nonStriker.runs || 0,
            balls: d.nonStriker.balls || 0,
            fours: d.nonStriker.fours || 0,
            sixes: d.nonStriker.sixes || 0
          });
        }
        if (d.bowler) {
          setBowler({
            id: d.bowler.id || 'P403',
            name: d.bowler.name,
            overs: parseFloat(d.bowler.overs) || 0,
            runs: d.bowler.runs || 0,
            wickets: d.bowler.wickets || 0,
            maiden: d.bowler.maidens || 0
          });
        }
        if (d.lastDelivery && d.lastDelivery.commentary) {
          setAiCommentary(d.lastDelivery.commentary);
        }
      }
    } catch (e) {
      // Use fallback initial mock
    }
  };

  const handleScore = async (run: number, type: 'normal' | 'wide' | 'noball' | 'bye' | 'legbye') => {
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

    const nextRuns = runs + runToAdd;
    const nextBalls = balls + ballToAdd;
    setRuns(nextRuns);
    setBalls(nextBalls);

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

    // Persist delivery to pure MongoDB backend (Requirement 5 & 8)
    try {
      const extraTypeMap: Record<string, string> = {
        normal: 'NONE',
        wide: 'WIDE',
        noball: 'NO_BALL',
        bye: 'BYE',
        legbye: 'LEG_BYE'
      };

      const payload = {
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBatter: isExtra && type !== 'noball' ? 0 : run,
        runsExtras: isExtra ? 1 : (type === 'bye' || type === 'legbye' ? run : 0),
        extraType: extraTypeMap[type] || 'NONE',
        wicket: false,
        fieldingPosition: selectedFieldPosition
      };

      const res = await ScorerApi.recordDelivery(matchId, payload);
      if (res && res.commentary) {
        setAiCommentary(res.commentary);
      }
    } catch (err: any) {
      console.warn('Backend ball sync note:', err.message);
    }
  };

  const handleWicket = async () => {
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
    setStriker({ id: `P30${(wickets % 9) + 3}`, name: newBatterName, runs: 0, balls: 0, fours: 0, sixes: 0 });

    // Persist wicket ball to pure MongoDB backend
    try {
      const payload = {
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBatter: 0,
        runsExtras: 0,
        extraType: 'NONE',
        wicket: true,
        wicketType: 'CAUGHT',
        fieldingPosition: selectedFieldPosition
      };
      const res = await ScorerApi.recordDelivery(matchId, payload);
      if (res && res.commentary) {
        setAiCommentary(res.commentary);
      }
    } catch (err: any) {
      console.warn('Backend wicket sync note:', err.message);
    }
  };

  const undoLastBall = async () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setRuns(lastState.runs);
      setWickets(lastState.wickets);
      setBalls(lastState.balls);
      setStriker(lastState.striker);
      setNonStriker(lastState.nonStriker);
      setBowler(lastState.bowler);
      setHistory(history.slice(0, -1));

      // Call backend undo endpoint
      try {
        await ScorerApi.undoDelivery(matchId);
      } catch (err: any) {
        console.warn('Backend undo note:', err.message);
      }
    }
  };

  // AI Fielding Commentary Trigger (Requirement 9)
  const handleSelectFieldPosition = async (pos: string) => {
    setSelectedFieldPosition(pos);
    setIsLoadingCommentary(true);
    try {
      const res = await ScorerApi.getFieldingCommentary(matchId, {
        fieldingPosition: pos
      });
      if (res && res.commentary) {
        setAiCommentary(res.commentary);
      }
    } catch (e: any) {
      setAiCommentary(`Fielder positioned at ${pos} is actively monitoring the strike.`);
    } finally {
      setIsLoadingCommentary(false);
    }
  };

  const confirmEndInnings = async () => {
    setShowEndModal(true);
  };

  const handleEndInningsSubmit = async () => {
    setShowEndModal(false);
    try {
      await ScorerApi.endInnings(matchId);
    } catch (err: any) {
      console.warn('End innings API note:', err.message);
    }
    navigate('Scorecard', { matchId });
  };

  const fieldingPositions = ['Point', 'Cover', 'Mid-Off', 'Mid-On', 'Midwicket', 'Slips', 'Third Man', 'Fine Leg'];

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
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleEndInningsSubmit}>
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
            <Text style={styles.title}>{matchInfo.teamA} vs {matchInfo.teamB}</Text>
            <Text style={styles.subtitle}>{matchInfo.tournament} | {matchInfo.venue}</Text>
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
            <Text style={styles.battingTeam}>{matchInfo.teamA} (Batting)</Text>
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

        {/* AI FIELDING COMMENTARY CARD (Requirement 9) */}
        {aiCommentary ? (
          <View style={styles.commentaryCard}>
            <View style={styles.commentaryHeader}>
              <Text style={styles.commentaryTag}>AI FIELDING COMMENTARY</Text>
              <Text style={styles.commentaryPosition}>{selectedFieldPosition}</Text>
            </View>
            <Text style={styles.commentaryText}>{aiCommentary}</Text>
          </View>
        ) : null}

        {/* BOTTOM SECTION: CONTROLS */}
        <View style={styles.controlsSection}>
          <View style={styles.controlPanel}>
            <Text style={styles.sectionTitle}>RUNS</Text>
            <View style={styles.controlsGrid}>
              {[0, 1, 2, 3, 4, 6].map(run => {
                let btnStyle = styles.scoreBtnNormal;
                let textStyle = styles.scoreBtnTextNormal;
                if (run === 0) { btnStyle = styles.scoreBtnDot; textStyle = styles.scoreBtnTextDot; }
                if (run === 4) { btnStyle = styles.scoreBtnFour; textStyle = styles.scoreBtnTextBoundary; }
                if (run === 6) { btnStyle = styles.scoreBtnSix; textStyle = styles.scoreBtnTextBoundary; }

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

            {/* FIELDING POSITION SELECTOR (Requirement 9) */}
            <Text style={styles.sectionTitle}>FIELDING POSITIONS (AI COMMENTARY)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldingChipsScroll}>
              {fieldingPositions.map((pos) => {
                const isActive = selectedFieldPosition === pos;
                return (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.fieldingChip, isActive && styles.fieldingChipActive]}
                    onPress={() => handleSelectFieldPosition(pos)}
                  >
                    <Text style={[styles.fieldingChipText, isActive && styles.fieldingChipTextActive]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

  // AI COMMENTARY CARD
  commentaryCard: {
    backgroundColor: 'rgba(254, 243, 199, 0.75)',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  commentaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentaryTag: { fontSize: 10, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },
  commentaryPosition: { fontSize: 11, fontWeight: '700', color: '#92400e', backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  commentaryText: { fontSize: 13, color: '#78350f', fontWeight: '500', lineHeight: 18 },

  // BOTTOM SECTION
  controlsSection: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  controlPanel: { flex: 1, justifyContent: 'center' },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  controlsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  
  scoreBtn: { flex: 1, minWidth: 44, height: 50, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scoreBtnNormal: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  scoreBtnDot: { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
  scoreBtnFour: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  scoreBtnSix: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  wicketBtn: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
  
  scoreBtnText: { fontSize: 18, fontWeight: 'bold' },
  scoreBtnTextNormal: { color: '#1e293b' },
  scoreBtnTextDot: { color: '#64748b' },
  scoreBtnTextBoundary: { color: '#b45309' },
  wicketBtnText: { color: '#FFF' },
  
  extrasGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  extraBtn: { flex: 1, height: 40, backgroundColor: '#f1f5f9', borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  extraBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 13 },

  fieldingChipsScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 16 },
  fieldingChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  fieldingChipActive: { backgroundColor: '#fef3c7', borderColor: '#b45309' },
  fieldingChipText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  fieldingChipTextActive: { color: '#b45309', fontWeight: 'bold' },

  actionPanel: { flexDirection: isDesktop ? 'row' : 'column', gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  undoBtn: { backgroundColor: '#e2e8f0' },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },
  scorecardBtn: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1' },
  scorecardBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 13 },
  endBtn: { backgroundColor: '#dc2626' },
  endBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 8, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  modalStatsBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-around' },
  modalStatsText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancelBtn: { padding: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#f1f5f9' },
  modalCancelText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },
  modalConfirmBtn: { padding: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#dc2626' },
  modalConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 }
});
