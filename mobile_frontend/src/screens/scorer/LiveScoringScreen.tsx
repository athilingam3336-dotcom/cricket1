import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useWindowDimensions, Modal, Platform, TextInput } from 'react-native';
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

  // Squad & Next Batter Selection Modal State
  const [showWicketModal, setShowWicketModal] = useState<boolean>(false);
  const [battingSquad, setBattingSquad] = useState<any[]>([]);
  const [dismissedBatters, setDismissedBatters] = useState<string[]>([]);
  const [selectedNextBatterId, setSelectedNextBatterId] = useState<string>('');
  const [customBatterName, setCustomBatterName] = useState<string>('');

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
        if (d.battingSquad && Array.isArray(d.battingSquad) && d.battingSquad.length > 0) {
          setBattingSquad(d.battingSquad);
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

    // Batter & Strike Rotation calculation
    let newStriker = { ...striker };
    let newNonStriker = { ...nonStriker };

    if (type === 'normal') {
      const runsScored = run;
      newStriker.runs += runsScored;
      newStriker.balls += 1;
      if (runsScored === 4) newStriker.fours += 1;
      if (runsScored === 6) newStriker.sixes += 1;

      if (runsScored % 2 !== 0 || (nextBalls % 6 === 0 && nextBalls > 0)) {
        setStriker(newNonStriker);
        setNonStriker(newStriker);
      } else {
        setStriker(newStriker);
        setNonStriker(newNonStriker);
      }
    } else if (type === 'noball') {
      const runsScored = run;
      newStriker.runs += runsScored;
      if (runsScored === 4) newStriker.fours += 1;
      if (runsScored === 6) newStriker.sixes += 1;

      if (runsScored % 2 !== 0) {
        setStriker(newNonStriker);
        setNonStriker(newStriker);
      } else {
        setStriker(newStriker);
        setNonStriker(newNonStriker);
      }
    } else if (type === 'bye' || type === 'legbye') {
      newStriker.balls += 1;

      if (run % 2 !== 0 || (nextBalls % 6 === 0 && nextBalls > 0)) {
        setStriker(newNonStriker);
        setNonStriker(newStriker);
      } else {
        setStriker(newStriker);
        setNonStriker(newNonStriker);
      }
    } else if (type === 'wide') {
      // Wide runs are team extras. Batter runs and balls faced DO NOT CHANGE!
      if (run % 2 !== 0) {
        setStriker(newNonStriker);
        setNonStriker(newStriker);
      } else {
        setStriker(newStriker);
        setNonStriker(newNonStriker);
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
        runsExtras: isExtra ? (type === 'wide' || type === 'noball' ? 1 + run : run) : (type === 'bye' || type === 'legbye' ? run : 0),
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

  const defaultSquad = [
    { id: 'P303', name: 'Vijay Anand', role: 'BATSMAN' },
    { id: 'P304', name: 'Dinesh Karthik', role: 'WICKET_KEEPER' },
    { id: 'P305', name: 'R. Ashwin', role: 'ALL_ROUNDER' },
    { id: 'P306', name: 'S. Murugan', role: 'BATSMAN' },
    { id: 'P307', name: 'K. Saravanan', role: 'BATSMAN' },
    { id: 'P308', name: 'M. Arun', role: 'ALL_ROUNDER' },
    { id: 'P309', name: 'V. Prakash', role: 'BATSMAN' },
    { id: 'P310', name: 'Ganesh Kumar', role: 'BOWLER' },
    { id: 'P311', name: 'Kamal Hassan', role: 'BATSMAN' }
  ];

  const fullSquad = battingSquad.length > 0 ? battingSquad : defaultSquad;
  const availableSquad = fullSquad.filter(p => p.id !== striker.id && p.id !== nonStriker.id && !dismissedBatters.includes(p.id));

  const handleWicketClick = () => {
    if (wickets >= 10) {
      const msg = 'Innings Completed! All 10 wickets are down.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Innings End', msg);
      return;
    }
    if (availableSquad.length > 0) {
      setSelectedNextBatterId(availableSquad[0].id);
    } else {
      setSelectedNextBatterId('');
    }
    setCustomBatterName('');
    setShowWicketModal(true);
  };

  const confirmNextBatter = async () => {
    if (wickets >= 10) {
      setShowWicketModal(false);
      return;
    }

    let nextBatterName = customBatterName.trim();
    let nextBatterId = selectedNextBatterId;

    if (!nextBatterName && nextBatterId) {
      const found = fullSquad.find(p => p.id === nextBatterId);
      if (found) nextBatterName = found.name;
    }

    if (!nextBatterName) {
      const benchNames = ['Vijay Anand', 'Dinesh Karthik', 'R. Ashwin', 'S. Murugan', 'K. Saravanan'];
      nextBatterName = benchNames[wickets % benchNames.length];
      nextBatterId = `P30${(wickets % 9) + 3}`;
    }

    // Save history for undo
    setHistory([...history, { runs, wickets, balls, striker, nonStriker, bowler }]);

    const dismissedId = striker.id;
    if (dismissedId) {
      setDismissedBatters(prev => [...prev, dismissedId]);
    }

    const nextWickets = wickets + 1;
    const nextBalls = balls + 1;
    setWickets(nextWickets);
    setBalls(nextBalls);

    // Update Bowler
    setBowler({
      ...bowler,
      wickets: bowler.wickets + 1,
      overs: parseFloat(getOvers((Math.floor(bowler.overs) * 6) + Math.round((bowler.overs % 1) * 10) + 1))
    });

    const newBatterObj = {
      id: nextBatterId || `P30${nextWickets + 2}`,
      name: nextBatterName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0
    };
    setStriker(newBatterObj);
    setShowWicketModal(false);
    setCustomBatterName('');

    // Persist delivery to MongoDB backend
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
        dismissedPlayerId: striker.id,
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
              <TouchableOpacity style={[styles.scoreBtn, styles.wicketBtn]} onPress={handleWicketClick}>
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

      {/* NEXT BATSMAN SELECTION MODAL */}
      <Modal visible={showWicketModal} transparent animationType="fade" onRequestClose={() => setShowWicketModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440 }]}>
            <View style={styles.wicketModalHeader}>
              <Text style={styles.wicketModalTitle}>🏏 Select Next Batsman</Text>
              <Text style={styles.wicketModalSub}>Wicket Fallen! Choose incoming batter from the squad</Text>
            </View>

            <View style={styles.dismissedBanner}>
              <Text style={styles.dismissedLabel}>DISMISSED BATTER</Text>
              <Text style={styles.dismissedValue}>* {striker.name} ({striker.runs} runs off {striker.balls} balls)</Text>
            </View>

            <Text style={styles.selectLabel}>CHOOSE FROM BATTING SQUAD:</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 14 }}>
              {availableSquad.map((player) => {
                const isSelected = selectedNextBatterId === player.id && !customBatterName.trim();
                return (
                  <TouchableOpacity
                    key={player.id}
                    style={[styles.batterOption, isSelected && styles.batterOptionSelected]}
                    onPress={() => {
                      setSelectedNextBatterId(player.id);
                      setCustomBatterName('');
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
                      <Text style={[styles.batterOptionName, isSelected && styles.batterOptionNameSelected]}>
                        {player.name}
                      </Text>
                    </View>
                    <Text style={styles.batterOptionRole}>{player.role || 'BATSMAN'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.selectLabel}>OR ENTER BATSMAN NAME MANUALLY:</Text>
            <TextInput
              style={styles.customNameInput}
              placeholder="e.g. R. Saravanan"
              placeholderTextColor="#94a3b8"
              value={customBatterName}
              onChangeText={(txt) => setCustomBatterName(txt)}
            />

            <View style={[styles.modalActions, { marginTop: 18 }]}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWicketModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmNextBatter}>
                <Text style={styles.modalConfirmText}>Confirm & Send Batter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  // WICKET MODAL STYLES
  wicketModalHeader: { marginBottom: 12 },
  wicketModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#b45309' },
  wicketModalSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  dismissedBanner: { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, padding: 10, borderRadius: 6, marginBottom: 14 },
  dismissedLabel: { fontSize: 10, fontWeight: 'bold', color: '#ef4444', letterSpacing: 0.5 },
  dismissedValue: { fontSize: 13, fontWeight: 'bold', color: '#991b1b', marginTop: 2 },
  selectLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6, letterSpacing: 0.5 },
  batterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 6, backgroundColor: '#f8fafc' },
  batterOptionSelected: { backgroundColor: '#fef3c7', borderColor: '#b45309' },
  radioDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#94a3b8', marginRight: 10 },
  radioDotSelected: { borderColor: '#b45309', backgroundColor: '#b45309' },
  batterOptionName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  batterOptionNameSelected: { color: '#78350f', fontWeight: 'bold' },
  batterOptionRole: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  customNameInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 13, color: '#1e293b', backgroundColor: '#FFF' }
});
