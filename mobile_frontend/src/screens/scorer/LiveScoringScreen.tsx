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

  // Comprehensive Wicket & Dismissal State
  const [showWicketModal, setShowWicketModal] = useState<boolean>(false);
  const [battingSquad, setBattingSquad] = useState<any[]>([]);
  const [dismissedBatters, setDismissedBatters] = useState<string[]>([]);
  const [selectedNextBatterId, setSelectedNextBatterId] = useState<string>('');
  const [isBatterDropdownOpen, setIsBatterDropdownOpen] = useState<boolean>(false);
  const [batterSearchQuery, setBatterSearchQuery] = useState<string>('');
  const [customBatterName, setCustomBatterName] = useState<string>('');
  const [wicketType, setWicketType] = useState<string>('BOWLED');
  const [dismissedTarget, setDismissedTarget] = useState<'striker' | 'nonStriker'>('striker');
  const [selectedFielderId, setSelectedFielderId] = useState<string>('');
  const [customFielderName, setCustomFielderName] = useState<string>('');
  const [isFielderDropdownOpen, setIsFielderDropdownOpen] = useState<boolean>(false);
  const [fielderSearchQuery, setFielderSearchQuery] = useState<string>('');
  const [runsOnWicket, setRunsOnWicket] = useState<number>(0);
  const [lastDismissal, setLastDismissal] = useState<any>(null);

  // Custom Runs & Extra Runs Input Modal State
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customRunsInput, setCustomRunsInput] = useState<string>('5');
  const [customCategory, setCustomCategory] = useState<string>('normal');

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
      if (d.lastDismissal) {
        setLastDismissal(d.lastDismissal);
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

    // Initialize rich wicket state
    setDismissedTarget('striker');
    setWicketType('BOWLED');
    setSelectedFielderId('');
    setCustomFielderName('');
    setIsFielderDropdownOpen(false);
    setIsBatterDropdownOpen(false);
    setFielderSearchQuery('');
    setRunsOnWicket(0);
    setBatterSearchQuery('');
    setCustomBatterName('');

    const seenInit = new Set<string>();
    const available = battingSquad.filter((p) => {
      if (!p || !p.name) return false;
      const cName = p.name.trim().toLowerCase();
      if (p.id === striker?.id || p.id === nonStriker?.id) return false;
      if (dismissedBatters.includes(p.id) || dismissedBatters.includes(cName)) return false;
      if (seenInit.has(cName)) return false;
      seenInit.add(cName);
      return true;
    });

    if (available.length > 0) {
      setSelectedNextBatterId(available[0].id);
    } else {
      setSelectedNextBatterId('');
    }
    setShowWicketModal(true);
  };

  const confirmNextBatter = async () => {
    if (wickets >= 10 || isInningsBreak || isMatchEnded) {
      setShowWicketModal(false);
      return;
    }
    if (isSubmittingDelivery) return;

    const outBatter = dismissedTarget === 'striker' ? striker : nonStriker;
    const isTenthWicket = wickets + 1 >= 10;

    let nextBatterId = selectedNextBatterId;
    let nextBatterName = customBatterName.trim();

    if (!isTenthWicket) {
      if (nextBatterName) {
        if (!nextBatterId) {
          nextBatterId = `PLY-MANUAL-${Date.now()}`;
        }
      } else if (nextBatterId) {
        const found = battingSquad.find((p) => p.id === nextBatterId);
        if (found) nextBatterName = found.name;
      }

      if (!nextBatterId && !nextBatterName) {
        const msg = 'Please select or enter the incoming batsman.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Required', msg);
        return;
      }
    }

    // Resolve fielder name if applicable
    let resolvedFielderName = customFielderName.trim();
    if (!resolvedFielderName && selectedFielderId) {
      const f = bowlingSquad.find(p => p.id === selectedFielderId);
      if (f) resolvedFielderName = f.name;
    }

    setIsSubmittingDelivery(true);
    setShowWicketModal(false);

    if (outBatter?.id) {
      setDismissedBatters((prev) => [...prev, outBatter.id]);
    }

    const payload = {
      strikerId: striker?.id,
      nonStrikerId: nonStriker?.id,
      bowlerId: bowler?.id,
      runsBatter: runsOnWicket,
      runsExtras: 0,
      extraType: 'NONE',
      wicket: true,
      wicketType: wicketType,
      dismissedPlayerId: outBatter?.id,
      replacementBatterId: isTenthWicket ? null : nextBatterId,
      replacementBatterName: isTenthWicket ? null : nextBatterName,
      fielderId: selectedFielderId || null,
      fielderName: resolvedFielderName || null,
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

  // Custom Runs & Extras Submission Handler
  const handleCustomRunsSubmit = async () => {
    const runNum = parseInt(customRunsInput, 10);
    if (isNaN(runNum) || runNum < 0) {
      const msg = 'Please enter a valid non-negative number of runs.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Runs', msg);
      return;
    }

    setShowCustomModal(false);

    if (customCategory === 'normal') {
      await handleScore(runNum, 'normal');
    } else if (customCategory === 'wide') {
      await handleCustomDeliveryDirect({
        runsBatter: 0,
        runsExtras: runNum,
        extraType: 'WIDE'
      });
    } else if (customCategory === 'noball_bat') {
      await handleCustomDeliveryDirect({
        runsBatter: Math.max(0, runNum - 1),
        runsExtras: 1,
        extraType: 'NO_BALL'
      });
    } else if (customCategory === 'noball_extra') {
      await handleCustomDeliveryDirect({
        runsBatter: 0,
        runsExtras: runNum,
        extraType: 'NO_BALL'
      });
    } else if (customCategory === 'bye') {
      await handleCustomDeliveryDirect({
        runsBatter: 0,
        runsExtras: runNum,
        extraType: 'BYE'
      });
    } else if (customCategory === 'legbye') {
      await handleCustomDeliveryDirect({
        runsBatter: 0,
        runsExtras: runNum,
        extraType: 'LEG_BYE'
      });
    } else if (customCategory === 'penalty') {
      await handleCustomDeliveryDirect({
        runsBatter: 0,
        runsExtras: runNum,
        extraType: 'BYE'
      });
    }
  };

  const handleCustomDeliveryDirect = async ({ runsBatter, runsExtras, extraType }: { runsBatter: number; runsExtras: number; extraType: string }) => {
    if (isOverComplete || showBowlerModal) {
      setShowBowlerModal(true);
      return;
    }
    if (matchStatus !== 'LIVE' || isInningsBreak || isMatchEnded) return;
    if (isSubmittingDelivery) return;

    setIsSubmittingDelivery(true);

    const payload = {
      strikerId: striker?.id,
      nonStrikerId: nonStriker?.id,
      bowlerId: bowler?.id,
      runsBatter,
      runsExtras,
      extraType,
      wicket: false,
      fieldingPosition: selectedFieldPosition
    };

    try {
      const res = await ScorerApi.recordDelivery(matchId, payload);
      if (res && res.commentary) {
        setAiCommentary(res.commentary);
      }
      await loadLiveState(false);
      if (res.isOverComplete || res.data?.isOverComplete) {
        if (res.matchStatus === 'LIVE' && !res.data?.isMatchCompleted) {
          setShowBowlerModal(true);
        }
      }
    } catch (err: any) {
      console.error('Custom delivery error:', err);
      const msg = err.message || 'Error recording custom delivery.';
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

  // Unique, deduplicated available incoming batters (plain computation, no hook call after early returns)
  const seenBatterNames = new Set<string>();
  const seenBatterIds = new Set<string>();
  const strikerName = (striker?.name || '').trim().toLowerCase();
  const nonStrikerName = (nonStriker?.name || '').trim().toLowerCase();

  const rawAvailableList: any[] = [];
  (battingSquad || []).forEach((p) => {
    if (!p || !p.name) return;
    const cleanName = p.name.trim().toLowerCase();
    // Exclude current striker and non-striker
    if (p.id === striker?.id || p.id === nonStriker?.id) return;
    if (cleanName === strikerName || cleanName === nonStrikerName) return;
    // Exclude already dismissed batters
    if (dismissedBatters.includes(p.id) || dismissedBatters.includes(cleanName)) return;
    // Deduplicate: each player appears exactly once
    if (seenBatterNames.has(cleanName) || seenBatterIds.has(p.id)) return;
    seenBatterNames.add(cleanName);
    seenBatterIds.add(p.id);
    rawAvailableList.push(p);
  });

  const availableSquad = batterSearchQuery.trim()
    ? rawAvailableList.filter((p) => {
        const q = batterSearchQuery.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.role && p.role.toLowerCase().includes(q));
      })
    : rawAvailableList;

  const selectedBatterObj = rawAvailableList.find((p) => p.id === selectedNextBatterId);

  // Unique, deduplicated fielding squad (for fielder dropdown)
  const seenFielderNames = new Set<string>();
  const seenFielderIds = new Set<string>();
  const rawFielderList: any[] = [];
  (bowlingSquad || []).forEach((f) => {
    if (!f || !f.name) return;
    const cleanName = f.name.trim().toLowerCase();
    if (seenFielderNames.has(cleanName) || seenFielderIds.has(f.id)) return;
    seenFielderNames.add(cleanName);
    seenFielderIds.add(f.id);
    rawFielderList.push(f);
  });

  const filteredFielders = fielderSearchQuery.trim()
    ? rawFielderList.filter((f) => {
        const q = fielderSearchQuery.trim().toLowerCase();
        return f.name.toLowerCase().includes(q) || (f.role && f.role.toLowerCase().includes(q));
      })
    : rawFielderList;

  const selectedFielderObj = rawFielderList.find((f) => f.id === selectedFielderId);

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
              {lastDismissal ? (
                <View style={styles.lastWicketChip}>
                  <Text style={styles.lastWicketTag}>⚡ LAST WICKET (Ov {lastDismissal.ball}):</Text>
                  <Text style={styles.lastWicketText} numberOfLines={1}>
                    {lastDismissal.batterName} ({lastDismissal.dismissalText || lastDismissal.dismissalType})
                  </Text>
                </View>
              ) : null}
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

          {/* BOTTOM SECTION: CONTROLS */}
          <View style={styles.controlsSection}>
            <View style={styles.controlPanel}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>RUNS</Text>
                <TouchableOpacity
                  style={styles.customRunsBadgeBtn}
                  onPress={() => {
                    setCustomRunsInput('1');
                    setCustomCategory('normal');
                    setShowCustomModal(true);
                  }}
                >
                  <Text style={styles.customRunsBadgeText}>⚡ + Custom / Extra Runs</Text>
                </TouchableOpacity>
              </View>
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

      {/* CUSTOM RUNS & EXTRAS MODAL */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.wicketModalHeader}>
              <View style={styles.modalTopHeaderRow}>
                <Text style={styles.wicketModalTitle}>⚡ Custom Runs & Extras</Text>
                <TouchableOpacity
                  style={styles.redCloseBtn}
                  onPress={() => setShowCustomModal(false)}
                  activeOpacity={0.7}
                  accessibilityLabel="Close Custom Runs Modal"
                >
                  <Text style={styles.redCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.wicketModalSub}>
                Record any number of runs (e.g. 5 runs, overthrows, penalties, or custom extras).
              </Text>
            </View>

            <Text style={styles.selectLabel}>QUICK RUNS OR ENTER NUMBER:</Text>
            <View style={styles.customRunChipsRow}>
              {['1', '2', '3', '4', '5', '6', '7'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.customRunChip, customRunsInput === r && styles.customRunChipActive]}
                  onPress={() => setCustomRunsInput(r)}
                >
                  <Text style={[styles.customRunChipText, customRunsInput === r && styles.customRunChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Text style={styles.fieldSubLabel}>NUMBER OF RUNS:</Text>
              <TextInput
                style={styles.customNameInput}
                keyboardType="numeric"
                placeholder="e.g. 5"
                placeholderTextColor="#94a3b8"
                value={customRunsInput}
                onChangeText={(val) => setCustomRunsInput(val)}
              />
            </View>

            <Text style={styles.selectLabel}>DELIVERY CATEGORY:</Text>
            <View style={styles.categoryGrid}>
              {[
                { key: 'normal', label: 'Off Bat (Normal)', desc: 'Bat & Team' },
                { key: 'wide', label: 'Wide + Runs', desc: 'Conceded Extra' },
                { key: 'noball_bat', label: 'No Ball + Bat', desc: '1 Extra + Bat' },
                { key: 'noball_extra', label: 'No Ball + Bye', desc: 'Total Extras' },
                { key: 'bye', label: 'Byes', desc: 'Legal Extra' },
                { key: 'legbye', label: 'Leg Byes', desc: 'Legal Extra' },
                { key: 'penalty', label: 'Penalty Runs', desc: 'Team Total' }
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryOption, customCategory === cat.key && styles.categoryOptionActive]}
                  onPress={() => setCustomCategory(cat.key)}
                >
                  <Text style={[styles.categoryOptionText, customCategory === cat.key && styles.categoryOptionTextActive]}>
                    {cat.label}
                  </Text>
                  <Text style={styles.categoryOptionDesc}>{cat.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewBoxLabel}>RECORDING PREVIEW:</Text>
              <Text style={styles.previewBoxText}>
                {customRunsInput || '0'} Runs &bull; {customCategory.toUpperCase()} vs {bowler?.name || 'Bowler'}
              </Text>
            </View>

            <View style={[styles.modalActions, { marginTop: 14 }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCustomRunsSubmit}
              >
                <Text style={styles.modalConfirmText}>Record Delivery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* COMPREHENSIVE WICKET FALL & DISMISSAL MODAL */}
      <Modal
        visible={showWicketModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, maxHeight: '92%' }]}>
            <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              <View style={styles.wicketModalHeader}>
                <View style={styles.modalTopHeaderRow}>
                  <View style={styles.wicketBadgeTag}>
                    <Text style={styles.wicketBadgeTagText}>WICKET FALLEN</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.redCloseBtn}
                    onPress={() => setShowWicketModal(false)}
                    activeOpacity={0.7}
                    accessibilityLabel="Close Wicket Modal"
                  >
                    <Text style={styles.redCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.wicketModalTitle}>🏏 Dismissal Details</Text>
                <Text style={styles.wicketModalSub}>
                  Specify how the batter got out, the fielder involved, and assign the next batter.
                </Text>
              </View>

              {/* 1. OUT BATSMAN SELECTION (Striker vs Non-Striker) */}
              <Text style={styles.selectLabel}>1. WHO GOT OUT?</Text>
              <View style={styles.outBatterToggleRow}>
                <TouchableOpacity
                  style={[styles.outBatterBtn, dismissedTarget === 'striker' && styles.outBatterBtnActive]}
                  onPress={() => setDismissedTarget('striker')}
                >
                  <Text style={[styles.outBatterRole, dismissedTarget === 'striker' && styles.outBatterRoleActive]}>
                    STRIKER
                  </Text>
                  <Text style={[styles.outBatterName, dismissedTarget === 'striker' && styles.outBatterNameActive]} numberOfLines={1}>
                    * {striker ? striker.name : 'Striker'}
                  </Text>
                  <Text style={styles.outBatterStats}>
                    {striker ? `${striker.runs} (${striker.balls})` : '0 (0)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outBatterBtn, dismissedTarget === 'nonStriker' && styles.outBatterBtnActive]}
                  onPress={() => setDismissedTarget('nonStriker')}
                >
                  <Text style={[styles.outBatterRole, dismissedTarget === 'nonStriker' && styles.outBatterRoleActive]}>
                    NON-STRIKER
                  </Text>
                  <Text style={[styles.outBatterName, dismissedTarget === 'nonStriker' && styles.outBatterNameActive]} numberOfLines={1}>
                    {nonStriker ? nonStriker.name : 'Non-Striker'}
                  </Text>
                  <Text style={styles.outBatterStats}>
                    {nonStriker ? `${nonStriker.runs} (${nonStriker.balls})` : '0 (0)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 2. DISMISSAL TYPE (HOW OUT) */}
              <Text style={styles.selectLabel}>2. HOW OUT? (DISMISSAL METHOD):</Text>
              <View style={styles.dismissalGrid}>
                {[
                  { key: 'BOWLED', label: 'Bowled', desc: 'b Bowler' },
                  { key: 'CAUGHT', label: 'Caught', desc: 'c Fielder b Bowler' },
                  { key: 'CAUGHT_BEHIND', label: 'Caught Behind', desc: 'c †Keeper b Bowler' },
                  { key: 'CAUGHT_AND_BOWLED', label: 'Caught & Bowled', desc: 'c & b Bowler' },
                  { key: 'LBW', label: 'LBW', desc: 'lbw b Bowler' },
                  { key: 'RUN_OUT', label: 'Run Out', desc: 'run out (Fielder)' },
                  { key: 'STUMPED', label: 'Stumped', desc: 'st †Keeper b Bowler' },
                  { key: 'HIT_WICKET', label: 'Hit Wicket', desc: 'hit wicket b Bowler' },
                  { key: 'RETIRED_OUT', label: 'Retired Out', desc: 'retired out' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.dismissalChip, wicketType === item.key && styles.dismissalChipActive]}
                    onPress={() => {
                      setWicketType(item.key);
                    }}
                  >
                    <Text style={[styles.dismissalChipText, wicketType === item.key && styles.dismissalChipTextActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.dismissalChipSub, wicketType === item.key && styles.dismissalChipSubActive]}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. FIELDER SELECTION (If Caught, Run Out, Stumped, Caught Behind) */}
              {['CAUGHT', 'CAUGHT_BEHIND', 'RUN_OUT', 'STUMPED'].includes(wicketType) && (
                <View style={{ marginTop: 10, marginBottom: 12 }}>
                  <Text style={styles.selectLabel}>
                    3. SELECT FIELDER FROM {(matchInfo?.teamB || 'BOWLING TEAM').toUpperCase()}:
                  </Text>

                  {/* FIELDER DROPDOWN TRIGGER */}
                  <TouchableOpacity
                    style={[
                      styles.fielderDropdownTrigger,
                      isFielderDropdownOpen && styles.fielderDropdownTriggerOpen,
                      customFielderName.trim() ? styles.fielderDropdownTriggerCustom : null
                    ]}
                    onPress={() => setIsFielderDropdownOpen(!isFielderDropdownOpen)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={styles.fielderDropdownIcon}>🧤</Text>
                      <Text
                        style={[
                          styles.fielderDropdownTriggerText,
                          (selectedFielderObj || customFielderName.trim()) && styles.fielderDropdownTriggerTextSelected
                        ]}
                        numberOfLines={1}
                      >
                        {customFielderName.trim()
                          ? `Substitute: ${customFielderName.trim()}`
                          : selectedFielderObj
                          ? `${selectedFielderObj.name} (${selectedFielderObj.role || 'FIELD'})`
                          : '-- Choose Fielder from Dropdown --'}
                      </Text>
                    </View>
                    <Text style={styles.fielderDropdownArrow}>{isFielderDropdownOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {/* EXPANDABLE DROPDOWN MENU */}
                  {isFielderDropdownOpen && (
                    <View style={styles.fielderDropdownMenu}>
                      {/* Search box within dropdown */}
                      <View style={styles.dropdownSearchWrapper}>
                        <Text style={styles.dropdownSearchIcon}>🔍</Text>
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="Search fielder by name..."
                          placeholderTextColor="#94a3b8"
                          value={fielderSearchQuery}
                          onChangeText={(txt) => setFielderSearchQuery(txt)}
                          autoCapitalize="none"
                        />
                        {fielderSearchQuery.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setFielderSearchQuery('')}
                            style={styles.searchClearBtn}
                          >
                            <Text style={styles.searchClearBtnText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Dropdown Items List */}
                      <ScrollView
                        nestedScrollEnabled={true}
                        style={styles.fielderDropdownScroll}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredFielders.length === 0 ? (
                          <View style={styles.dropdownEmptyBox}>
                            <Text style={styles.dropdownEmptyText}>
                              No fielders found matching "{fielderSearchQuery}"
                            </Text>
                          </View>
                        ) : (
                          filteredFielders.map((f) => {
                            const isFielderSelected = selectedFielderId === f.id && !customFielderName.trim();
                            return (
                              <TouchableOpacity
                                key={f.id}
                                style={[styles.fielderDropdownItem, isFielderSelected && styles.fielderDropdownItemSelected]}
                                onPress={() => {
                                  setSelectedFielderId(f.id);
                                  setCustomFielderName('');
                                  setIsFielderDropdownOpen(false);
                                  setFielderSearchQuery('');
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                  <View style={[styles.radioDot, isFielderSelected && styles.radioDotSelected]} />
                                  <Text
                                    style={[styles.fielderDropdownItemName, isFielderSelected && styles.fielderDropdownItemNameSelected]}
                                    numberOfLines={1}
                                  >
                                    {f.name}
                                  </Text>
                                </View>
                                <Text style={styles.fielderDropdownItemRole}>{f.role || 'FIELD'}</Text>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* MANUAL SUBSTITUTE FIELDER INPUT */}
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      style={[
                        styles.customNameInput,
                        customFielderName.trim() ? styles.customNameInputActive : null
                      ]}
                      placeholder="✍️ Or enter substitute fielder name manually..."
                      placeholderTextColor="#94a3b8"
                      value={customFielderName}
                      onChangeText={(txt) => {
                        setCustomFielderName(txt);
                        if (txt.trim()) {
                          setSelectedFielderId('');
                        }
                      }}
                    />
                    {customFielderName.trim() ? (
                      <Text style={styles.manualConfirmedHint}>
                        ✓ Using substitute fielder: <Text style={{ fontWeight: 'bold' }}>{customFielderName.trim()}</Text>
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              {/* 4. RUNS ON WICKET BALL (Useful for Run Out) */}
              {wicketType === 'RUN_OUT' && (
                <View style={{ marginTop: 4, marginBottom: 12 }}>
                  <Text style={styles.selectLabel}>RUNS COMPLETED BEFORE RUN OUT:</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[0, 1, 2, 3].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.customRunChip, runsOnWicket === r && styles.customRunChipActive]}
                        onPress={() => setRunsOnWicket(r)}
                      >
                        <Text style={[styles.customRunChipText, runsOnWicket === r && styles.customRunChipTextActive]}>
                          {r} Run{r !== 1 ? 's' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 5. INCOMING BATTER SELECTION */}
              <View style={{ marginTop: 8, marginBottom: 12 }}>
                {wickets + 1 >= 10 ? (
                  <View style={styles.allOutBanner}>
                    <Text style={styles.allOutBannerText}>
                      ⚠️ 10th Wicket: All Out! Innings will be completed automatically.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.selectLabel}>
                      4. SELECT INCOMING BATTER FROM {(matchInfo?.teamA || 'BATTING TEAM').toUpperCase()}:
                    </Text>

                    {/* INCOMING BATTER DROPDOWN TRIGGER */}
                    <TouchableOpacity
                      style={[
                        styles.fielderDropdownTrigger,
                        isBatterDropdownOpen && styles.fielderDropdownTriggerOpen,
                        customBatterName.trim() ? styles.fielderDropdownTriggerCustom : null
                      ]}
                      onPress={() => setIsBatterDropdownOpen(!isBatterDropdownOpen)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.fielderDropdownIcon}>🏏</Text>
                        <Text
                          style={[
                            styles.fielderDropdownTriggerText,
                            (selectedBatterObj || customBatterName.trim()) && styles.fielderDropdownTriggerTextSelected
                          ]}
                          numberOfLines={1}
                        >
                          {customBatterName.trim()
                            ? `Substitute: ${customBatterName.trim()}`
                            : selectedBatterObj
                            ? `${selectedBatterObj.name} (${selectedBatterObj.role || 'BATTER'})`
                            : '-- Choose Incoming Batter from Dropdown --'}
                        </Text>
                      </View>
                      <Text style={styles.fielderDropdownArrow}>{isBatterDropdownOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {/* EXPANDABLE DROPDOWN MENU */}
                    {isBatterDropdownOpen && (
                      <View style={styles.fielderDropdownMenu}>
                        {/* Search box within dropdown */}
                        <View style={styles.dropdownSearchWrapper}>
                          <Text style={styles.dropdownSearchIcon}>🔍</Text>
                          <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search player name or role..."
                            placeholderTextColor="#94a3b8"
                            value={batterSearchQuery}
                            onChangeText={(txt) => setBatterSearchQuery(txt)}
                            autoCapitalize="none"
                          />
                          {batterSearchQuery.length > 0 && (
                            <TouchableOpacity
                              onPress={() => setBatterSearchQuery('')}
                              style={styles.searchClearBtn}
                            >
                              <Text style={styles.searchClearBtnText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Dropdown Items List */}
                        <ScrollView
                          nestedScrollEnabled={true}
                          style={styles.fielderDropdownScroll}
                          showsVerticalScrollIndicator={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {availableSquad.length === 0 ? (
                            <View style={styles.dropdownEmptyBox}>
                              <Text style={styles.dropdownEmptyText}>
                                {batterSearchQuery.trim()
                                  ? `No squad players found matching "${batterSearchQuery}"`
                                  : 'No remaining squad players in MongoDB. Enter batsman name below.'}
                              </Text>
                            </View>
                          ) : (
                            availableSquad.map((player) => {
                              const isSelected = selectedNextBatterId === player.id && !customBatterName.trim();
                              return (
                                <TouchableOpacity
                                  key={player.id}
                                  style={[styles.fielderDropdownItem, isSelected && styles.fielderDropdownItemSelected]}
                                  onPress={() => {
                                    setSelectedNextBatterId(player.id);
                                    setCustomBatterName('');
                                    setIsBatterDropdownOpen(false);
                                    setBatterSearchQuery('');
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
                                    <Text
                                      style={[styles.fielderDropdownItemName, isSelected && styles.fielderDropdownItemNameSelected]}
                                      numberOfLines={1}
                                    >
                                      {player.name}
                                    </Text>
                                  </View>
                                  <Text style={styles.fielderDropdownItemRole}>{player.role || 'BATTER'}</Text>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </ScrollView>
                      </View>
                    )}

                    {/* MANUAL BATTER ENTRY AT THE BOTTOM */}
                    <View style={{ marginTop: 8 }}>
                      <TextInput
                        style={[
                          styles.customNameInput,
                          customBatterName.trim() ? styles.customNameInputActive : null
                        ]}
                        placeholder="✍️ Or enter batsman name manually (e.g. Guest / Substitute)..."
                        placeholderTextColor="#94a3b8"
                        value={customBatterName}
                        onChangeText={(txt) => {
                          setCustomBatterName(txt);
                          if (txt.trim()) {
                            setSelectedNextBatterId('');
                            setIsBatterDropdownOpen(false);
                          }
                        }}
                      />
                      {customBatterName.trim() ? (
                        <Text style={styles.manualConfirmedHint}>
                          ✓ Using manual batsman: <Text style={{ fontWeight: 'bold' }}>{customBatterName.trim()}</Text>
                        </Text>
                      ) : null}
                    </View>
                  </>
                )}
              </View>

              {/* 6. REAL-TIME DISMISSAL PREVIEW BOX */}
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxLabel}>SCORECARD DISMISSAL PREVIEW:</Text>
                <Text style={styles.previewBoxText}>
                  {dismissedTarget === 'striker' ? striker?.name || 'Striker' : nonStriker?.name || 'Non-Striker'}{' '}
                  {wicketType === 'BOWLED' && `b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'CAUGHT' && `c ${customFielderName.trim() || bowlingSquad.find(f => f.id === selectedFielderId)?.name || 'Fielder'} b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'CAUGHT_BEHIND' && `c †${customFielderName.trim() || bowlingSquad.find(f => f.id === selectedFielderId)?.name || 'Keeper'} b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'CAUGHT_AND_BOWLED' && `c & b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'LBW' && `lbw b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'RUN_OUT' && `run out (${customFielderName.trim() || bowlingSquad.find(f => f.id === selectedFielderId)?.name || 'Fielder'})`}
                  {wicketType === 'STUMPED' && `st †${customFielderName.trim() || bowlingSquad.find(f => f.id === selectedFielderId)?.name || 'Keeper'} b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'HIT_WICKET' && `hit wicket b ${bowler?.name || 'Bowler'}`}
                  {wicketType === 'RETIRED_OUT' && 'retired out'}
                </Text>
                {wickets + 1 < 10 && (
                  <Text style={styles.previewNextBatterText}>
                    Incoming Batter: <Text style={{ fontWeight: 'bold', color: '#b45309' }}>
                      {customBatterName.trim() || selectedBatterObj?.name || 'None selected'}
                    </Text>
                  </Text>
                )}
              </View>

              {/* ACTIONS */}
              <View style={[styles.modalActions, { marginTop: 14 }]}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowWicketModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: '#dc2626' }]}
                  onPress={confirmNextBatter}
                >
                  <Text style={styles.modalConfirmText}>Confirm & Record Wicket</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    },
    customNameInputActive: {
      borderColor: '#b45309',
      backgroundColor: '#fffbeb'
    },
    searchBarWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 8
    },
    searchBarIcon: {
      fontSize: 13,
      marginRight: 6
    },
    searchBarInput: {
      flex: 1,
      fontSize: 13,
      color: '#1e293b',
      padding: 0
    },
    searchClearBtn: {
      paddingHorizontal: 6,
      paddingVertical: 2
    },
    searchClearBtnText: {
      fontSize: 12,
      color: '#64748b',
      fontWeight: 'bold'
    },
    squadScrollView: {
      maxHeight: 180,
      marginBottom: 6
    },
    emptySquadBox: {
      backgroundColor: '#f8fafc',
      padding: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      marginBottom: 8,
      alignItems: 'center'
    },
    emptySquadText: {
      fontSize: 12,
      color: '#64748b',
      textAlign: 'center',
      lineHeight: 18
    },
    manualEntryWrapper: {
      marginTop: 4,
      marginBottom: 6
    },
    manualDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8
    },
    manualDividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#e2e8f0'
    },
    manualDividerText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#94a3b8',
      marginHorizontal: 8,
      letterSpacing: 0.5
    },
    manualConfirmedHint: {
      fontSize: 11,
      color: '#b45309',
      marginTop: 4,
      marginLeft: 2
    },
    previewNextBatterText: {
      fontSize: 12,
      color: '#475569',
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      paddingTop: 4
    },
    // Enhanced Scorer Page Styles
    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
    customRunsBadgeBtn: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6
    },
    customRunsBadgeText: {
      color: '#b45309',
      fontSize: 11,
      fontWeight: 'bold'
    },
    scoreBtnFive: {
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d'
    },
    scoreBtnTextFive: {
      color: '#b45309'
    },
    lastWicketChip: {
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#fca5a5',
      borderRadius: 6,
      padding: 6,
      marginTop: 8
    },
    lastWicketTag: {
      fontSize: 9,
      fontWeight: '800',
      color: '#b91c1c',
      letterSpacing: 0.5
    },
    lastWicketText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#991b1b',
      marginTop: 2
    },
    customRunChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8
    },
    customRunChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#cbd5e1'
    },
    customRunChipActive: {
      backgroundColor: '#b45309',
      borderColor: '#92400e'
    },
    customRunChipText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#334155'
    },
    customRunChipTextActive: {
      color: '#ffffff'
    },
    fieldSubLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748b',
      marginBottom: 4
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10
    },
    categoryOption: {
      width: '48%',
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
      padding: 8
    },
    categoryOptionActive: {
      backgroundColor: '#fffbeb',
      borderColor: '#b45309'
    },
    categoryOptionText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#1e293b'
    },
    categoryOptionTextActive: {
      color: '#b45309'
    },
    categoryOptionDesc: {
      fontSize: 10,
      color: '#64748b',
      marginTop: 2
    },
    previewBox: {
      backgroundColor: '#f8fafc',
      borderRadius: 6,
      padding: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      marginVertical: 8
    },
    previewBoxLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#64748b',
      letterSpacing: 0.5
    },
    previewBoxText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#0f172a',
      marginTop: 2
    },
    modalTopHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    redCloseBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#fee2e2',
      borderWidth: 1.5,
      borderColor: '#ef4444',
      alignItems: 'center',
      justifyContent: 'center'
    },
    redCloseBtnText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#dc2626',
      lineHeight: 18,
      textAlign: 'center'
    },
    wicketBadgeTag: {
      alignSelf: 'flex-start',
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#fca5a5',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4
    },
    wicketBadgeTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#dc2626',
      letterSpacing: 0.5
    },
    outBatterToggleRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12
    },
    outBatterBtn: {
      flex: 1,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      padding: 10
    },
    outBatterBtnActive: {
      backgroundColor: '#fee2e2',
      borderColor: '#dc2626'
    },
    outBatterRole: {
      fontSize: 10,
      fontWeight: '800',
      color: '#64748b',
      letterSpacing: 0.5
    },
    outBatterRoleActive: {
      color: '#dc2626'
    },
    outBatterName: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#1e293b',
      marginTop: 2
    },
    outBatterNameActive: {
      color: '#7f1d1d'
    },
    outBatterStats: {
      fontSize: 11,
      color: '#64748b',
      marginTop: 2
    },
    dismissalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12
    },
    dismissalChip: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 6,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      minWidth: '31%'
    },
    dismissalChipActive: {
      backgroundColor: '#fee2e2',
      borderColor: '#dc2626'
    },
    dismissalChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#1e293b'
    },
    dismissalChipTextActive: {
      color: '#dc2626'
    },
    dismissalChipSub: {
      fontSize: 9,
      color: '#64748b',
      marginTop: 2
    },
    dismissalChipSubActive: {
      color: '#991b1b'
    },
    fielderDropdownTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#f8fafc',
      borderWidth: 1.5,
      borderColor: '#cbd5e1',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    fielderDropdownTriggerOpen: {
      borderColor: '#b45309',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    },
    fielderDropdownTriggerCustom: {
      backgroundColor: '#fffbeb',
      borderColor: '#b45309'
    },
    fielderDropdownIcon: {
      fontSize: 15,
      marginRight: 8
    },
    fielderDropdownTriggerText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#64748b',
      flex: 1
    },
    fielderDropdownTriggerTextSelected: {
      color: '#1e293b',
      fontWeight: 'bold'
    },
    fielderDropdownArrow: {
      fontSize: 12,
      color: '#64748b',
      fontWeight: 'bold',
      marginLeft: 8
    },
    fielderDropdownMenu: {
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderTopWidth: 0,
      borderColor: '#b45309',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      padding: 8
    },
    dropdownSearchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginBottom: 6
    },
    dropdownSearchIcon: {
      fontSize: 12,
      marginRight: 6
    },
    dropdownSearchInput: {
      flex: 1,
      fontSize: 12,
      color: '#1e293b',
      padding: 0
    },
    fielderDropdownScroll: {
      maxHeight: 160
    },
    fielderDropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 6,
      marginBottom: 4,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0'
    },
    fielderDropdownItemSelected: {
      backgroundColor: '#fffbeb',
      borderColor: '#b45309'
    },
    fielderDropdownItemName: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1e293b'
    },
    fielderDropdownItemNameSelected: {
      fontWeight: 'bold',
      color: '#b45309'
    },
    fielderDropdownItemRole: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748b',
      backgroundColor: '#e2e8f0',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    dropdownEmptyBox: {
      padding: 12,
      alignItems: 'center'
    },
    dropdownEmptyText: {
      fontSize: 12,
      color: '#94a3b8',
      textAlign: 'center'
    },
    allOutBanner: {
      backgroundColor: '#fef2f2',
      padding: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#fca5a5'
    },
    allOutBannerText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#b91c1c'
    }
  });
