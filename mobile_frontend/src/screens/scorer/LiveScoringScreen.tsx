import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useWindowDimensions, Modal, Platform, ActivityIndicator } from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigator';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function LiveScoringScreen() {
  const { navigate, params } = useScorerNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const matchId = params?.matchId || 'M002';
  const styles = getStyles(isDesktop);

  const [isLoading, setIsLoading] = useState(true);
  const [isScoringInProgress, setIsScoringInProgress] = useState(false);

  // Match & Innings live state strictly from backend/MySQL
  const [matchInfo, setMatchInfo] = useState({
    id: matchId,
    tournament: '',
    venue: '',
    overs: 20,
    status: '',
    result: ''
  });

  const [inningsInfo, setInningsInfo] = useState({
    id: '',
    inningsNumber: 1,
    battingTeam: '',
    bowlingTeam: '',
    score: '0/0',
    totalRuns: 0,
    wickets: 0,
    overs: '0.0',
    runRate: 0,
    target: null as number | null
  });

  const [striker, setStriker] = useState({ id: '', name: '', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 });
  const [nonStriker, setNonStriker] = useState({ id: '', name: '', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 });
  const [bowler, setBowler] = useState({ id: '', name: '', overs: '0.0', maidens: 0, runs: 0, wickets: 0, economy: 0 });
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [battingSquad, setBattingSquad] = useState<any[]>([]);
  const [bowlingSquad, setBowlingSquad] = useState<any[]>([]);

  // Modals
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraTypeToRecord, setExtraTypeToRecord] = useState<'WIDE' | 'NO_BALL'>('WIDE');
  const [extraAdditionalRuns, setExtraAdditionalRuns] = useState(0);
  const [selectedDismissal, setSelectedDismissal] = useState('BOWLED');
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('');
  const [showEndModal, setShowEndModal] = useState(false);

  // Edit Ball modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRuns, setEditRuns] = useState(0);
  const [editExtraType, setEditExtraType] = useState('NONE');
  const [editWicket, setEditWicket] = useState(false);

  // End Over Modal
  const [showEndOverModal, setShowEndOverModal] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState<string>('');

  useEffect(() => {
    loadLiveState();

    // Connect to Socket.IO for real-time live score updates
    const socket = ScorerApi.connectSocket(matchId, (payload) => {
      if (payload) {
        if (payload.score) {
          setInningsInfo(prev => ({
            ...prev,
            score: payload.score,
            totalRuns: payload.totalRuns !== undefined ? payload.totalRuns : prev.totalRuns,
            wickets: payload.wickets !== undefined ? payload.wickets : prev.wickets,
            overs: payload.overs || prev.overs
          }));
        }
        loadLiveState();
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
        if (d.match) setMatchInfo(d.match);
        if (d.innings) setInningsInfo(d.innings);
        if (d.striker) setStriker(d.striker);
        if (d.nonStriker) setNonStriker(d.nonStriker);
        if (d.bowler) setBowler(d.bowler);
        if (d.recentDeliveries) setRecentDeliveries(d.recentDeliveries);
        if (d.battingSquad) {
          setBattingSquad(d.battingSquad);
          if (d.battingSquad.length > 0 && !selectedReplacementId) {
            setSelectedReplacementId(d.battingSquad[0].id);
          }
        }
        if (d.bowlingSquad) {
          setBowlingSquad(d.bowlingSquad);
          if (d.bowlingSquad.length > 0 && !nextBowlerId) {
            setNextBowlerId(d.bowlingSquad[0].id);
          }
        }
      }
    } catch (err: any) {
      console.warn('Live state fetch warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScore = async (run: number, type: 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' = 'NONE') => {
    if (isScoringInProgress) return;
    setIsScoringInProgress(true);

    try {
      const payload = {
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBatter: (type === 'NONE' || type === 'NO_BALL') ? run : 0,
        runsExtras: (type === 'WIDE' || type === 'NO_BALL') ? 1 : (type === 'BYE' || type === 'LEG_BYE' ? run : 0),
        extraType: type,
        wicket: false
      };

      await ScorerApi.recordDelivery(matchId, payload);
      await loadLiveState();
    } catch (err: any) {
      const msg = err.message || 'Error recording delivery';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Scoring Error', msg);
    } finally {
      setIsScoringInProgress(false);
    }
  };

  const confirmWicket = async () => {
    setShowWicketModal(false);
    setIsScoringInProgress(true);

    try {
      const payload = {
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBatter: 0,
        runsExtras: 0,
        extraType: 'NONE',
        wicket: true,
        wicketType: selectedDismissal,
        dismissedPlayerId: striker.id,
        replacementBatterId: selectedReplacementId || null
      };

      await ScorerApi.recordDelivery(matchId, payload);
      await loadLiveState();
    } catch (err: any) {
      const msg = err.message || 'Error recording wicket';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsScoringInProgress(false);
    }
  };

  const confirmExtra = async () => {
    setShowExtraModal(false);
    setIsScoringInProgress(true);

    try {
      const isWide = extraTypeToRecord === 'WIDE';
      const totalExtraRuns = 1 + extraAdditionalRuns;
      const payload = {
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBatter: !isWide ? extraAdditionalRuns : 0,
        runsExtras: isWide ? totalExtraRuns : 1,
        extraType: extraTypeToRecord,
        wicket: false
      };

      await ScorerApi.recordDelivery(matchId, payload);
      setExtraAdditionalRuns(0);
      await loadLiveState();
    } catch (err: any) {
      const msg = err.message || 'Error recording extra';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsScoringInProgress(false);
    }
  };

  const undoLastBall = async () => {
    try {
      setIsScoringInProgress(true);
      await ScorerApi.undoDelivery(matchId);
      await loadLiveState();
    } catch (err: any) {
      const msg = err.message || 'Error undoing last delivery';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Undo Error', msg);
    } finally {
      setIsScoringInProgress(false);
    }
  };

  const openEditModal = () => {
    if (!recentDeliveries || recentDeliveries.length === 0) {
      const msg = 'No deliveries recorded yet to edit.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Edit Ball', msg);
      return;
    }
    const last = recentDeliveries[0];
    setEditRuns(last.runs_batter !== undefined ? last.runs_batter : 0);
    setEditExtraType(last.extra_type || 'NONE');
    setEditWicket(Boolean(last.wicket));
    setShowEditModal(true);
  };

  const confirmEditBall = async () => {
    setShowEditModal(false);
    if (!recentDeliveries || recentDeliveries.length === 0) return;

    try {
      setIsScoringInProgress(true);
      const last = recentDeliveries[0];
      const payload = {
        runsBatter: editRuns,
        runsExtras: editExtraType === 'WIDE' || editExtraType === 'NO_BALL' ? 1 : 0,
        extraType: editExtraType,
        wicket: editWicket,
        wicketType: editWicket ? 'BOWLED' : null
      };

      await ScorerApi.editDelivery(matchId, last.id, payload);
      await loadLiveState();
    } catch (err: any) {
      const msg = err.message || 'Error editing delivery';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Edit Error', msg);
    } finally {
      setIsScoringInProgress(false);
    }
  };

  const confirmEndOver = async () => {
    setShowEndOverModal(false);
    try {
      setIsScoringInProgress(true);
      await ScorerApi.endOver(matchId, nextBowlerId);
      await loadLiveState();
    } catch (err: any) {
      const msg = err.message || 'Error ending over';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('End Over Error', msg);
    } finally {
      setIsScoringInProgress(false);
    }
  };

  const confirmEndInnings = async () => {
    setShowEndModal(false);
    try {
      setIsLoading(true);
      await ScorerApi.endInnings(matchId);
      await loadLiveState();
      navigate('Scorecard', { matchId });
    } catch (err: any) {
      const msg = err.message || 'Error ending innings';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading check
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <ActivityIndicator size="large" color="#b45309" />
        <Text style={{ marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '500' }}>
          Loading live match state from database...
        </Text>
      </View>
    );
  }

  // Partnership calculation
  const partnershipRuns = (striker.runs || 0) + (nonStriker.runs || 0);
  const partnershipBalls = (striker.balls || 0) + (nonStriker.balls || 0);

  // If match is still SCHEDULED, offer setup
  if (matchInfo.status === 'SCHEDULED') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={styles.scoreBoardCard}>
          <Text style={[styles.title, { textAlign: 'center', marginBottom: 8 }]}>Match Not Started Yet</Text>
          <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 20 }]}>
            {matchInfo.tournament} &bull; Match ID: {matchId}
          </Text>
          <Text style={{ textAlign: 'center', color: '#64748b', marginBottom: 24, fontSize: 13 }}>
            Toss and Playing XI setup must be completed before ball-by-ball scoring can begin.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#eab308', paddingVertical: 14 }]}
            onPress={() => navigate('MatchSetup', { matchId })}
          >
            <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>GO TO MATCH SETUP &amp; TOSS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigate('Dashboard')} style={styles.backBtn}>
            <Text style={styles.backText}>&larr; Dashboard</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{matchInfo.tournament || 'VPL 2026'}</Text>
            <Text style={styles.subtitle}>{matchInfo.venue || 'Kamarajar Stadium'} | Match ID: {matchId}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>&bull; LIVE SCORING</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mainLayout}>
          {/* TOP SECTION: SCOREBOARD & PLAYERS */}
          <View style={styles.topSection}>
            {/* SCORE CARD */}
            <View style={styles.scoreBoardCard}>
              <Text style={styles.battingTeam}>{inningsInfo.battingTeam} (Inn {inningsInfo.inningsNumber})</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreText}>{inningsInfo.score}</Text>
                <Text style={styles.oversText}>({inningsInfo.overs} / {matchInfo.overs} Ov)</Text>
              </View>
              <Text style={styles.rrText}>
                CRR: {inningsInfo.runRate} {inningsInfo.target ? ` | Target: ${inningsInfo.target}` : ''}
              </Text>
              <View style={styles.partnershipBox}>
                <Text style={styles.partnershipLabel}>Current Partnership:</Text>
                <Text style={styles.partnershipVal}>{partnershipRuns} runs ({partnershipBalls} balls)</Text>
              </View>
            </View>

            {/* BATTER & BOWLER SUMMARY */}
            <View style={styles.playersContainer}>
              <View style={styles.playerCard}>
                <Text style={styles.playerRole}>BATTERS</Text>
                <View style={styles.playerRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.strikerDot} />
                    <Text style={[styles.playerName, styles.striker]}>{striker.name} *</Text>
                  </View>
                  <Text style={styles.playerStats}>{striker.runs} ({striker.balls}) [4s: {striker.fours}, 6s: {striker.sixes}]</Text>
                </View>
                <View style={styles.playerRow}>
                  <Text style={[styles.playerName, { marginLeft: 12 }]}>{nonStriker.name}</Text>
                  <Text style={styles.playerStats}>{nonStriker.runs} ({nonStriker.balls}) [4s: {nonStriker.fours}, 6s: {nonStriker.sixes}]</Text>
                </View>
              </View>

              <View style={styles.playerCard}>
                <Text style={styles.playerRole}>CURRENT BOWLER</Text>
                <View style={styles.playerRow}>
                  <Text style={[styles.playerName, styles.striker]}>{bowler.name}</Text>
                  <Text style={styles.playerStats}>{bowler.overs} - {bowler.maidens} - {bowler.runs} - {bowler.wickets}</Text>
                </View>
                <Text style={[styles.rrText, { marginTop: 2 }]}>Economy: {bowler.economy}</Text>
              </View>
            </View>
          </View>

          {/* RECENT BALLS TIMELINE */}
          {recentDeliveries && recentDeliveries.length > 0 && (
            <View style={styles.timelineCard}>
              <Text style={styles.sectionTitle}>BALL-BY-BALL TIMELINE</Text>
              <View style={styles.timelineRow}>
                {recentDeliveries.map((del, idx) => (
                  <View key={del.id || idx} style={[styles.ballCircle, del.wicket ? styles.ballWicket : (del.runs >= 4 ? styles.ballBoundary : styles.ballNormal)]}>
                    <Text style={styles.ballText}>{del.text}</Text>
                  </View>
                ))}
              </View>
              {recentDeliveries[0]?.commentary && (
                <Text style={styles.commentaryText}>Latest: {recentDeliveries[0].commentary}</Text>
              )}
            </View>
          )}

          {/* CONTROLS SECTION */}
          <View style={styles.controlsSection}>
            <View style={styles.controlPanel}>
              <Text style={styles.sectionTitle}>RUN SCORING</Text>
              <View style={styles.controlsGrid}>
                <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnDot]} onPress={() => handleScore(0, 'NONE')} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.scoreBtnTextDot]}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnNormal]} onPress={() => handleScore(1, 'NONE')} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.scoreBtnTextNormal]}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnNormal]} onPress={() => handleScore(2, 'NONE')} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.scoreBtnTextNormal]}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnNormal]} onPress={() => handleScore(3, 'NONE')} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.scoreBtnTextNormal]}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnFour]} onPress={() => handleScore(4, 'NONE')} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.scoreBtnTextBoundary]}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnSix]} onPress={() => handleScore(6, 'NONE')} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.scoreBtnTextBoundary]}>6</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scoreBtn, styles.wicketBtn]} onPress={() => setShowWicketModal(true)} disabled={isScoringInProgress}>
                  <Text style={[styles.scoreBtnText, styles.wicketBtnText]}>WICKET</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>EXTRAS</Text>
              <View style={styles.extrasGrid}>
                <TouchableOpacity style={styles.extraBtn} onPress={() => { setExtraTypeToRecord('WIDE'); setShowExtraModal(true); }}>
                  <Text style={styles.extraBtnText}>Wide</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.extraBtn} onPress={() => { setExtraTypeToRecord('NO_BALL'); setShowExtraModal(true); }}>
                  <Text style={styles.extraBtnText}>No Ball</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.extraBtn} onPress={() => handleScore(1, 'BYE')}>
                  <Text style={styles.extraBtnText}>Bye (1)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.extraBtn} onPress={() => handleScore(1, 'LEG_BYE')}>
                  <Text style={styles.extraBtnText}>Leg Bye (1)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ACTION PANEL */}
            <View style={styles.actionPanel}>
              <TouchableOpacity style={[styles.actionBtn, styles.undoBtn]} onPress={undoLastBall} disabled={isScoringInProgress}>
                <Text style={styles.actionBtnText}>Undo Last Ball</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={openEditModal} disabled={isScoringInProgress}>
                <Text style={styles.editBtnText}>Edit Ball</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.overBtn]} onPress={() => setShowEndOverModal(true)}>
                <Text style={styles.overBtnText}>End Over</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.endBtn]} onPress={() => setShowEndModal(true)}>
                <Text style={styles.endBtnText}>End Innings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.scorecardBtn]} onPress={() => navigate('Scorecard', { matchId })}>
                <Text style={styles.scorecardBtnText}>View Scorecard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* WICKET MODAL */}
        <Modal visible={showWicketModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Record Wicket</Text>
              <Text style={styles.modalMessage}>Dismissed: {striker.name}</Text>

              <Text style={styles.modalSubLabel}>Select Dismissal Type:</Text>
              <View style={styles.optionGrid}>
                {['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionBtn, selectedDismissal === type && styles.optionBtnActive]}
                    onPress={() => setSelectedDismissal(type)}
                  >
                    <Text style={[styles.optionBtnText, selectedDismissal === type && styles.optionBtnTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSubLabel, { marginTop: 12 }]}>Next Batter:</Text>
              <ScrollView style={{ maxHeight: 100, marginBottom: 16 }}>
                {battingSquad.filter(p => p.id !== striker.id && p.id !== nonStriker.id).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerSelectBtn, selectedReplacementId === p.id && styles.playerSelectBtnActive]}
                    onPress={() => setSelectedReplacementId(p.id)}
                  >
                    <Text style={styles.playerSelectText}>{p.name} ({p.role})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWicketModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmWicket}>
                  <Text style={styles.modalConfirmText}>Confirm Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* EXTRA RUNS MODAL */}
        <Modal visible={showExtraModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Record {extraTypeToRecord === 'WIDE' ? 'Wide Ball' : 'No Ball'}</Text>
              <Text style={styles.modalMessage}>Base extra run: 1 run</Text>

              <Text style={styles.modalSubLabel}>Additional Runs (Overthrows / Bat Runs):</Text>
              <View style={styles.optionGrid}>
                {[0, 1, 2, 3, 4].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionBtn, extraAdditionalRuns === r && styles.optionBtnActive]}
                    onPress={() => setExtraAdditionalRuns(r)}
                  >
                    <Text style={[styles.optionBtnText, extraAdditionalRuns === r && styles.optionBtnTextActive]}>+{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.modalActions, { marginTop: 20 }]}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowExtraModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#eab308' }]} onPress={confirmExtra}>
                  <Text style={styles.modalConfirmText}>Record Extra</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* EDIT BALL MODAL */}
        <Modal visible={showEditModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Delivery Record</Text>
              <Text style={styles.modalMessage}>Transaction-safe correction with automatic innings recalculation.</Text>

              <Text style={styles.modalSubLabel}>Runs Scored:</Text>
              <View style={styles.optionGrid}>
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionBtn, editRuns === r && styles.optionBtnActive]}
                    onPress={() => setEditRuns(r)}
                  >
                    <Text style={[styles.optionBtnText, editRuns === r && styles.optionBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSubLabel, { marginTop: 12 }]}>Delivery Type:</Text>
              <View style={styles.optionGrid}>
                {['NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'].map((ext) => (
                  <TouchableOpacity
                    key={ext}
                    style={[styles.optionBtn, editExtraType === ext && styles.optionBtnActive]}
                    onPress={() => setEditExtraType(ext)}
                  >
                    <Text style={[styles.optionBtnText, editExtraType === ext && styles.optionBtnTextActive]}>{ext}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSubLabel, { marginTop: 12 }]}>Wicket Fell?</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.optionBtn, !editWicket && styles.optionBtnActive, { flex: 1 }]}
                  onPress={() => setEditWicket(false)}
                >
                  <Text style={[styles.optionBtnText, !editWicket && styles.optionBtnTextActive]}>No Wicket</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionBtn, editWicket && styles.optionBtnActive, { flex: 1 }]}
                  onPress={() => setEditWicket(true)}
                >
                  <Text style={[styles.optionBtnText, editWicket && styles.optionBtnTextActive]}>Wicket</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#b45309' }]} onPress={confirmEditBall}>
                  <Text style={styles.modalConfirmText}>Save &amp; Recalculate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* END OVER MODAL */}
        <Modal visible={showEndOverModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>End of Over</Text>
              <Text style={styles.modalMessage}>Select Bowler for Next Over:</Text>

              <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
                {bowlingSquad.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerSelectBtn, nextBowlerId === p.id && styles.playerSelectBtnActive]}
                    onPress={() => setNextBowlerId(p.id)}
                  >
                    <Text style={styles.playerSelectText}>{p.name} ({p.role})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEndOverModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmEndOver}>
                  <Text style={styles.modalConfirmText}>Start Next Over</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* END INNINGS MODAL */}
        <Modal visible={showEndModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>End Current Innings?</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to end {inningsInfo.battingTeam}'s innings? Score: {inningsInfo.score}.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEndModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmEndInnings}>
                  <Text style={styles.modalConfirmText}>End Innings</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <SharedFooter />
      </ScrollView>
    </View>
  );
}

const getStyles = (isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { 
    padding: 12, paddingHorizontal: isDesktop ? 24 : 12, backgroundColor: 'rgba(255, 255, 255, 0.75)', 
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 20, borderRadius: 8, 
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  battingTeam: { color: '#b45309', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginVertical: 4 },
  scoreText: { color: '#1e293b', fontSize: 36, fontWeight: 'bold' },
  oversText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  rrText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  partnershipBox: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
  partnershipLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  partnershipVal: { fontSize: 12, color: '#1e293b', fontWeight: 'bold' },
  
  // PLAYERS
  playersContainer: { flex: isDesktop ? 2 : undefined, flexDirection: isDesktop ? 'row' : 'column', gap: 16 },
  playerCard: { 
    flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 16, borderRadius: 8, 
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  playerRole: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 8 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  playerName: { color: '#1e293b', fontSize: 13, fontWeight: '600' },
  striker: { color: '#b45309', fontWeight: 'bold' },
  strikerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#b45309', marginRight: 6 },
  playerStats: { color: '#475569', fontSize: 12 },
  
  // TIMELINE
  timelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 16, borderRadius: 8, 
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  timelineRow: { flexDirection: 'row', gap: 8, marginVertical: 8, flexWrap: 'wrap' },
  ballCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  ballNormal: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  ballBoundary: { backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#fde047' },
  ballWicket: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  ballText: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  commentaryText: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 4 },
  
  // CONTROLS
  controlsSection: { flexDirection: isDesktop ? 'row' : 'column', gap: 16 },
  controlPanel: { 
    flex: isDesktop ? 3 : undefined, backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 16, borderRadius: 8, 
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  controlsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  scoreBtn: { 
    flex: 1, minWidth: 44, height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  scoreBtnDot: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  scoreBtnNormal: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1' },
  scoreBtnFour: { backgroundColor: '#fef08a', borderWidth: 1, borderColor: '#fde047' },
  scoreBtnSix: { backgroundColor: '#fed7aa', borderWidth: 1, borderColor: '#fdba74' },
  wicketBtn: { backgroundColor: '#ef4444', flex: 1.5 },
  scoreBtnText: { fontSize: 16, fontWeight: 'bold' },
  scoreBtnTextDot: { color: '#64748b' },
  scoreBtnTextNormal: { color: '#1e293b' },
  scoreBtnTextBoundary: { color: '#b45309' },
  wicketBtnText: { color: '#ffffff' },
  
  extrasGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  extraBtn: { 
    flex: 1, minWidth: 70, paddingVertical: 10, backgroundColor: '#f8fafc', borderRadius: 4, 
    borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' 
  },
  extraBtnText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  
  // ACTIONS
  actionPanel: { 
    flex: isDesktop ? 1 : undefined, backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 16, borderRadius: 8, 
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  actionBtn: { paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  undoBtn: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  actionBtnText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 12 },
  editBtn: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  editBtnText: { color: '#b45309', fontWeight: 'bold', fontSize: 12 },
  overBtn: { backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd' },
  overBtnText: { color: '#0369a1', fontWeight: 'bold', fontSize: 12 },
  endBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  endBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 12 },
  scorecardBtn: { backgroundColor: '#b45309' },
  scorecardBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 8, padding: 20, width: '100%', maxWidth: 440, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  modalMessage: { fontSize: 12, color: '#64748b', marginBottom: 14 },
  modalSubLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  optionBtnActive: { borderColor: '#b45309', backgroundColor: '#fef3c7' },
  optionBtnText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  optionBtnTextActive: { color: '#b45309', fontWeight: 'bold' },
  playerSelectBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4 },
  playerSelectBtnActive: { borderColor: '#eab308', backgroundColor: '#fefce8' },
  playerSelectText: { fontSize: 12, color: '#1e293b' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  modalCancelText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  modalConfirmBtn: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
  modalConfirmText: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' }
});
