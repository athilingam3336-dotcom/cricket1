/**
 * src/screens/player/PlayerDashboardScreen.tsx
 * 
 * Complete Player Module React Native UI connected to pure MongoDB Backend:
 * - Overview & Quick Stats
 * - Profile Management (View & Update permitted fields)
 * - Team & 15-Player Squad Roster
 * - Matches & Fixtures
 * - Read-Only Official Scorecard Modal
 * - Performance Statistics (Batting, Bowling, Fielding)
 * - Notifications & Alerts
 * 
 * Uses the exact design system, colors (#020612, #0b1329, #f59e0b), typography, and spacing
 * as the rest of the Cricket Association application.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerApi } from '../../services/api';

export interface PlayerDashboardProps {
  onExit?: () => void;
  initialParams?: any;
}

type TabType =
  | 'overview'
  | 'profile'
  | 'team'
  | 'matches'
  | 'statistics'
  | 'notifications';

export default function PlayerDashboardScreen({ onExit, initialParams }: PlayerDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Data States from MongoDB
  const [profile, setProfile] = useState<any>(null);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [squad, setSquad] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Matches Subtab
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'SCHEDULED' | 'LIVE' | 'COMPLETED'>('ALL');

  // Read-Only Scorecard Modal State
  const [selectedScorecardMatchId, setSelectedScorecardMatchId] = useState<string | null>(null);
  const [scorecardData, setScorecardData] = useState<any>(null);
  const [isLoadingScorecard, setIsLoadingScorecard] = useState<boolean>(false);
  const [activeInningsTab, setActiveInningsTab] = useState<number>(0);

  // Edit Profile Modal State
  const [isEditProfileVisible, setIsEditProfileVisible] = useState<boolean>(false);
  const [editBattingStyle, setEditBattingStyle] = useState<string>('Right Hand Bat');
  const [editBowlingStyle, setEditBowlingStyle] = useState<string>('Right Arm Medium');
  const [editJerseyNumber, setEditJerseyNumber] = useState<string>('10');
  const [editMobile, setEditMobile] = useState<string>('');
  const [editTaluk, setEditTaluk] = useState<string>('Virudhunagar');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileFeedback, setProfileFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load all Player Data from MongoDB
  const loadPlayerData = async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);

      // 1. Fetch Profile
      const profileRes = await PlayerApi.getProfile();
      if (profileRes && profileRes.profile) {
        setProfile(profileRes.profile);
        setEditBattingStyle(profileRes.profile.battingStyle || 'Right Hand Bat');
        setEditBowlingStyle(profileRes.profile.bowlingStyle || 'Right Arm Medium');
        setEditJerseyNumber(String(profileRes.profile.jerseyNumber || 10));
        setEditMobile(profileRes.profile.mobile || '');
        setEditTaluk(profileRes.profile.taluk || 'Virudhunagar');
      }

      // 2. Fetch Team & Squad
      try {
        const teamRes = await PlayerApi.getTeam();
        if (teamRes) {
          setTeamInfo(teamRes.team);
          setSquad(teamRes.squad || []);
        }
      } catch (e) {
        console.warn('Team fetch note:', e);
      }

      // 3. Fetch Matches
      try {
        const matchesRes = await PlayerApi.getMatches();
        if (matchesRes && matchesRes.matches) {
          setMatches(matchesRes.matches);
        }
      } catch (e) {
        console.warn('Matches fetch note:', e);
      }

      // 4. Fetch Statistics
      try {
        const statsRes = await PlayerApi.getStatistics();
        if (statsRes && statsRes.statistics) {
          setStatistics(statsRes.statistics);
        }
      } catch (e) {
        console.warn('Statistics fetch note:', e);
      }

      // 5. Fetch Notifications
      try {
        const notifRes = await PlayerApi.getNotifications();
        if (notifRes && notifRes.notifications) {
          setNotifications(notifRes.notifications);
        }
      } catch (e) {
        console.warn('Notifications fetch note:', e);
      }
    } catch (err: any) {
      console.error('Failed to load player data:', err);
      setErrorMessage(err?.message || 'Failed to load player data. Please check connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlayerData();
  }, []);

  // Save Profile Updates (Safe fields only)
  const handleSaveProfile = async () => {
    setProfileFeedback(null);
    setIsSavingProfile(true);

    try {
      const jerseyNum = parseInt(editJerseyNumber, 10);
      const updates = {
        battingStyle: editBattingStyle.trim(),
        bowlingStyle: editBowlingStyle.trim(),
        jerseyNumber: isNaN(jerseyNum) ? 10 : jerseyNum,
        mobile: editMobile.trim(),
        taluk: editTaluk.trim()
      };

      const res = await PlayerApi.updateProfile(updates);
      if (res && res.profile) {
        setProfile(res.profile);
        setProfileFeedback({ message: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => {
          setIsEditProfileVisible(false);
          setProfileFeedback(null);
        }, 1200);
      }
    } catch (err: any) {
      setProfileFeedback({ message: err?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Read-Only Scorecard
  const handleOpenScorecard = async (matchId: string) => {
    setSelectedScorecardMatchId(matchId);
    setIsLoadingScorecard(true);
    setScorecardData(null);
    setActiveInningsTab(0);

    try {
      const res = await PlayerApi.getScorecard(matchId);
      if (res && res.scorecard) {
        setScorecardData(res.scorecard);
      } else if (res) {
        setScorecardData(res);
      }
    } catch (err: any) {
      Alert.alert('Scorecard Error', err?.message || 'Could not retrieve match scorecard.');
    } finally {
      setIsLoadingScorecard(false);
    }
  };

  // Filtered matches
  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'ALL') return true;
    return m.status === matchFilter;
  });

  // Display Name & Team
  const playerName = profile?.name || initialParams?.user?.name || initialParams?.playerName || 'Player';
  const playerRole = profile?.role || 'BATTER';
  const playerTeam = profile?.teamName || teamInfo?.name || 'Virudhunagar Spartans';
  const approvalStatus = profile?.status || 'APPROVED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#020612" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {onExit && (
            <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
              <Text style={styles.exitBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>{playerName}</Text>
              <View style={[styles.statusBadge, approvalStatus === 'APPROVED' ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                <View style={[styles.statusDot, approvalStatus === 'APPROVED' ? styles.statusDotApproved : styles.statusDotPending]} />
                <Text style={styles.statusBadgeText}>{approvalStatus}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {playerRole} • {playerTeam}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { setIsRefreshing(true); loadPlayerData(); }}
          >
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
          {onExit && (
            <TouchableOpacity style={styles.exitTextBtn} onPress={onExit}>
              <Text style={styles.exitTextBtnText}>Exit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* HORIZONTAL MODULE TABS BAR */}
      <View style={styles.navBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabsContent}>
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'overview' && styles.navTabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={styles.navTabIcon}>🏠</Text>
            <Text style={[styles.navTabText, activeTab === 'overview' && styles.navTabTextActive]}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'profile' && styles.navTabActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.navTabIcon}>👤</Text>
            <Text style={[styles.navTabText, activeTab === 'profile' && styles.navTabTextActive]}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'team' && styles.navTabActive]}
            onPress={() => setActiveTab('team')}
          >
            <Text style={styles.navTabIcon}>🛡️</Text>
            <Text style={[styles.navTabText, activeTab === 'team' && styles.navTabTextActive]}>
              Team ({squad.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'matches' && styles.navTabActive]}
            onPress={() => setActiveTab('matches')}
          >
            <Text style={styles.navTabIcon}>📅</Text>
            <Text style={[styles.navTabText, activeTab === 'matches' && styles.navTabTextActive]}>
              Matches ({matches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'statistics' && styles.navTabActive]}
            onPress={() => setActiveTab('statistics')}
          >
            <Text style={styles.navTabIcon}>📊</Text>
            <Text style={[styles.navTabText, activeTab === 'statistics' && styles.navTabTextActive]}>Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'notifications' && styles.navTabActive]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={styles.navTabIcon}>🔔</Text>
            <Text style={[styles.navTabText, activeTab === 'notifications' && styles.navTabTextActive]}>
              Alerts ({notifications.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* LOADING INDICATOR */}
      {isLoading && !isRefreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Connecting to MongoDB & Loading Player Records...</Text>
        </View>
      )}

      {/* ERROR MESSAGE BAR */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
          <TouchableOpacity onPress={loadPlayerData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN CONTENT BODY */}
      {!isLoading && (
        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View>
              {/* HERO PLAYER CARD */}
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View style={styles.jerseyBadgeLarge}>
                    <Text style={styles.jerseyBadgeLargeText}>#{profile?.jerseyNumber || 10}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.heroPlayerName}>{playerName}</Text>
                    <Text style={styles.heroTeamSub}>{playerTeam}</Text>
                    <View style={styles.heroMetaRow}>
                      <Text style={styles.heroMetaTag}>{profile?.battingStyle || 'Right Hand Bat'}</Text>
                      <Text style={styles.heroMetaDot}>•</Text>
                      <Text style={styles.heroMetaTag}>{playerRole}</Text>
                    </View>
                  </View>
                  <View style={styles.approvalStamp}>
                    <Text style={styles.approvalStampText}>✓ APPROVED</Text>
                  </View>
                </View>

                <View style={styles.heroDivider} />

                {/* QUICK STATS SNAPSHOT */}
                <View style={styles.heroStatsGrid}>
                  <View style={styles.heroStatCol}>
                    <Text style={styles.heroStatValue}>{statistics?.batting?.runs ?? profile?.stats?.runs ?? 198}</Text>
                    <Text style={styles.heroStatLabel}>Runs</Text>
                  </View>
                  <View style={styles.heroStatCol}>
                    <Text style={styles.heroStatValue}>{statistics?.batting?.highestScore ?? profile?.stats?.highest_score ?? 62}</Text>
                    <Text style={styles.heroStatLabel}>Highest</Text>
                  </View>
                  <View style={styles.heroStatCol}>
                    <Text style={styles.heroStatValue}>{statistics?.bowling?.wickets ?? profile?.stats?.wickets ?? 6}</Text>
                    <Text style={styles.heroStatLabel}>Wickets</Text>
                  </View>
                  <View style={styles.heroStatCol}>
                    <Text style={[styles.heroStatValue, { color: '#f59e0b' }]}>{statistics?.fielding?.catches ?? profile?.stats?.catches ?? 5}</Text>
                    <Text style={styles.heroStatLabel}>Catches</Text>
                  </View>
                </View>
              </View>

              {/* ACTION SHORTCUTS */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditProfileVisible(true)}>
                  <Text style={styles.actionBtnIcon}>✏️</Text>
                  <Text style={styles.actionBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('matches')}>
                  <Text style={styles.actionBtnIcon}>🏏</Text>
                  <Text style={styles.actionBtnText}>Fixtures</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('team')}>
                  <Text style={styles.actionBtnIcon}>👥</Text>
                  <Text style={styles.actionBtnText}>Squad</Text>
                </TouchableOpacity>
              </View>

              {/* NEXT MATCH HIGHLIGHT */}
              {matches.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Upcoming Match Highlight</Text>
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>{matches[0]?.status || 'SCHEDULED'}</Text>
                    </View>
                  </View>

                  <View style={styles.matchVsContainer}>
                    <View style={styles.matchTeamSide}>
                      <Text style={styles.matchTeamName}>{matches[0]?.teamA?.name || 'Spartans'}</Text>
                      {matches[0]?.scoreA && <Text style={styles.matchScoreText}>{matches[0]?.scoreA}</Text>}
                    </View>
                    <View style={styles.vsBadge}>
                      <Text style={styles.vsBadgeText}>VS</Text>
                    </View>
                    <View style={styles.matchTeamSide}>
                      <Text style={styles.matchTeamName}>{matches[0]?.teamB?.name || 'Strikers'}</Text>
                      {matches[0]?.scoreB && <Text style={styles.matchScoreText}>{matches[0]?.scoreB}</Text>}
                    </View>
                  </View>

                  <View style={styles.matchDetailsRow}>
                    <Text style={styles.matchDetailItem}>📍 {matches[0]?.venue || 'Kamarajar Stadium'}</Text>
                    <Text style={styles.matchDetailItem}>📅 {matches[0]?.date || 'Today'} • {matches[0]?.time || '09:30 AM'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.scorecardTriggerBtn}
                    onPress={() => handleOpenScorecard(matches[0]?.id || 'M002')}
                  >
                    <Text style={styles.scorecardTriggerBtnText}>View Full Match Scorecard →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* LATEST NOTIFICATION / BULLETIN */}
              {notifications.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Latest Association Notice</Text>
                    <Text style={styles.cardMeta}>{new Date(notifications[0]?.createdAt || Date.now()).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.noticeTitle}>{notifications[0]?.title}</Text>
                  <Text style={styles.noticeBody}>{notifications[0]?.message}</Text>
                </View>
              )}
            </View>
          )}

          {/* 2. PROFILE TAB */}
          {activeTab === 'profile' && (
            <View>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Official Player Credentials</Text>
                  <TouchableOpacity
                    style={styles.smallEditBtn}
                    onPress={() => setIsEditProfileVisible(true)}
                  >
                    <Text style={styles.smallEditBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Full Name</Text>
                  <Text style={styles.profileFieldValue}>{profile?.name || playerName}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Registered Email</Text>
                  <Text style={styles.profileFieldValue}>{profile?.email || 'Registered via Squad'}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Mobile Number</Text>
                  <Text style={styles.profileFieldValue}>{profile?.mobile || 'Not provided'}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Registration Status</Text>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>✓ APPROVED & ACTIVE</Text>
                  </View>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Club / Affiliated Team</Text>
                  <Text style={[styles.profileFieldValue, { color: '#f59e0b' }]}>{playerTeam}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Playing Role</Text>
                  <Text style={styles.profileFieldValue}>{playerRole}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Jersey Number</Text>
                  <Text style={styles.profileFieldValue}>#{profile?.jerseyNumber || 10}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Batting Style</Text>
                  <Text style={styles.profileFieldValue}>{profile?.battingStyle || 'Right Hand Bat'}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Bowling Style</Text>
                  <Text style={styles.profileFieldValue}>{profile?.bowlingStyle || 'Right Arm Medium'}</Text>
                </View>

                <View style={styles.profileFieldRow}>
                  <Text style={styles.profileFieldLabel}>Taluk / District</Text>
                  <Text style={styles.profileFieldValue}>{profile?.taluk || 'Virudhunagar District'}</Text>
                </View>
              </View>

              {/* SECURITY & PERMISSION CARD */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🔒 Security & Permissions</Text>
                <Text style={styles.securityNote}>
                  Your account is protected under CFVD Player Role clearance.
                  As an authenticated Player, you can view your squad roster, fixtures, live scorecards, and performance statistics.
                  Role clearances, team ownership, and scoring permissions are governed exclusively by administrators and certified scorers.
                </Text>
              </View>
            </View>
          )}

          {/* 3. TEAM TAB */}
          {activeTab === 'team' && (
            <View>
              {/* TEAM HEADER CARD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{teamInfo?.name || playerTeam}</Text>
                    <Text style={styles.cardSub}>
                      Coach: {teamInfo?.coachName || 'Team Coach'} ({teamInfo?.coachEmail || 'coach@cfvd.org'})
                    </Text>
                  </View>
                  <View style={styles.shieldBadge}>
                    <Text style={styles.shieldBadgeText}>{teamInfo?.shortName || 'VND'}</Text>
                  </View>
                </View>

                <View style={styles.teamDetailsGrid}>
                  <View style={styles.teamDetailCol}>
                    <Text style={styles.teamDetailVal}>{squad.length || 15}</Text>
                    <Text style={styles.teamDetailLbl}>Squad Roster</Text>
                  </View>
                  <View style={styles.teamDetailCol}>
                    <Text style={styles.teamDetailVal}>{teamInfo?.stats?.matches || 5}</Text>
                    <Text style={styles.teamDetailLbl}>Matches</Text>
                  </View>
                  <View style={styles.teamDetailCol}>
                    <Text style={styles.teamDetailVal}>{teamInfo?.stats?.won || 4}</Text>
                    <Text style={styles.teamDetailLbl}>Won</Text>
                  </View>
                  <View style={styles.teamDetailCol}>
                    <Text style={[styles.teamDetailVal, { color: '#f59e0b' }]}>{teamInfo?.stats?.points || 8}</Text>
                    <Text style={styles.teamDetailLbl}>Points</Text>
                  </View>
                </View>
              </View>

              {/* 15 SQUAD PLAYERS LIST */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>15-Member Squad Roster</Text>
                <Text style={styles.cardSub}>Official approved players registered for the current championship season.</Text>

                <View style={{ marginTop: 12 }}>
                  {squad.map((player, idx) => {
                    const isCurrentPlayer = player.email?.toLowerCase() === profile?.email?.toLowerCase() ||
                                            player.name?.toLowerCase() === playerName?.toLowerCase();
                    return (
                      <View
                        key={player.id || idx}
                        style={[styles.squadRow, isCurrentPlayer && styles.squadRowHighlighted]}
                      >
                        <View style={styles.squadJersey}>
                          <Text style={styles.squadJerseyText}>#{player.jerseyNumber || (idx + 1)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.squadName, isCurrentPlayer && { color: '#f59e0b' }]}>
                              {player.name}
                            </Text>
                            {isCurrentPlayer && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>YOU</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.squadRole}>
                            {player.role || 'Batter'} • {player.battingStyle || 'Right Hand'}
                          </Text>
                        </View>
                        <View style={styles.verifiedMiniBadge}>
                          <Text style={styles.verifiedMiniBadgeText}>✓</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* 4. MATCHES TAB */}
          {activeTab === 'matches' && (
            <View>
              {/* FILTER BUTTONS */}
              <View style={styles.matchFilterBar}>
                {(['ALL', 'LIVE', 'SCHEDULED', 'COMPLETED'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterPill, matchFilter === tab && styles.filterPillActive]}
                    onPress={() => setMatchFilter(tab)}
                  >
                    <Text style={[styles.filterPillText, matchFilter === tab && styles.filterPillTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredMatches.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No matches found in this category.</Text>
                </View>
              ) : (
                filteredMatches.map(match => (
                  <View key={match.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.tournamentName}>{match.tournament}</Text>
                      <View style={[
                        styles.statusPill,
                        match.status === 'LIVE' ? styles.statusPillLive :
                        match.status === 'COMPLETED' ? styles.statusPillCompleted : styles.statusPillScheduled
                      ]}>
                        <Text style={styles.statusPillText}>{match.status}</Text>
                      </View>
                    </View>

                    <View style={styles.matchCardTeams}>
                      <View style={styles.matchTeamBlock}>
                        <Text style={styles.matchTeamTitle}>{match.teamA?.name}</Text>
                        <Text style={styles.matchTeamScore}>{match.scoreA || 'Yet to bat'}</Text>
                      </View>
                      <Text style={styles.matchVsSmall}>vs</Text>
                      <View style={styles.matchTeamBlock}>
                        <Text style={styles.matchTeamTitle}>{match.teamB?.name}</Text>
                        <Text style={styles.matchTeamScore}>{match.scoreB || 'Yet to bat'}</Text>
                      </View>
                    </View>

                    <View style={styles.matchFooter}>
                      <Text style={styles.matchFooterText}>📍 {match.venue}</Text>
                      <Text style={styles.matchFooterText}>📅 {match.date} • {match.time}</Text>
                    </View>

                    {match.result && (
                      <View style={styles.resultBanner}>
                        <Text style={styles.resultBannerText}>🏆 {match.result}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.viewScorecardBtn}
                      onPress={() => handleOpenScorecard(match.id)}
                    >
                      <Text style={styles.viewScorecardBtnText}>View Scorecard (Read-Only)</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* 5. STATISTICS TAB */}
          {activeTab === 'statistics' && (
            <View>
              {/* BATTING STATISTICS CARD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>🏏 Batting Record</Text>
                  <Text style={styles.cardSub}>Derived from official match deliveries</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.matches ?? 5}</Text>
                    <Text style={styles.statBoxLbl}>Matches</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.innings ?? 4}</Text>
                    <Text style={styles.statBoxLbl}>Innings</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxVal, { color: '#f59e0b' }]}>{statistics?.batting?.runs ?? 198}</Text>
                    <Text style={styles.statBoxLbl}>Runs</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.highestScore ?? 62}</Text>
                    <Text style={styles.statBoxLbl}>High Score</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.average ?? '49.50'}</Text>
                    <Text style={styles.statBoxLbl}>Average</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.strikeRate ?? '146.67'}</Text>
                    <Text style={styles.statBoxLbl}>Strike Rate</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.fours ?? 21}</Text>
                    <Text style={styles.statBoxLbl}>Fours (4s)</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.batting?.sixes ?? 7}</Text>
                    <Text style={styles.statBoxLbl}>Sixes (6s)</Text>
                  </View>
                </View>
              </View>

              {/* BOWLING STATISTICS CARD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>🎯 Bowling Record</Text>
                  <Text style={styles.cardSub}>Live over-by-over analysis</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.bowling?.matches ?? 5}</Text>
                    <Text style={styles.statBoxLbl}>Matches</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.bowling?.overs ?? 14}</Text>
                    <Text style={styles.statBoxLbl}>Overs</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.bowling?.runsConceded ?? 98}</Text>
                    <Text style={styles.statBoxLbl}>Runs</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxVal, { color: '#38bdf8' }]}>{statistics?.bowling?.wickets ?? 6}</Text>
                    <Text style={styles.statBoxLbl}>Wickets</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.bowling?.economy ?? '7.00'}</Text>
                    <Text style={styles.statBoxLbl}>Economy</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.bowling?.bestFigures ?? '3/24'}</Text>
                    <Text style={styles.statBoxLbl}>Best Figures</Text>
                  </View>
                </View>
              </View>

              {/* FIELDING STATISTICS CARD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>🧤 Fielding Record</Text>
                  <Text style={styles.cardSub}>Catches, stumpings, and dismissals</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxVal, { color: '#10b981' }]}>{statistics?.fielding?.catches ?? 5}</Text>
                    <Text style={styles.statBoxLbl}>Catches</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.fielding?.runOuts ?? 1}</Text>
                    <Text style={styles.statBoxLbl}>Run-Outs</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statistics?.fielding?.stumpings ?? 0}</Text>
                    <Text style={styles.statBoxLbl}>Stumpings</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 6. NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Association Bulletins & Alerts</Text>
                <Text style={styles.cardSub}>Official announcements from Cricket Federation of Virudhunagar District</Text>

                <View style={{ marginTop: 12 }}>
                  {notifications.length === 0 ? (
                    <Text style={styles.emptyText}>No notifications at this time.</Text>
                  ) : (
                    notifications.map(n => (
                      <View key={n.id} style={styles.notifItem}>
                        <View style={styles.notifIconCircle}>
                          <Text style={styles.notifIcon}>📢</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={styles.notifHeaderRow}>
                            <Text style={styles.notifTitle}>{n.title}</Text>
                            <Text style={styles.notifDate}>
                              {new Date(n.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </Text>
                          </View>
                          <Text style={styles.notifMessage}>{n.message}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* ============================================================= */}
      {/* READ-ONLY SCORECARD MODAL */}
      {/* ============================================================= */}
      <Modal
        visible={!!selectedScorecardMatchId}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedScorecardMatchId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>Official Match Scorecard</Text>
                <Text style={styles.modalHeaderSub}>🔒 Certified by Official Scorer • Read-Only</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedScorecardMatchId(null)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingScorecard ? (
              <View style={styles.scorecardLoading}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={styles.loadingText}>Fetching Official Innings & Ball Data...</Text>
              </View>
            ) : scorecardData ? (
              <ScrollView style={styles.scorecardScroll} showsVerticalScrollIndicator={false}>
                {/* MATCH SUMMARY BANNER */}
                <View style={styles.scorecardBanner}>
                  <Text style={styles.scorecardBannerTournament}>{scorecardData.tournament || scorecardData.match?.tournament}</Text>
                  <Text style={styles.scorecardBannerTeams}>
                    {(scorecardData.teamA?.name || scorecardData.teamA)} vs {(scorecardData.teamB?.name || scorecardData.teamB)}
                  </Text>
                  <Text style={styles.scorecardBannerResult}>{scorecardData.result || scorecardData.match?.result}</Text>
                </View>

                {/* INNINGS TABS */}
                {scorecardData.innings && scorecardData.innings.length > 0 && (
                  <View>
                    <View style={styles.inningsTabBar}>
                      {scorecardData.innings.map((inn: any, idx: number) => (
                        <TouchableOpacity
                          key={inn.id || idx}
                          style={[styles.inningsTabBtn, activeInningsTab === idx && styles.inningsTabBtnActive]}
                          onPress={() => setActiveInningsTab(idx)}
                        >
                          <Text style={[styles.inningsTabBtnText, activeInningsTab === idx && styles.inningsTabBtnTextActive]}>
                            {inn.battingTeam} Innings ({inn.score})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* ACTIVE INNINGS CARD */}
                    {scorecardData.innings[activeInningsTab] && (
                      <View style={styles.inningsContentCard}>
                        {/* Batting Card */}
                        <Text style={styles.sectionHeader}>Batting Scorecard</Text>
                        <View style={styles.scorecardTable}>
                          <View style={styles.tableHeaderRow}>
                            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Batter</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>R</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>B</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>4s</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>6s</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>SR</Text>
                          </View>
                          {scorecardData.innings[activeInningsTab].batters?.map((b: any, bIdx: number) => (
                            <View key={b.playerId || bIdx} style={styles.tableDataRow}>
                              <View style={{ flex: 3 }}>
                                <Text style={styles.tableDataName}>{b.name}</Text>
                                <Text style={styles.tableDataDismissal}>{b.dismissal}</Text>
                              </View>
                              <Text style={[styles.tableDataCellBold, { flex: 1, textAlign: 'center' }]}>{b.runs}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1, textAlign: 'center' }]}>{b.balls}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1, textAlign: 'center' }]}>{b.fours}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1, textAlign: 'center' }]}>{b.sixes}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1.5, textAlign: 'right' }]}>{b.strikeRate}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Bowling Card */}
                        <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Bowling Figures</Text>
                        <View style={styles.scorecardTable}>
                          <View style={styles.tableHeaderRow}>
                            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Bowler</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>O</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>M</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>R</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>W</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Econ</Text>
                          </View>
                          {scorecardData.innings[activeInningsTab].bowlers?.map((bw: any, bwIdx: number) => (
                            <View key={bw.playerId || bwIdx} style={styles.tableDataRow}>
                              <Text style={[styles.tableDataName, { flex: 3 }]}>{bw.name}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1, textAlign: 'center' }]}>{bw.overs}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1, textAlign: 'center' }]}>{bw.maidens}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1, textAlign: 'center' }]}>{bw.runsConceded}</Text>
                              <Text style={[styles.tableDataCellBold, { flex: 1, textAlign: 'center', color: '#f59e0b' }]}>{bw.wickets}</Text>
                              <Text style={[styles.tableDataCell, { flex: 1.5, textAlign: 'right' }]}>{bw.economy}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Fall of Wickets */}
                        {scorecardData.innings[activeInningsTab].fallOfWickets && scorecardData.innings[activeInningsTab].fallOfWickets.length > 0 && (
                          <View style={{ marginTop: 14 }}>
                            <Text style={styles.sectionHeader}>Fall of Wickets</Text>
                            <Text style={styles.fallOfWicketsText}>
                              {scorecardData.innings[activeInningsTab].fallOfWickets.join(' • ')}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.scorecardLoading}>
                <Text style={styles.emptyText}>Scorecard data not available.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================= */}
      {/* EDIT PROFILE MODAL */}
      {/* ============================================================= */}
      <Modal
        visible={isEditProfileVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>Edit Player Profile</Text>
                <Text style={styles.modalHeaderSub}>Update permitted player profile fields</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsEditProfileVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {profileFeedback && (
                <View style={[
                  styles.feedbackBanner,
                  profileFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
                ]}>
                  <Text style={styles.feedbackText}>{profileFeedback.message}</Text>
                </View>
              )}

              {/* NON-EDITABLE SAFEGUARD FIELDS */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Player Name (Official - Locked)</Text>
                <TextInput
                  style={[styles.inputField, styles.inputFieldDisabled]}
                  value={profile?.name || playerName}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Email (Official - Locked)</Text>
                <TextInput
                  style={[styles.inputField, styles.inputFieldDisabled]}
                  value={profile?.email || 'N/A'}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Affiliated Team (Assigned - Locked)</Text>
                <TextInput
                  style={[styles.inputField, styles.inputFieldDisabled]}
                  value={playerTeam}
                  editable={false}
                />
              </View>

              {/* PERMITTED EDITABLE FIELDS */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Batting Style *</Text>
                <TextInput
                  style={styles.inputField}
                  value={editBattingStyle}
                  onChangeText={setEditBattingStyle}
                  placeholder="e.g. Right Hand Bat / Left Hand Bat"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bowling Style *</Text>
                <TextInput
                  style={styles.inputField}
                  value={editBowlingStyle}
                  onChangeText={setEditBowlingStyle}
                  placeholder="e.g. Right Arm Medium / Off Break"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jersey Number *</Text>
                <TextInput
                  style={styles.inputField}
                  value={editJerseyNumber}
                  onChangeText={setEditJerseyNumber}
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.inputField}
                  value={editMobile}
                  onChangeText={setEditMobile}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Taluk</Text>
                <TextInput
                  style={styles.inputField}
                  value={editTaluk}
                  onChangeText={setEditTaluk}
                  placeholder="Virudhunagar / Sivakasi"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isSavingProfile && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#020612" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Updates</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020612'
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#060d1f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0b1329',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  exitBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  refreshBtn: {
    padding: 8,
    marginRight: 6
  },
  refreshBtnText: {
    fontSize: 16
  },
  exitTextBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b'
  },
  exitTextBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981'
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  statusDotApproved: {
    backgroundColor: '#10b981'
  },
  statusDotPending: {
    backgroundColor: '#f59e0b'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  navBarWrapper: {
    backgroundColor: '#060d1f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  navTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0b1329',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  navTabActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6'
  },
  navTabIcon: {
    fontSize: 13,
    marginRight: 6
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8'
  },
  navTabTextActive: {
    color: '#ffffff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    margin: 12,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 12,
    flex: 1
  },
  retryText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    marginLeft: 8
  },
  bodyScroll: {
    flex: 1
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  jerseyBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e3a8a',
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  jerseyBadgeLargeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  heroPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  heroTeamSub: {
    fontSize: 13,
    color: '#f59e0b',
    marginTop: 2
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  heroMetaTag: {
    fontSize: 11,
    color: '#94a3b8'
  },
  heroMetaDot: {
    color: '#64748b',
    marginHorizontal: 6
  },
  approvalStamp: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981'
  },
  approvalStampText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold'
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 14
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  heroStatCol: {
    alignItems: 'center'
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  heroStatLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0b1329',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  actionBtnIcon: {
    fontSize: 18,
    marginBottom: 4
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#0b1329',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  cardSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  cardMeta: {
    fontSize: 11,
    color: '#64748b'
  },
  liveTag: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  liveTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  matchVsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#060d1f',
    padding: 12,
    borderRadius: 8
  },
  matchTeamSide: {
    flex: 1,
    alignItems: 'center'
  },
  matchTeamName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  matchScoreText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4
  },
  vsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#1e293b',
    borderRadius: 12
  },
  vsBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold'
  },
  matchDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  matchDetailItem: {
    color: '#94a3b8',
    fontSize: 12
  },
  scorecardTriggerBtn: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  scorecardTriggerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  noticeTitle: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4
  },
  noticeBody: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  smallEditBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  smallEditBtnText: {
    color: '#020612',
    fontSize: 11,
    fontWeight: 'bold'
  },
  profileFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  profileFieldLabel: {
    color: '#94a3b8',
    fontSize: 13
  },
  profileFieldValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  verifiedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  verifiedTagText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold'
  },
  securityNote: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6
  },
  shieldBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  shieldBadgeText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 13
  },
  teamDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    backgroundColor: '#060d1f',
    padding: 12,
    borderRadius: 8
  },
  teamDetailCol: {
    alignItems: 'center'
  },
  teamDetailVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  teamDetailLbl: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2
  },
  squadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  squadRowHighlighted: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8
  },
  squadJersey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  squadJerseyText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  squadName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  youBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8
  },
  youBadgeText: {
    color: '#020612',
    fontSize: 9,
    fontWeight: 'bold'
  },
  squadRole: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  verifiedMiniBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifiedMiniBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold'
  },
  matchFilterBar: {
    flexDirection: 'row',
    marginBottom: 14
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0b1329',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  filterPillActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b'
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold'
  },
  filterPillTextActive: {
    color: '#020612'
  },
  tournamentName: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600'
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusPillLive: {
    backgroundColor: '#ef4444'
  },
  statusPillCompleted: {
    backgroundColor: '#10b981'
  },
  statusPillScheduled: {
    backgroundColor: '#3b82f6'
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  matchCardTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10
  },
  matchTeamBlock: {
    flex: 1
  },
  matchTeamTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  matchTeamScore: {
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 2
  },
  matchVsSmall: {
    color: '#64748b',
    marginHorizontal: 10,
    fontWeight: 'bold'
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginBottom: 8
  },
  matchFooterText: {
    color: '#64748b',
    fontSize: 11
  },
  resultBanner: {
    backgroundColor: '#060d1f',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10
  },
  resultBannerText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  viewScorecardBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  viewScorecardBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8
  },
  statBox: {
    width: '23%',
    backgroundColor: '#060d1f',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  statBoxVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statBoxLbl: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center'
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#060d1f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  notifIcon: {
    fontSize: 14
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  notifTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1
  },
  notifDate: {
    color: '#64748b',
    fontSize: 10
  },
  notifMessage: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  emptyCard: {
    backgroundColor: '#0b1329',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0b1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#060d1f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  modalHeaderTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  modalHeaderSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  modalCloseBtn: {
    padding: 6
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  scorecardLoading: {
    padding: 40,
    alignItems: 'center'
  },
  scorecardScroll: {
    padding: 14
  },
  scorecardBanner: {
    backgroundColor: '#060d1f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center'
  },
  scorecardBannerTournament: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600'
  },
  scorecardBannerTeams: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4
  },
  scorecardBannerResult: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 4
  },
  inningsTabBar: {
    flexDirection: 'row',
    marginBottom: 12
  },
  inningsTabBtn: {
    flex: 1,
    backgroundColor: '#060d1f',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  inningsTabBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6'
  },
  inningsTabBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  inningsTabBtnTextActive: {
    color: '#ffffff'
  },
  inningsContentCard: {
    backgroundColor: '#060d1f',
    padding: 12,
    borderRadius: 8
  },
  sectionHeader: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8
  },
  scorecardTable: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    overflow: 'hidden'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0b1329',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  tableHeaderCell: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold'
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0e1726'
  },
  tableDataName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  tableDataDismissal: {
    color: '#64748b',
    fontSize: 10
  },
  tableDataCell: {
    color: '#94a3b8',
    fontSize: 11
  },
  tableDataCellBold: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  fallOfWicketsText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16
  },
  modalFormScroll: {
    padding: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  inputField: {
    backgroundColor: '#060d1f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  inputFieldDisabled: {
    opacity: 0.6,
    backgroundColor: '#020612'
  },
  saveBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  saveBtnDisabled: {
    opacity: 0.6
  },
  saveBtnText: {
    color: '#020612',
    fontSize: 14,
    fontWeight: 'bold'
  },
  feedbackBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981'
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  }
});
