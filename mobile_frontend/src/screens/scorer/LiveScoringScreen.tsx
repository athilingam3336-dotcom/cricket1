import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
  Modal,
  Platform,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useScorerNavigation } from '../../navigation/ScorerNavigationContext';
import SharedFooter from '../../components/scorer/SharedFooter';
import { ScorerApi } from '../../services/api';

export default function LiveScoringScreen() {
  const { navigate, params } = useScorerNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const matchId = params?.matchId || 'M002';
  const styles = getStyles(isDesktop);

  // Loading States (Only initial load shows full-screen spinner; background refreshes are seamless)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Real Persistent Match & Innings State from MongoDB
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [runs, setRuns] = useState<number>(0);
  const [wickets, setWickets] = useState<number>(0);
  const [balls, setBalls] = useState<number>(0);
  const [matchStatus, setMatchStatus] = useState<string>('LIVE');
  const [isInningsBreak, setIsInningsBreak] = useState<boolean>(false);
  const [isMatchEnded, setIsMatchEnded] = useState<boolean>(false);
  const [targetRuns, setTargetRuns] = useState<number | null>(null);

  // Striker, Non-Striker & Bowler
  const [striker, setStriker] = useState<any>(null);
  const [nonStriker, setNonStriker] = useState<any>(null);
  const [bowler, setBowler] = useState<any>(null);

  // Over Status & Next Bowler Modal
  const [isOverComplete, setIsOverComplete] = useState<boolean>(false);
  const [previousBowlerId, setPreviousBowlerId] = useState<string | null>(null);
  const [bowlingSquad, setBowlingSquad] = useState<any[]>([]);
  const [showBowlerModal, setShowBowlerModal] = useState<boolean>(false);
  const [selectedNextBowlerId, setSelectedNextBowlerId] = useState<string>('');
  const [isSubmittingBowler, setIsSubmittingBowler] = useState<boolean>(false);
  const [bowlerErrorMessage, setBowlerErrorMessage] = useState<string | null>(null);

  // Delivery Submission State
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState<boolean>(false);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);
  const [isStartingNextInnings, setIsStartingNextInnings] = useState<boolean>(false);

  // Wicket & Squad
  const [showWicketModal, setShowWicketModal] = useState<boolean>(false);
  const [battingSquad, setBattingSquad] = useState<any[]>([]);
  const [dismissedBatters, setDismissedBatters] = useState<string[]>([]);
  const [selectedNextBatterId, setSelectedNextBatterId] = useState<string>('');
  const [customBatterName, setCustomBatterName] = useState<string>('');

  // End Innings Modal
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // AI Commentary & Fielding
  const [selectedFieldPosition, setSelectedFieldPosition] = useState<string>('Cover');
  const [aiCommentary, setAiCommentary] = useState<string>('');

  const fieldingPositions = [
    'Point',
    'Cover',
    'Mid-Off',
    'Mid-On',
    'Midwicket',
    'Slips',
    'Third Man',
    'Fine Leg'
  ];

  const getOvers = (b: number) => {
    const ov = Math.floor(b / 6);
    const extraBalls = b % 6;
    return `${ov}.${extraBalls}`;
  };

  useEffect(() => {
    loadLiveState(true);

    // Socket.IO real-time score updates
    const socket = ScorerApi.connectSocket(matchId, (payload) => {
      if (payload && payload.score) {
        const parts = payload.score.split('/');
        if (parts.length === 2) {
          setRuns(parseInt(parts[0], 10) || 0);
          setWickets(parseInt(parts[1], 10) || 0);
        }
      }
      if (payload && payload.isOverComplete !== undefined) {
        setIsOverComplete(payload.isOverComplete);
        if (payload.isOverComplete && matchStatus === 'LIVE') {
          setShowBowlerModal(true);
        }
      }
    });

    return () => {
      ScorerApi.disconnectSocket();
    };
  }, [matchId]);

  const loadLiveState = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      }
      setApiError(null);
      const res = await ScorerApi.getLiveState(matchId);
      if (!res || !res.data) {
        throw new Error('Failed to retrieve live match state from MongoDB.');
      }

      const d = res.data;
      const curMatchStatus = d.match?.status || 'LIVE';
      setMatchStatus(curMatchStatus);

      const isBreak = curMatchStatus === 'INNINGS_BREAK';
      const isCompleted = curMatchStatus === 'COMPLETED';
      setIsInningsBreak(isBreak);
      setIsMatchEnded(isCompleted);

      if (d.match) {
        setMatchInfo({
          id: d.match.id,
          teamA: d.innings?.battingTeam || d.match.teamA || 'Team A',
          teamB: d.innings?.bowlingTeam || d.match.teamB || 'Team B',
          tournament: d.match.tournament || 'Virudhunagar Premier League 2026',
          venue: d.match.venue || 'Kamarajar District Stadium',
          status: curMatchStatus,
          resultSummary: d.match.resultSummary || d.match.result,
          targetRuns: d.innings?.target || d.match.targetRuns
        });
      }

      if (d.innings) {
        setRuns(d.innings.totalRuns ?? 0);
        setWickets(d.innings.wickets ?? 0);
        setBalls(d.innings.ballsTotal ?? 0);
        setTargetRuns(d.innings.target ?? null);

        const overDone = !!d.innings.isOverComplete;
        setIsOverComplete(overDone);
        setPreviousBowlerId(d.innings.previousBowlerId || null);

        // DO NOT show Next Bowler popup if innings or match has ended (Requirement 2)
        if (overDone && curMatchStatus === 'LIVE' && !isBreak && !isCompleted && !d.innings.is_completed) {
          setShowBowlerModal(true);
        } else {
          setShowBowlerModal(false);
        }
      }

      if (d.striker) {
        setStriker({
          id: d.striker.id,
          name: d.striker.name,
          runs: d.striker.runs || 0,
          balls: d.striker.balls || 0,
          fours: d.striker.fours || 0,
          sixes: d.striker.sixes || 0
        });
      } else {
        setStriker(null);
      }

      if (d.nonStriker) {
        setNonStriker({
          id: d.nonStriker.id,
          name: d.nonStriker.name,
          runs: d.nonStriker.runs || 0,
          balls: d.nonStriker.balls || 0,
          fours: d.nonStriker.fours || 0,
          sixes: d.nonStriker.sixes || 0
        });
      } else {
        setNonStriker(null);
      }

      if (d.bowler) {
        setBowler({
          id: d.bowler.id,
          name: d.bowler.name,
          overs: d.bowler.overs || 0,
          runs: d.bowler.runs || 0,
          wickets: d.bowler.wickets || 0,
          maidens: d.bowler.maidens || 0,
          economy: d.bowler.economy || 0
        });
      } else {
        setBowler(null);
      }

      if (d.battingSquad && Array.isArray(d.battingSquad)) {
        setBattingSquad(d.battingSquad);
      }

      if (d.bowlingSquad && Array.isArray(d.bowlingSquad)) {
        setBowlingSquad(d.bowlingSquad);
        const prevId = d.innings?.previousBowlerId;
        const eligible = d.bowlingSquad.filter((b: any) => b.id !== prevId && !b.isPreviousBowler);
        if (eligible.length > 0) {
          setSelectedNextBowlerId((prev) => (prev ? prev : eligible[0].id));
        }
      }

      if (d.lastDelivery && d.lastDelivery.commentary) {
        setAiCommentary(d.lastDelivery.commentary);
      }
    } catch (err: any) {
      console.error('loadLiveState error:', err);
      setApiError(err.message || 'Unable to connect to live scoring database.');
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
    }
  };

  const handleScore = async (run: number, type: 'normal' | 'wide' | 'noball' | 'bye' | 'legbye') => {
    if (isOverComplete || showBowlerModal) {
      const msg = 'Over is complete! Please select the next bowler before scoring.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Over Complete', msg);
      setShowBowlerModal(true);
      return;
    }

    if (matchStatus !== 'LIVE' || isInningsBreak || isMatchEnded) {
      const msg = `Match is not currently LIVE (${matchStatus}). Live scoring is paused.`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Match State', msg);
      return;
    }

    if (isSubmittingDelivery) return;

    setIsSubmittingDelivery(true);

    const extraTypeMap: Record<string, string> = {
      normal: 'NONE',
      wide: 'WIDE',
      noball: 'NO_BALL',
      bye: 'BYE',
      legbye: 'LEG_BYE'
    };

    const isExtra = type === 'wide' || type === 'noball';
    const runsBatter = isExtra && type !== 'noball' ? 0 : run;
    const runsExtras = isExtra
      ? type === 'wide' || type === 'noball'
        ? 1 + run
        : run
      : type === 'bye' || type === 'legbye'
      ? run
      : 0;

    const payload = {
      strikerId: striker?.id,
      nonStrikerId: nonStriker?.id,
      bowlerId: bowler?.id,
      runsBatter,
      runsExtras,
      extraType: extraTypeMap[type] || 'NONE',
      wicket: false,
      fieldingPosition: selectedFieldPosition
    };

    try {
      const res = await ScorerApi.recordDelivery(matchId, payload);
      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to record delivery.');
      }

      if (res.commentary) {
        setAiCommentary(res.commentary);
      }

      // Seamless background update without full page refresh
      await loadLiveState(false);

      // Trigger automatic Next Bowler popup after 6 legal deliveries (only if match is still LIVE)
      if (res.isOverComplete || res.data?.isOverComplete) {
        if (res.matchStatus === 'LIVE' && !res.data?.isMatchCompleted) {
          setShowBowlerModal(true);
        }
      }
    } catch (err: any) {
      console.error('recordDelivery error:', err);
      const msg = err.message || 'Error recording delivery. Score was not changed.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const handleWicketClick = () => {
    if (isOverComplete || showBowlerModal) {
      const msg = 'Over is complete! Please select next bowler first.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Over Complete', msg);
      setShowBowlerModal(true);
      return;
    }
    if (wickets >= 10 || isMatchEnded || isInningsBreak) {
      const msg = 'Innings Completed! All 10 wickets are down.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Innings End', msg);
      return;
    }

    const available = battingSquad.filter(
      (p) => p.id !== striker?.id && p.id !== nonStriker?.id && !dismissedBatters.includes(p.id)
    );

    if (available.length > 0) {
      setSelectedNextBatterId(available[0].id);
    } else {
      setSelectedNextBatterId('');
    }
    setCustomBatterName('');
    setShowWicketModal(true);
  };

  const confirmNextBatter = async () => {
    if (wickets >= 10 || isInningsBreak || isMatchEnded) {
      setShowWicketModal(false);
      return;
    }
    if (isSubmittingDelivery) return;

    let nextBatterId = selectedNextBatterId;
    let nextBatterName = customBatterName.trim();

    if (!nextBatterName && nextBatterId) {
      const found = battingSquad.find((p) => p.id === nextBatterId);
      if (found) nextBatterName = found.name;
    }

    if (!nextBatterId && !nextBatterName) {
      const msg = 'Please select or enter the incoming batsman.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Required', msg);
      return;
    }

    setIsSubmittingDelivery(true);
    setShowWicketModal(false);

    const dismissedId = striker?.id;
    if (dismissedId) {
      setDismissedBatters((prev) => [...prev, dismissedId]);
    }

    const payload = {
      strikerId: striker?.id,
      nonStrikerId: nonStriker?.id,
      bowlerId: bowler?.id,
      runsBatter: 0,
      runsExtras: 0,
      extraType: 'NONE',
      wicket: true,
      wicketType: 'CAUGHT',
      dismissedPlayerId: striker?.id,
      replacementBatterId: nextBatterId,
      fieldingPosition: selectedFieldPosition
    };

    try {
      const res = await ScorerApi.recordDelivery(matchId, payload);
      if (res && res.commentary) {
        setAiCommentary(res.commentary);
      }
      setCustomBatterName('');
      await loadLiveState(false);

      if (res.isOverComplete || res.data?.isOverComplete) {
        if (res.matchStatus === 'LIVE' && !res.data?.isMatchCompleted) {
          setShowBowlerModal(true);
        }
      }
    } catch (err: any) {
      console.error('Wicket delivery error:', err);
      const msg = err.message || 'Error recording wicket. Score was not changed.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const confirmNextBowler = async () => {
    if (!selectedNextBowlerId || isSubmittingBowler) return;

    // Guard: Do not allow bowler change if match is not live
    if (matchStatus !== 'LIVE') {
      setBowlerErrorMessage(`Match is not LIVE (current status: ${matchStatus}). Cannot change bowler.`);
      return;
    }

    setIsSubmittingBowler(true);
    setBowlerErrorMessage(null);

    try {
      const res = await ScorerApi.endOver(matchId, selectedNextBowlerId);
      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to appoint next bowler.');
      }

      // Optimistically update bowler to avoid visual lag
      const selectedB = bowlingSquad.find((b) => b.id === selectedNextBowlerId);
      if (selectedB) {
        setBowler((prev: any) => ({
          ...prev,
          id: selectedB.id,
          name: selectedB.name,
          overs: selectedB.overs || 0,
          runs: selectedB.runs || 0,
          wickets: selectedB.wickets || 0,
          economy: selectedB.economy || 0
        }));
      }

      setIsOverComplete(false);
      setShowBowlerModal(false);

      // Seamless background update without full page refresh
      await loadLiveState(false);
    } catch (err: any) {
      console.error('confirmNextBowler error:', err);
      setBowlerErrorMessage(err.message || 'Server rejected bowler selection.');
    } finally {
      setIsSubmittingBowler(false);
    }
  };

  const undoLastBall = async () => {
    if (isUndoing) return;
    setIsUndoing(true);
    try {
      const res = await ScorerApi.undoDelivery(matchId);
      await loadLiveState(false);
    } catch (err: any) {
      console.error('undoDelivery error:', err);
      const msg = err.message || 'Failed to undo last ball.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Undo Failed', msg);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleStartNextInnings = async () => {
    if (isStartingNextInnings) return;
    setIsStartingNextInnings(true);
    try {
      // Transition from INNINGS_BREAK to LIVE for second innings
      await ScorerApi.updateMatchStatus(matchId, 'LIVE');
      await loadLiveState(false);
    } catch (err: any) {
      const msg = err.message || 'Failed to start 2nd innings.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsStartingNextInnings(false);
    }
  };

  const handleSelectFieldPosition = async (pos: string) => {
    setSelectedFieldPosition(pos);
    try {
      const res = await ScorerApi.getFieldingCommentary(matchId, {
        fieldingPosition: pos
      });
      if (res && res.commentary) {
        setAiCommentary(res.commentary);
      }
    } catch (e: any) {
      setAiCommentary(`Fielder stationed at ${pos} is covering the scoring zone.`);
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

  // Initial Full Screen Loading (Only on first load)
  if (isInitialLoading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color="#b45309" />
        <Text style={styles.loadingTitle}>Connecting to MongoDB Live Scorecard...</Text>
        <Text style={styles.loadingSubtitle}>
          Fetching authentic match rosters, playing XI figures, and delivery records
        </Text>
      </View>
    );
  }

  // Error Screen with Retry
  if (apiError || !matchInfo) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚠️ Live Scoring Connection Failed</Text>
          <Text style={styles.errorMessage}>{apiError || 'Match record not found in MongoDB database.'}</Text>
          <View style={styles.errorBtnRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadLiveState(true)}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backDashboardBtn} onPress={() => navigate('Dashboard')}>
              <Text style={styles.backDashboardBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const availableSquad = battingSquad.filter(
    (p) => p.id !== striker?.id && p.id !== nonStriker?.id && !dismissedBatters.includes(p.id)
  );

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
          <View
            style={[
              styles.liveBadge,
              isInningsBreak && styles.breakBadge,
              isMatchEnded && styles.completedBadge
            ]}
          >
            <Text
              style={[
                styles.liveBadgeText,
                isInningsBreak && styles.breakBadgeText,
                isMatchEnded && styles.completedBadgeText
              ]}
            >
              {isMatchEnded ? 'COMPLETED' : isInningsBreak ? 'INNINGS BREAK' : 'LIVE SCORING'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mainLayout}>
          {/* Innings Break Banner */}
          {isInningsBreak && (
            <View style={styles.inningsBreakBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inningsBreakTitle}>⏸️ INNINGS BREAK IN PROGRESS</Text>
                <Text style={styles.inningsBreakSub}>
                  First innings has concluded at {runs}/{wickets} ({getOvers(balls)} overs).
                  {targetRuns ? ` Target for second innings: ${targetRuns} runs.` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.startInningsBtn}
                disabled={isStartingNextInnings}
                onPress={handleStartNextInnings}
              >
                {isStartingNextInnings ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.startInningsBtnText}>Start 2nd Innings ▶</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Match Completed Banner */}
          {isMatchEnded && (
            <View style={styles.matchEndedBanner}>
              <Text style={styles.matchEndedTitle}>🏆 MATCH CONCLUDED</Text>
              <Text style={styles.matchEndedSub}>
                {matchInfo.resultSummary || 'Match completed. All innings finished.'}
              </Text>
            </View>
          )}

          {/* Over Complete Banner (Only if LIVE and not in Innings Break) */}
          {isOverComplete && matchStatus === 'LIVE' && !isInningsBreak && !isMatchEnded && (
            <View style={styles.overCompleteBanner}>
              <Text style={styles.overCompleteText}>
                ⚠️ Over Complete! Six legal deliveries bowled. Please appoint the next bowler.
              </Text>
              <TouchableOpacity style={styles.openBowlerBtn} onPress={() => setShowBowlerModal(true)}>
                <Text style={styles.openBowlerBtnText}>Select Bowler</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TOP SECTION: SCOREBOARD & PLAYERS */}
          <View style={styles.topSection}>
            <View style={styles.scoreBoardCard}>
              <Text style={styles.battingTeam}>{matchInfo.teamA} (Batting)</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreText}>{runs}/{wickets}</Text>
                <Text style={styles.oversText}>({getOvers(balls)})</Text>
              </View>
              <Text style={styles.rrText}>
                CRR: {balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00'}
                {targetRuns ? ` | Target: ${targetRuns}` : ''}
              </Text>
            </View>

            <View style={styles.playersContainer}>
              <View style={styles.playerCard}>
                <Text style={styles.playerRole}>BATTERS</Text>
                <View style={styles.playerRow}>
                  <Text style={[styles.playerName, styles.striker]}>
                    * {striker ? striker.name : 'Striker TBA'}
                  </Text>
                  <Text style={styles.playerStats}>
                    {striker ? `${striker.runs} (${striker.balls})` : '0 (0)'}
                  </Text>
                </View>
                <View style={styles.playerRow}>
                  <Text style={styles.playerName}>
                    {nonStriker ? nonStriker.name : 'Non-Striker TBA'}
                  </Text>
                  <Text style={styles.playerStats}>
                    {nonStriker ? `${nonStriker.runs} (${nonStriker.balls})` : '0 (0)'}
                  </Text>
                </View>
              </View>

              <View style={styles.playerCard}>
                <Text style={styles.playerRole}>CURRENT BOWLER</Text>
                <View style={styles.playerRow}>
                  <Text style={styles.playerName}>{bowler ? bowler.name : 'Bowler TBA'}</Text>
                  <Text style={styles.playerStats}>
                    {bowler
                      ? `${bowler.overs} ov | ${bowler.runs}/${bowler.wickets} | ER: ${bowler.economy}`
                      : '0.0 ov | 0/0'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* AI FIELDING COMMENTARY CARD */}
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
                {[0, 1, 2, 3, 4, 6].map((run) => {
                  let btnStyle = styles.scoreBtnNormal;
                  let textStyle = styles.scoreBtnTextNormal;
                  if (run === 0) {
                    btnStyle = styles.scoreBtnDot;
                    textStyle = styles.scoreBtnTextDot;
                  }
                  if (run === 4) {
                    btnStyle = styles.scoreBtnFour;
                    textStyle = styles.scoreBtnTextBoundary;
                  }
                  if (run === 6) {
                    btnStyle = styles.scoreBtnSix;
                    textStyle = styles.scoreBtnTextBoundary;
                  }

                  const isDisabled =
                    isOverComplete ||
                    showBowlerModal ||
                    isSubmittingDelivery ||
                    matchStatus !== 'LIVE' ||
                    isInningsBreak ||
                    isMatchEnded;

                  return (
                    <TouchableOpacity
                      key={run}
                      disabled={isDisabled}
                      style={[styles.scoreBtn, btnStyle, isDisabled && styles.btnDisabled]}
                      onPress={() => handleScore(run, 'normal')}
                    >
                      <Text style={[styles.scoreBtnText, textStyle]}>{run}</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  disabled={
                    isOverComplete ||
                    showBowlerModal ||
                    isSubmittingDelivery ||
                    matchStatus !== 'LIVE' ||
                    isInningsBreak ||
                    isMatchEnded
                  }
                  style={[
                    styles.scoreBtn,
                    styles.wicketBtn,
                    (isOverComplete ||
                      isSubmittingDelivery ||
                      matchStatus !== 'LIVE' ||
                      isInningsBreak ||
                      isMatchEnded) &&
                      styles.btnDisabled
                  ]}
                  onPress={handleWicketClick}
                >
                  <Text style={[styles.scoreBtnText, styles.wicketBtnText]}>W</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>EXTRAS</Text>
              <View style={styles.extrasGrid}>
                {['wide', 'noball', 'bye', 'legbye'].map((extType) => {
                  const isDisabled =
                    isOverComplete ||
                    showBowlerModal ||
                    isSubmittingDelivery ||
                    matchStatus !== 'LIVE' ||
                    isInningsBreak ||
                    isMatchEnded;
                  const labelMap: Record<string, string> = {
                    wide: 'Wide',
                    noball: 'No Ball',
                    bye: 'Bye',
                    legbye: 'Leg Bye'
                  };
                  const runVal = extType === 'bye' || extType === 'legbye' ? 1 : 0;

                  return (
                    <TouchableOpacity
                      key={extType}
                      disabled={isDisabled}
                      style={[styles.extraBtn, isDisabled && styles.btnDisabled]}
                      onPress={() => handleScore(runVal, extType as any)}
                    >
                      <Text style={styles.extraBtnText}>{labelMap[extType]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* FIELDING POSITION SELECTOR */}
              <Text style={styles.sectionTitle}>FIELDING POSITIONS (AI COMMENTARY)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fieldingChipsScroll}
              >
                {fieldingPositions.map((pos) => {
                  const isActive = selectedFieldPosition === pos;
                  return (
                    <TouchableOpacity
                      key={pos}
                      style={[styles.fieldingChip, isActive && styles.fieldingChipActive]}
                      onPress={() => handleSelectFieldPosition(pos)}
                    >
                      <Text
                        style={[
                          styles.fieldingChipText,
                          isActive && styles.fieldingChipTextActive
                        ]}
                      >
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.actionPanel}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.undoBtn]}
                onPress={undoLastBall}
                disabled={isUndoing || balls === 0 || matchStatus !== 'LIVE'}
              >
                {isUndoing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: balls === 0 || matchStatus !== 'LIVE' ? '#94a3b8' : '#FFF' }
                    ]}
                  >
                    Undo Last Ball
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.scorecardBtn]}
                onPress={() => navigate('Scorecard', { matchId })}
              >
                <Text style={styles.scorecardBtnText}>View Full Scorecard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.endBtn]}
                disabled={isInningsBreak || isMatchEnded}
                onPress={confirmEndInnings}
              >
                <Text style={styles.endBtnText}>End Innings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <SharedFooter />
      </ScrollView>

      {/* AUTOMATIC NEXT BOWLER POPUP MODAL (Only when match is LIVE) */}
      <Modal
        visible={showBowlerModal && matchStatus === 'LIVE' && !isInningsBreak && !isMatchEnded}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.bowlerModalHeader}>
              <View style={styles.bowlerBadgeTag}>
                <Text style={styles.bowlerBadgeTagText}>OVER COMPLETED (6 LEGAL DELIVERIES)</Text>
              </View>
              <Text style={styles.bowlerModalTitle}>Select Next Bowler</Text>
              <Text style={styles.bowlerModalSub}>
                Appoint the bowler for the next over from the bowling team's Playing XI.
              </Text>
            </View>

            {previousBowlerId && (
              <View style={styles.prevBowlerBanner}>
                <Text style={styles.prevBowlerBannerLabel}>PREVIOUS OVER BOWLER</Text>
                <Text style={styles.prevBowlerBannerName}>
                  {bowlingSquad.find((b) => b.id === previousBowlerId)?.name || bowler?.name || 'Previous Bowler'}
                </Text>
                <Text style={styles.prevBowlerBannerNote}>
                  Rule: Bowler who bowled the previous over is ineligible for consecutive overs.
                </Text>
              </View>
            )}

            {bowlerErrorMessage && (
              <View style={styles.errorAlertBox}>
                <Text style={styles.errorAlertText}>⚠️ {bowlerErrorMessage}</Text>
              </View>
            )}

            <Text style={styles.selectLabel}>CHOOSE FROM BOWLING TEAM PLAYING XI:</Text>
            <ScrollView style={{ maxHeight: 220, marginBottom: 14 }}>
              {bowlingSquad.map((player) => {
                const isPrev = player.id === previousBowlerId || player.isPreviousBowler;
                const isSelected = selectedNextBowlerId === player.id;
                return (
                  <TouchableOpacity
                    key={player.id}
                    disabled={isPrev || isSubmittingBowler}
                    style={[
                      styles.bowlerOption,
                      isSelected && styles.bowlerOptionSelected,
                      isPrev && styles.bowlerOptionDisabled
                    ]}
                    onPress={() => {
                      if (!isPrev) {
                        setSelectedNextBowlerId(player.id);
                        setBowlerErrorMessage(null);
                      }
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={[
                            styles.radioDot,
                            isSelected && styles.radioDotSelected,
                            isPrev && styles.radioDotDisabled
                          ]}
                        />
                        <Text
                          style={[
                            styles.bowlerOptionName,
                            isPrev && styles.bowlerOptionNameDisabled
                          ]}
                        >
                          {player.name}
                        </Text>
                        <Text style={styles.bowlerRoleBadge}>{player.role || 'BOWLER'}</Text>
                      </View>
                      <View style={styles.bowlerStatsRow}>
                        <Text style={styles.bowlerStatsText}>
                          {player.overs > 0 || player.runs > 0 || player.wickets > 0
                            ? `${player.overs} ov | ${player.runs} runs | ${player.wickets} wkts | Econ: ${player.economy}`
                            : 'Yet to bowl in this innings'}
                        </Text>
                      </View>
                    </View>
                    {isPrev && (
                      <View style={styles.ineligibleBadge}>
                        <Text style={styles.ineligibleBadgeText}>Bowled Prev Over</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  (!selectedNextBowlerId || isSubmittingBowler) && styles.btnDisabled
                ]}
                disabled={!selectedNextBowlerId || isSubmittingBowler}
                onPress={confirmNextBowler}
              >
                {isSubmittingBowler ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Next Bowler & Resume</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEXT BATTER SELECTION MODAL */}
      <Modal
        visible={showWicketModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 460 }]}>
            <View style={styles.wicketModalHeader}>
              <Text style={styles.wicketModalTitle}>🏏 Select Next Batter</Text>
              <Text style={styles.wicketModalSub}>
                Wicket fallen! Select the incoming batsman from the batting squad.
              </Text>
            </View>

            <View style={styles.dismissedBanner}>
              <Text style={styles.dismissedLabel}>DISMISSED BATTER</Text>
              <Text style={styles.dismissedValue}>
                * {striker ? striker.name : 'Batter'} ({striker ? striker.runs : 0} runs off{' '}
                {striker ? striker.balls : 0} balls)
              </Text>
            </View>

            <Text style={styles.selectLabel}>CHOOSE FROM BATTING SQUAD:</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 14 }}>
              {availableSquad.map((player) => {
                const isSelected =
                  selectedNextBatterId === player.id && !customBatterName.trim();
                return (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.batterOption,
                      isSelected && styles.batterOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedNextBatterId(player.id);
                      setCustomBatterName('');
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={[
                          styles.radioDot,
                          isSelected && styles.radioDotSelected
                        ]}
                      />
                      <Text
                        style={[
                          styles.batterOptionName,
                          isSelected && styles.batterOptionNameSelected
                        ]}
                      >
                        {player.name}
                      </Text>
                    </View>
                    <Text style={styles.batterOptionRole}>
                      {player.role || 'BATSMAN'}
                    </Text>
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
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowWicketModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmNextBatter}
              >
                <Text style={styles.modalConfirmText}>Confirm & Send Batter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (isDesktop: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    centerBox: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24
    },
    loadingTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1e293b',
      marginTop: 16
    },
    loadingSubtitle: {
      fontSize: 13,
      color: '#64748b',
      marginTop: 6,
      textAlign: 'center'
    },
    errorCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 24,
      borderWidth: 1,
      borderColor: '#fca5a5',
      maxWidth: 460,
      width: '100%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#b91c1c',
      marginBottom: 8
    },
    errorMessage: {
      fontSize: 13,
      color: '#475569',
      textAlign: 'center',
      marginBottom: 20
    },
    errorBtnRow: {
      flexDirection: 'row',
      gap: 12
    },
    retryBtn: {
      backgroundColor: '#b45309',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 6
    },
    retryBtnText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 13
    },
    backDashboardBtn: {
      backgroundColor: '#f1f5f9',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#cbd5e1'
    },
    backDashboardBtnText: {
      color: '#334155',
      fontWeight: 'bold',
      fontSize: 13
    },

    header: {
      padding: 12,
      paddingHorizontal: isDesktop ? 24 : 12,
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(226, 232, 240, 0.8)',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: {
      marginRight: 16,
      padding: 8,
      backgroundColor: '#f1f5f9',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e2e8f0'
    },
    backText: { color: '#334155', fontWeight: 'bold', fontSize: 12 },
    title: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
    subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
    headerRight: {},
    liveBadge: {
      backgroundColor: '#fef2f2',
      borderColor: '#fca5a5',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4
    },
    liveBadgeText: {
      color: '#ef4444',
      fontWeight: 'bold',
      fontSize: 11,
      letterSpacing: 1
    },
    breakBadge: {
      backgroundColor: '#fef3c7',
      borderColor: '#fde68a'
    },
    breakBadgeText: {
      color: '#b45309'
    },
    completedBadge: {
      backgroundColor: '#f0fdf4',
      borderColor: '#86efac'
    },
    completedBadgeText: {
      color: '#16a34a'
    },

    scroll: { flexGrow: 1 },
    mainLayout: {
      flex: 1,
      padding: isDesktop ? 24 : 12,
      justifyContent: 'space-between'
    },

    inningsBreakBanner: {
      backgroundColor: '#fffbeb',
      borderWidth: 1,
      borderColor: '#fde68a',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'stretch',
      justifyContent: 'space-between',
      gap: 12
    },
    inningsBreakTitle: {
      color: '#92400e',
      fontWeight: 'bold',
      fontSize: 14,
      marginBottom: 4
    },
    inningsBreakSub: {
      color: '#78350f',
      fontSize: 12,
      lineHeight: 16
    },
    startInningsBtn: {
      backgroundColor: '#b45309',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center'
    },
    startInningsBtnText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 13
    },

    matchEndedBanner: {
      backgroundColor: '#f0fdf4',
      borderWidth: 1,
      borderColor: '#86efac',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center'
    },
    matchEndedTitle: {
      color: '#166534',
      fontWeight: 'bold',
      fontSize: 14,
      marginBottom: 4
    },
    matchEndedSub: {
      color: '#15803d',
      fontSize: 13,
      fontWeight: '600'
    },

    overCompleteBanner: {
      backgroundColor: '#fef3c7',
      borderWidth: 1,
      borderColor: '#fde68a',
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    overCompleteText: {
      color: '#92400e',
      fontWeight: 'bold',
      fontSize: 13,
      flex: 1,
      marginRight: 12
    },
    openBowlerBtn: {
      backgroundColor: '#d97706',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 4
    },
    openBowlerBtnText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 12
    },

    // TOP SECTION
    topSection: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 16,
      marginBottom: 16
    },
    scoreBoardCard: {
      flex: isDesktop ? 1 : undefined,
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
      padding: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.8)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2
    },
    battingTeam: {
      color: '#b45309',
      fontSize: 13,
      fontWeight: 'bold',
      marginBottom: 6,
      textTransform: 'uppercase'
    },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
    scoreText: { color: '#1e293b', fontSize: 48, fontWeight: 'bold' },
    oversText: {
      color: '#64748b',
      fontSize: 20,
      marginLeft: 10,
      fontWeight: '600'
    },
    rrText: { color: '#475569', fontSize: 13, marginTop: 6, fontWeight: '600' },

    playersContainer: {
      flex: isDesktop ? 1.5 : undefined,
      gap: 16,
      justifyContent: 'space-between'
    },
    playerCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.8)',
      flex: 1,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2
    },
    playerRole: {
      color: '#64748b',
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 10,
      letterSpacing: 1
    },
    playerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6
    },
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
    commentaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    commentaryTag: {
      fontSize: 10,
      fontWeight: '800',
      color: '#b45309',
      letterSpacing: 0.5
    },
    commentaryPosition: {
      fontSize: 11,
      fontWeight: '700',
      color: '#92400e',
      backgroundColor: '#fef3c7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    commentaryText: {
      fontSize: 13,
      color: '#78350f',
      fontWeight: '500',
      lineHeight: 18
    },

    // BOTTOM SECTION
    controlsSection: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
      borderRadius: 8,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.8)',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2
    },
    controlPanel: { flex: 1, justifyContent: 'center' },
    sectionTitle: {
      color: '#64748b',
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 10,
      letterSpacing: 1
    },
    controlsGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
      flexWrap: 'wrap'
    },

    scoreBtn: {
      flex: 1,
      minWidth: 44,
      height: 50,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1
    },
    scoreBtnNormal: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
    scoreBtnDot: { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
    scoreBtnFour: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
    scoreBtnSix: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
    wicketBtn: { backgroundColor: '#ef4444', borderColor: '#dc2626' },

    scoreBtnText: { fontSize: 18, fontWeight: 'bold' },
    scoreBtnTextNormal: { color: '#1e293b' },
    scoreBtnTextDot: { color: '#64748b' },
    scoreBtnTextBoundary: { color: '#92400e' },
    wicketBtnText: { color: '#ffffff' },

    extrasGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
      flexWrap: 'wrap'
    },
    extraBtn: {
      flex: 1,
      minWidth: 70,
      height: 40,
      borderRadius: 6,
      backgroundColor: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center'
    },
    extraBtnText: { fontSize: 13, fontWeight: '600', color: '#334155' },

    fieldingChipsScroll: { gap: 8, paddingBottom: 16 },
    fieldingChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#cbd5e1'
    },
    fieldingChipActive: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b'
    },
    fieldingChipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    fieldingChipTextActive: { color: '#92400e', fontWeight: 'bold' },

    actionPanel: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
      flexWrap: 'wrap'
    },
    actionBtn: {
      flex: 1,
      minWidth: 120,
      height: 44,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center'
    },
    undoBtn: { backgroundColor: '#475569' },
    actionBtnText: { fontSize: 13, fontWeight: 'bold' },
    scorecardBtn: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#cbd5e1'
    },
    scorecardBtnText: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
    endBtn: { backgroundColor: '#dc2626' },
    endBtnText: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },

    btnDisabled: { opacity: 0.45 },

    // MODAL COMMON
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 24,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    modalMessage: { fontSize: 14, color: '#64748b', marginTop: 8 },
    modalStatsBox: {
      backgroundColor: '#f8fafc',
      padding: 12,
      borderRadius: 6,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: '#e2e8f0'
    },
    modalStatsText: { fontSize: 14, fontWeight: '600', color: '#334155' },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8
    },
    modalCancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#cbd5e1'
    },
    modalCancelText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
    modalConfirmBtn: {
      backgroundColor: '#b45309',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalConfirmText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

    // BOWLER MODAL STYLES
    bowlerModalHeader: { marginBottom: 14 },
    bowlerBadgeTag: {
      alignSelf: 'flex-start',
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginBottom: 6
    },
    bowlerBadgeTagText: {
      color: '#b45309',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    bowlerModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    bowlerModalSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
    prevBowlerBanner: {
      backgroundColor: '#f1f5f9',
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0'
    },
    prevBowlerBannerLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#64748b',
      letterSpacing: 0.5
    },
    prevBowlerBannerName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0f172a',
      marginTop: 2
    },
    prevBowlerBannerNote: {
      fontSize: 11,
      color: '#dc2626',
      marginTop: 2,
      fontWeight: '500'
    },
    errorAlertBox: {
      backgroundColor: '#fef2f2',
      borderWidth: 1,
      borderColor: '#fca5a5',
      borderRadius: 6,
      padding: 8,
      marginBottom: 10
    },
    errorAlertText: { color: '#b91c1c', fontSize: 12, fontWeight: '600' },
    selectLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#64748b',
      letterSpacing: 0.5,
      marginBottom: 8
    },
    bowlerOption: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
      padding: 10,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    bowlerOptionSelected: {
      borderColor: '#b45309',
      backgroundColor: '#fffbeb'
    },
    bowlerOptionDisabled: {
      backgroundColor: '#f1f5f9',
      borderColor: '#e2e8f0',
      opacity: 0.55
    },
    radioDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: '#94a3b8',
      marginRight: 6
    },
    radioDotSelected: {
      borderColor: '#b45309',
      backgroundColor: '#b45309'
    },
    radioDotDisabled: {
      borderColor: '#cbd5e1',
      backgroundColor: '#e2e8f0'
    },
    bowlerOptionName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    bowlerOptionNameDisabled: { color: '#94a3b8' },
    bowlerRoleBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748b',
      backgroundColor: '#e2e8f0',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3
    },
    bowlerStatsRow: { marginTop: 3, marginLeft: 20 },
    bowlerStatsText: { fontSize: 11, color: '#64748b' },
    ineligibleBadge: {
      backgroundColor: '#fee2e2',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#fca5a5'
    },
    ineligibleBadgeText: { fontSize: 10, fontWeight: '700', color: '#dc2626' },

    // WICKET MODAL
    wicketModalHeader: { marginBottom: 12 },
    wicketModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    wicketModalSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
    dismissedBanner: {
      backgroundColor: '#fef2f2',
      padding: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#fca5a5',
      marginBottom: 12
    },
    dismissedLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#991b1b',
      letterSpacing: 0.5
    },
    dismissedValue: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#7f1d1d',
      marginTop: 2
    },
    batterOption: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
      padding: 10,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    batterOptionSelected: {
      borderColor: '#b45309',
      backgroundColor: '#fffbeb'
    },
    batterOptionName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
    batterOptionNameSelected: { color: '#b45309', fontWeight: 'bold' },
    batterOptionRole: { fontSize: 11, color: '#64748b' },
    customNameInput: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 6,
      padding: 10,
      fontSize: 13,
      color: '#1e293b'
    }
  });
