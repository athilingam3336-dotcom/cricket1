/**
 * src/screens/player/PlayerDashboardScreen.tsx
 *
 * Official Player Management Portal for Cricket Federation of Virudhunagar District (CFVD).
 * Styled with the elegant Light Theme matching the Federation Console design:
 * - Top Dark Navy Header with Gold Federation Branding, User Badge, and Red Exit Pill
 * - Warm Cream Stadium Atmosphere Background (#f6f2e9 / #f8f6f0)
 * - White Floating Sub-Navigation Tabs Bar with Amber Active Pill & Red Logout Pill
 * - Two Highlight Dark Navy Cards:
 *     1. Player Career Summary with 4 colored status rows (Matches, Runs, Wickets, Average)
 *     2. Status & Performance Distribution Donut Ring Chart with 3-Color Legend
 * - Crisp White Search & Filter Toolbar
 * - White Item Cards with Left-Accents, Status Badges, and Action Buttons (View, Edit Profile)
 * - Light Theme Modals for Profile Editing and Certified Read-Only Match Scorecards
 * - Full MongoDB Backend Integration via PlayerApi & ScorerApi
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { PlayerApi, ScorerApi, getCurrentUser, setCurrentUser } from '../../services/api';

// Asset references
const IMG_LOGO = require('../../../assets/logo_transparent.png');
const IMG_WATERMARK = require('../../../assets/watermark.png');
const IMG_STADIUM = require('../../../assets/stadium.jpg');

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'SCHEDULED' | 'LIVE' | 'COMPLETED'>('ALL');

  // Scorecard Modal State
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

  // Logout modal state
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);

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

  // Save Profile Updates
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

  // Open Scorecard
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
      Alert.alert('Scorecard Notice', err?.message || 'Could not retrieve detailed match scorecard.');
    } finally {
      setIsLoadingScorecard(false);
    }
  };

  const handleLogout = async () => {
    try {
      await ScorerApi.logout();
    } catch (_e) {}
    setLogoutModalOpen(false);
    if (onExit) onExit();
  };

  // Computed metrics
  const playerName = profile?.name || initialParams?.user?.name || initialParams?.playerName || 'Karthi';
  const playerEmail = profile?.email || initialParams?.user?.email || 'player@cfvd.org';
  const playerRole = profile?.role || 'Batter';
  const playerTeam = profile?.teamName || teamInfo?.name || 'Virudhunagar Spartans CC';
  const approvalStatus = (profile?.status || 'APPROVED').toUpperCase();
  const playerId = profile?.id || 'CFVD-PLY-101';

  const matchesPlayed = statistics?.batting?.matches ?? matches.length ?? 8;
  const runsScored = statistics?.batting?.runs ?? profile?.stats?.runs ?? 245;
  const wicketsTaken = statistics?.bowling?.wickets ?? profile?.stats?.wickets ?? 6;
  const battingAvg = statistics?.batting?.average ?? '49.00';
  const catchesTaken = statistics?.fielding?.catches ?? profile?.stats?.catches ?? 5;

  // Donut chart distribution calculations (Runs vs Wickets vs Catches)
  const donutSegments = useMemo(() => {
    const total = runsScored + (wicketsTaken * 10) + (catchesTaken * 5);
    if (total === 0) return { runsPct: 60, wktsPct: 25, catchPct: 15 };
    const runsPct = Math.round((runsScored / total) * 100);
    const wktsPct = Math.round(((wicketsTaken * 10) / total) * 100);
    const catchPct = 100 - runsPct - wktsPct;
    return { runsPct, wktsPct, catchPct };
  }, [runsScored, wicketsTaken, catchesTaken]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const statusUpper = (m.status || 'SCHEDULED').toUpperCase();
      let matchesCategory = true;
      if (matchFilter === 'LIVE') matchesCategory = statusUpper === 'LIVE' || statusUpper === 'INNINGS_BREAK';
      else if (matchFilter === 'SCHEDULED') matchesCategory = statusUpper === 'SCHEDULED';
      else if (matchFilter === 'COMPLETED') matchesCategory = statusUpper === 'COMPLETED';

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (m.teamA?.name || m.team_a_name || '').toLowerCase().includes(q) ||
        (m.teamB?.name || m.team_b_name || '').toLowerCase().includes(q) ||
        (m.venue || '').toLowerCase().includes(q) ||
        (m.tournament || m.tournament_name || '').toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [matches, matchFilter, searchQuery]);

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#071026" />

      {/* ─────────────────────────────────────────────────────────────
          1. TOP MINIMAL FEDERATION HEADER
          ───────────────────────────────────────────────────────────── */}
      <View style={styles.topHeaderBar}>
        <View style={styles.brandRow}>
          <Image source={IMG_LOGO} style={styles.brandLogo} resizeMode="contain" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.brandTitleMain}>CRICKET FEDERATION OF VIRUDHUNAGAR DISTRICT</Text>
            <Text style={styles.brandTitleSub}>Official Player Portal • Career & Match Operations</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <View style={styles.userBadgePill}>
            <Text style={styles.userBadgePillText} numberOfLines={1}>👤 {playerEmail}</Text>
          </View>
          <TouchableOpacity
            style={styles.exitBtnPill}
            onPress={onExit}
            activeOpacity={0.8}
            accessibilityLabel="Exit Player Portal"
          >
            <Text style={styles.exitBtnPillText}>← Exit Player</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          2. ATMOSPHERIC CREAM SCROLL CONTAINER
          ───────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentConstrained}>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBannerBox}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
              <TouchableOpacity onPress={loadPlayerData}>
                <Text style={styles.retryBtnText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. SUB-NAVIGATION TABS BAR (White Card Container)
              ───────────────────────────────────────────────────────────── */}
          <View style={styles.tabsCardBar}>
            {/* Overview Tab */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
              onPress={() => setActiveTab('overview')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
                📊 Overview
              </Text>
            </TouchableOpacity>

            {/* Profile Tab */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
                👤 My Profile
              </Text>
            </TouchableOpacity>

            {/* Team & Squad Tab */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'team' && styles.tabBtnActive]}
              onPress={() => setActiveTab('team')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'team' && styles.tabBtnTextActive]}>
                👥 My Squad
              </Text>
              <View style={styles.tabBadgeBlue}>
                <Text style={styles.tabBadgeBlueText}>{squad.length || 15}</Text>
              </View>
            </TouchableOpacity>

            {/* Matches Tab */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'matches' && styles.tabBtnActive]}
              onPress={() => setActiveTab('matches')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'matches' && styles.tabBtnTextActive]}>
                🏏 Matches
              </Text>
              <View style={styles.tabBadgeOrange}>
                <Text style={styles.tabBadgeOrangeText}>{matches.length}</Text>
              </View>
            </TouchableOpacity>

            {/* Statistics Tab */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'statistics' && styles.tabBtnActive]}
              onPress={() => setActiveTab('statistics')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'statistics' && styles.tabBtnTextActive]}>
                📈 Statistics
              </Text>
            </TouchableOpacity>

            {/* Notices Tab */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'notifications' && styles.tabBtnActive]}
              onPress={() => setActiveTab('notifications')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'notifications' && styles.tabBtnTextActive]}>
                🔔 Notices
              </Text>
              <View style={styles.tabBadgeGold}>
                <Text style={styles.tabBadgeGoldText}>{notifications.length}</Text>
              </View>
            </TouchableOpacity>

            {/* Red Outline Logout Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setLogoutModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutBtnText}>↪ Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {isLoading && !isRefreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d4af37" />
              <Text style={styles.loadingText}>Connecting to MongoDB & Loading Player Profile...</Text>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. TAB CONTENT: OVERVIEW
              ───────────────────────────────────────────────────────────── */}
          {!isLoading && activeTab === 'overview' && (
            <View>
              {/* TOP TWO SIDE-BY-SIDE HIGHLIGHT CARDS (Exact match to screenshot) */}
              <View style={styles.highlightCardsRow}>
                {/* Left Card: Player Career Summary */}
                <View style={styles.navyStatCard}>
                  <View style={styles.statCardHeader}>
                    <View style={styles.blueIconBox}>
                      <Text style={{ fontSize: 18 }}>🏏</Text>
                    </View>
                    <Text style={styles.statCardTitle}>Player Summary</Text>
                  </View>
                  <Text style={styles.statCardSubtitle}>
                    Official career match statistics and live performance records across Virudhunagar District.
                  </Text>

                  {/* 4 Colored Pill Rows */}
                  <View style={styles.pillRowsContainer}>
                    {/* Matches Played */}
                    <View style={[styles.statRowPill, styles.rowPillGreen]}>
                      <View style={styles.pillLeftGroup}>
                        <View style={[styles.glowingDot, { backgroundColor: '#10b981' }]} />
                        <Text style={[styles.pillLabel, { color: '#a7f3d0' }]}>Matches Played</Text>
                      </View>
                      <Text style={[styles.pillCount, { color: '#4ade80' }]}>{matchesPlayed}</Text>
                    </View>

                    {/* Runs Scored */}
                    <View style={[styles.statRowPill, styles.rowPillAmber]}>
                      <View style={styles.pillLeftGroup}>
                        <View style={[styles.glowingDot, { backgroundColor: '#eab308' }]} />
                        <Text style={[styles.pillLabel, { color: '#fde68a' }]}>Runs Scored</Text>
                      </View>
                      <Text style={[styles.pillCount, { color: '#fbbf24' }]}>{runsScored}</Text>
                    </View>

                    {/* Wickets Taken */}
                    <View style={[styles.statRowPill, styles.rowPillRed]}>
                      <View style={styles.pillLeftGroup}>
                        <View style={[styles.glowingDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={[styles.pillLabel, { color: '#fca5a5' }]}>Wickets Taken</Text>
                      </View>
                      <Text style={[styles.pillCount, { color: '#f87171' }]}>{wicketsTaken}</Text>
                    </View>

                    {/* Batting Average */}
                    <View style={[styles.statRowPill, styles.rowPillIndigo]}>
                      <View style={styles.pillLeftGroup}>
                        <View style={[styles.glowingDot, { backgroundColor: '#818cf8' }]} />
                        <Text style={[styles.pillLabel, { color: '#c7d2fe' }]}>Batting Average</Text>
                      </View>
                      <Text style={[styles.pillCount, { color: '#a5b4fc' }]}>{battingAvg}</Text>
                    </View>
                  </View>
                </View>

                {/* Right Card: Performance Distribution Donut Ring */}
                <View style={[styles.navyStatCard, styles.donutCardAlign]}>
                  <View style={styles.donutHeader}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>📊</Text>
                    <Text style={styles.statCardTitle}>Status & Distribution</Text>
                  </View>

                  {/* Donut Chart with CSS Conic Gradient */}
                  <View style={styles.donutWrapper}>
                    <View
                      style={[
                        styles.donutOuterRing,
                        Platform.OS === 'web' &&
                          ({
                            background: `conic-gradient(#10b981 0% ${donutSegments.runsPct}%, #f59e0b ${donutSegments.runsPct}% ${donutSegments.runsPct + donutSegments.wktsPct}%, #ef4444 ${donutSegments.runsPct + donutSegments.wktsPct}% 100%)`,
                            backgroundImage: `conic-gradient(#10b981 0% ${donutSegments.runsPct}%, #f59e0b ${donutSegments.runsPct}% ${donutSegments.runsPct + donutSegments.wktsPct}%, #ef4444 ${donutSegments.runsPct + donutSegments.wktsPct}% 100%)`
                          } as any)
                      ]}
                    >
                      {/* Center Hole */}
                      <View style={styles.donutHole}>
                        <Text style={styles.donutNumber}>{matchesPlayed}</Text>
                        <Text style={styles.donutUnitLabel}>MATCHES</Text>
                      </View>
                    </View>
                  </View>

                  {/* 3-Color Legend */}
                  <View style={styles.donutLegendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                      <Text style={[styles.legendText, { color: '#6ee7b7' }]}>Runs ({runsScored})</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={[styles.legendText, { color: '#fde68a' }]}>Wickets ({wicketsTaken})</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={[styles.legendText, { color: '#fca5a5' }]}>Catches ({catchesTaken})</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* SEARCH & FILTER TOOLBAR */}
              <View style={styles.toolbarCard}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search player details, matches, team or club..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.filterPillsGroup}>
                  <Text style={styles.filterStatusLabel}>Filter:</Text>
                  <TouchableOpacity
                    style={[styles.filterPill, matchFilter === 'ALL' && styles.filterPillActive]}
                    onPress={() => setMatchFilter('ALL')}
                  >
                    <Text style={[styles.filterPillText, matchFilter === 'ALL' && styles.filterPillTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterPill, matchFilter === 'SCHEDULED' && styles.filterPillActive]}
                    onPress={() => setMatchFilter('SCHEDULED')}
                  >
                    <Text style={[styles.filterPillText, matchFilter === 'SCHEDULED' && styles.filterPillTextActive]}>
                      Scheduled
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterPill, matchFilter === 'LIVE' && styles.filterPillActive]}
                    onPress={() => setMatchFilter('LIVE')}
                  >
                    <Text style={[styles.filterPillText, matchFilter === 'LIVE' && styles.filterPillTextActive]}>
                      Live
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterPill, matchFilter === 'COMPLETED' && styles.filterPillActive]}
                    onPress={() => setMatchFilter('COMPLETED')}
                  >
                    <Text style={[styles.filterPillText, matchFilter === 'COMPLETED' && styles.filterPillTextActive]}>
                      Completed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* MAIN PLAYER IDENTITY CARD (Exact style to screenshot card) */}
              <View style={[styles.whiteItemCard, styles.cardApprovedBorder]}>
                <View style={styles.itemCardHeaderRow}>
                  <View style={styles.itemTitleGroup}>
                    <View style={styles.itemTitleBadgeRow}>
                      <Text style={styles.itemNameText}>Thiru. {playerName}</Text>
                      <View style={styles.badgeConfirmed}>
                        <Text style={styles.badgeConfirmedText}>✔ {approvalStatus}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemIdGradeText}>
                      ID: {playerId} • Grade: Division 1 League Player • Jersey: #{profile?.jerseyNumber || 10}
                    </Text>
                  </View>

                  {/* Action Buttons on Right */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.btnActionView}
                      onPress={() => setActiveTab('profile')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnActionViewText}>👁 View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnActionEdit}
                      onPress={() => setIsEditProfileVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnActionEditText}>✏ Edit Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4-Column Meta Details Row */}
                <View style={styles.metaDetailsGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>EMAIL ADDRESS</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{playerEmail}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>CONTACT PHONE</Text>
                    <Text style={styles.metaValue}>{profile?.mobile || '+91 94431 12345'}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>TALUK / JURISDICTION</Text>
                    <Text style={styles.metaValue}>{profile?.taluk || 'Virudhunagar'}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>CLUB & PLAYING STYLE</Text>
                    <Text style={styles.metaValue}>{playerTeam} ({profile?.battingStyle || 'RHB'})</Text>
                  </View>
                </View>
              </View>

              {/* UPCOMING MATCH HIGHLIGHT CARD */}
              {matches.length > 0 && (
                <View style={[styles.whiteItemCard, { marginTop: 14, borderLeftColor: '#3b82f6' }]}>
                  <View style={styles.itemCardHeaderRow}>
                    <View style={styles.itemTitleGroup}>
                      <View style={styles.itemTitleBadgeRow}>
                        <Text style={styles.itemNameText}>Upcoming Match Fixture</Text>
                        <View style={styles.badgeBlue}>
                          <Text style={styles.badgeBlueText}>🏏 {matches[0]?.status || 'SCHEDULED'}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemIdGradeText}>
                        {matches[0]?.tournament || 'Virudhunagar District League 2026'} • 📍 {matches[0]?.venue || 'Kamarajar Stadium'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.btnActionView}
                      onPress={() => handleOpenScorecard(matches[0]?.id || 'M001')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnActionViewText}>View Match Scorecard →</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.matchTeamsRow}>
                    <View style={styles.matchTeamSide}>
                      <Text style={styles.matchTeamTitle}>{matches[0]?.teamA?.name || 'Virudhunagar Spartans'}</Text>
                      {matches[0]?.scoreA && <Text style={styles.matchScoreText}>{matches[0]?.scoreA}</Text>}
                    </View>
                    <View style={styles.vsCircle}>
                      <Text style={styles.vsCircleText}>VS</Text>
                    </View>
                    <View style={styles.matchTeamSide}>
                      <Text style={styles.matchTeamTitle}>{matches[0]?.teamB?.name || 'Sivakasi Strikers'}</Text>
                      {matches[0]?.scoreB && <Text style={styles.matchScoreText}>{matches[0]?.scoreB}</Text>}
                    </View>
                  </View>
                </View>
              )}

              {/* LATEST ASSOCIATION BULLETIN */}
              {notifications.length > 0 && (
                <View style={[styles.whiteItemCard, { marginTop: 14, borderLeftColor: '#d4af37' }]}>
                  <View style={styles.itemCardHeaderRow}>
                    <View style={styles.itemTitleGroup}>
                      <View style={styles.itemTitleBadgeRow}>
                        <Text style={styles.itemNameText}>Latest Federation Notice</Text>
                        <View style={styles.badgeGold}>
                          <Text style={styles.badgeGoldText}>📢 Official</Text>
                        </View>
                      </View>
                      <Text style={styles.itemIdGradeText}>
                        {new Date(notifications[0]?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.noticeTitleBold}>{notifications[0]?.title}</Text>
                  <Text style={styles.noticeBodyText}>{notifications[0]?.message}</Text>
                </View>
              )}
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              5. TAB CONTENT: PROFILE
              ───────────────────────────────────────────────────────────── */}
          {!isLoading && activeTab === 'profile' && (
            <View>
              <View style={styles.whiteItemCard}>
                <View style={styles.itemCardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeaderTitle}>Official Player Dossier</Text>
                    <Text style={styles.cardHeaderSubtitle}>Registered credentials certified under Tamil Nadu Cricket Federation</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.btnActionEdit}
                    onPress={() => setIsEditProfileVisible(true)}
                  >
                    <Text style={styles.btnActionEditText}>✏ Edit Profile</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profileDetailsGrid}>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Full Name</Text>
                    <Text style={styles.profileVal}>{profile?.name || playerName}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Registered Email</Text>
                    <Text style={styles.profileVal}>{playerEmail}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Contact Mobile</Text>
                    <Text style={styles.profileVal}>{profile?.mobile || '+91 94431 12345'}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Federation ID</Text>
                    <Text style={styles.profileVal}>{playerId}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Registration Status</Text>
                    <Text style={[styles.profileVal, { color: '#16a34a', fontWeight: '800' }]}>✔ {approvalStatus}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Club / Team</Text>
                    <Text style={[styles.profileVal, { color: '#b45309', fontWeight: '800' }]}>{playerTeam}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Jersey Number</Text>
                    <Text style={styles.profileVal}>#{profile?.jerseyNumber || 10}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Batting Style</Text>
                    <Text style={styles.profileVal}>{profile?.battingStyle || 'Right Hand Bat'}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Bowling Style</Text>
                    <Text style={styles.profileVal}>{profile?.bowlingStyle || 'Right Arm Medium'}</Text>
                  </View>
                  <View style={styles.profileRowItem}>
                    <Text style={styles.profileKey}>Taluk / Jurisdiction</Text>
                    <Text style={styles.profileVal}>{profile?.taluk || 'Virudhunagar District'}</Text>
                  </View>
                </View>
              </View>

              {/* SECURITY CLEARANCE CARD */}
              <View style={[styles.whiteItemCard, { marginTop: 14 }]}>
                <Text style={styles.cardHeaderTitle}>🔒 Authentication & Role Clearance</Text>
                <Text style={styles.securityExplanation}>
                  Your account is protected under CFVD Player Role clearance.
                  As an authenticated Player, you can view your squad roster, fixtures, live scorecards, and performance statistics.
                  Role clearances, team ownership, and match scoring rights are governed exclusively by district administrators and BCCI-certified scorers.
                </Text>
              </View>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              6. TAB CONTENT: TEAM & SQUAD
              ───────────────────────────────────────────────────────────── */}
          {!isLoading && activeTab === 'team' && (
            <View>
              {/* TEAM HEADER CARD */}
              <View style={styles.whiteItemCard}>
                <View style={styles.itemCardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeaderTitle}>{teamInfo?.name || playerTeam}</Text>
                    <Text style={styles.cardHeaderSubtitle}>
                      Coach: {teamInfo?.coachName || 'S. Rajendran'} ({teamInfo?.coachEmail || 'coach@cfvd.org'})
                    </Text>
                  </View>
                  <View style={styles.badgeConfirmed}>
                    <Text style={styles.badgeConfirmedText}>Affiliated Club</Text>
                  </View>
                </View>

                <View style={styles.teamStatsRow}>
                  <View style={styles.teamStatBox}>
                    <Text style={styles.teamStatNum}>{squad.length || 15}</Text>
                    <Text style={styles.teamStatLbl}>Squad Players</Text>
                  </View>
                  <View style={styles.teamStatBox}>
                    <Text style={styles.teamStatNum}>{teamInfo?.stats?.matches || 5}</Text>
                    <Text style={styles.teamStatLbl}>Matches</Text>
                  </View>
                  <View style={styles.teamStatBox}>
                    <Text style={styles.teamStatNum}>{teamInfo?.stats?.won || 4}</Text>
                    <Text style={styles.teamStatLbl}>Won</Text>
                  </View>
                  <View style={styles.teamStatBox}>
                    <Text style={[styles.teamStatNum, { color: '#d97706' }]}>{teamInfo?.stats?.points || 8}</Text>
                    <Text style={styles.teamStatLbl}>Points</Text>
                  </View>
                </View>
              </View>

              {/* 15 SQUAD PLAYERS LIST */}
              <View style={[styles.whiteItemCard, { marginTop: 14 }]}>
                <Text style={styles.cardHeaderTitle}>15-Member Squad Roster</Text>
                <Text style={styles.cardHeaderSubtitle}>Official roster registered for the Virudhunagar Premier League 2026</Text>

                <View style={{ marginTop: 12 }}>
                  {squad.map((pl, idx) => {
                    const isCurrentPlayer =
                      pl.email?.toLowerCase() === playerEmail.toLowerCase() ||
                      pl.name?.toLowerCase() === playerName.toLowerCase();

                    return (
                      <View
                        key={pl.id || idx}
                        style={[styles.squadRowItem, isCurrentPlayer && styles.squadRowActive]}
                      >
                        <View style={styles.squadJerseyCircle}>
                          <Text style={styles.squadJerseyNum}>#{pl.jerseyNumber || (idx + 1)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.squadMemberName, isCurrentPlayer && { color: '#b45309' }]}>
                              {pl.name}
                            </Text>
                            {isCurrentPlayer && (
                              <View style={styles.youPillBadge}>
                                <Text style={styles.youPillBadgeText}>YOU</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.squadMemberRole}>
                            {pl.role || 'Batter'} • {pl.battingStyle || 'Right Hand Bat'}
                          </Text>
                        </View>
                        <View style={styles.verifiedCheckPill}>
                          <Text style={styles.verifiedCheckText}>✔ Approved</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              7. TAB CONTENT: MATCHES
              ───────────────────────────────────────────────────────────── */}
          {!isLoading && activeTab === 'matches' && (
            <View>
              {/* Toolbar with Match Filters */}
              <View style={styles.toolbarCard}>
                <View style={styles.searchBox}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search opponent team, venue or tournament..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.filterPillsGroup}>
                  {(['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED'] as const).map(tab => (
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
              </View>

              {filteredMatches.length === 0 ? (
                <View style={styles.emptyCardBox}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>🏏</Text>
                  <Text style={styles.emptyCardTitle}>No Matches Found</Text>
                  <Text style={styles.emptyCardSub}>No tournament fixtures found matching current criteria.</Text>
                </View>
              ) : (
                filteredMatches.map(m => {
                  const statusUpper = (m.status || 'SCHEDULED').toUpperCase();
                  const isLive = statusUpper === 'LIVE' || statusUpper === 'INNINGS_BREAK';
                  const isCompleted = statusUpper === 'COMPLETED';

                  return (
                    <View
                      key={m.id}
                      style={[
                        styles.whiteItemCard,
                        { marginBottom: 12 },
                        isLive && { borderLeftColor: '#ef4444' },
                        isCompleted && { borderLeftColor: '#10b981' }
                      ]}
                    >
                      <View style={styles.itemCardHeaderRow}>
                        <View>
                          <Text style={styles.matchCardTournament}>{m.tournament || 'Virudhunagar League 2026'}</Text>
                          <Text style={styles.matchCardLocation}>📍 {m.venue || 'District Stadium'} • 📅 {m.date || 'Today'} {m.time ? `• ${m.time}` : ''}</Text>
                        </View>
                        <View style={[styles.badgeBase, isLive ? styles.badgeLive : isCompleted ? styles.badgeCompleted : styles.badgeScheduled]}>
                          <Text style={[styles.badgeBaseText, isLive ? styles.badgeLiveText : isCompleted ? styles.badgeCompletedText : styles.badgeScheduledText]}>
                            {statusUpper}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.matchTeamsRow}>
                        <View style={styles.matchTeamSide}>
                          <Text style={styles.matchTeamTitle}>{m.teamA?.name || m.team_a_name || 'Spartans CC'}</Text>
                          <Text style={styles.matchScoreText}>{m.scoreA || 'Yet to bat'}</Text>
                        </View>
                        <View style={styles.vsCircle}>
                          <Text style={styles.vsCircleText}>VS</Text>
                        </View>
                        <View style={styles.matchTeamSide}>
                          <Text style={styles.matchTeamTitle}>{m.teamB?.name || m.team_b_name || 'Kings CC'}</Text>
                          <Text style={styles.matchScoreText}>{m.scoreB || 'Yet to bat'}</Text>
                        </View>
                      </View>

                      {m.result && (
                        <View style={styles.resultBannerBox}>
                          <Text style={styles.resultBannerText}>🏆 {m.result}</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.btnActionView}
                        onPress={() => handleOpenScorecard(m.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.btnActionViewText}>View Certified Scorecard (Read-Only) →</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              8. TAB CONTENT: STATISTICS
              ───────────────────────────────────────────────────────────── */}
          {!isLoading && activeTab === 'statistics' && (
            <View>
              {/* Batting Card */}
              <View style={styles.whiteItemCard}>
                <Text style={styles.cardHeaderTitle}>🏏 Batting Record</Text>
                <Text style={styles.cardHeaderSubtitle}>Derived from official scorer match logs</Text>

                <View style={styles.statsGridRow}>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{matchesPlayed}</Text>
                    <Text style={styles.statMetricLabel}>Matches</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.batting?.innings ?? 6}</Text>
                    <Text style={styles.statMetricLabel}>Innings</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={[styles.statMetricValue, { color: '#b45309' }]}>{runsScored}</Text>
                    <Text style={styles.statMetricLabel}>Runs</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.batting?.highestScore ?? 68}</Text>
                    <Text style={styles.statMetricLabel}>High Score</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{battingAvg}</Text>
                    <Text style={styles.statMetricLabel}>Average</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.batting?.strikeRate ?? '142.8'}</Text>
                    <Text style={styles.statMetricLabel}>Strike Rate</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.batting?.fours ?? 24}</Text>
                    <Text style={styles.statMetricLabel}>4s</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.batting?.sixes ?? 8}</Text>
                    <Text style={styles.statMetricLabel}>6s</Text>
                  </View>
                </View>
              </View>

              {/* Bowling Card */}
              <View style={[styles.whiteItemCard, { marginTop: 14 }]}>
                <Text style={styles.cardHeaderTitle}>🎯 Bowling Record</Text>
                <Text style={styles.cardHeaderSubtitle}>Live over-by-over analysis</Text>

                <View style={styles.statsGridRow}>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{matchesPlayed}</Text>
                    <Text style={styles.statMetricLabel}>Matches</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.bowling?.overs ?? 16}</Text>
                    <Text style={styles.statMetricLabel}>Overs</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.bowling?.runsConceded ?? 112}</Text>
                    <Text style={styles.statMetricLabel}>Runs</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={[styles.statMetricValue, { color: '#0284c7' }]}>{wicketsTaken}</Text>
                    <Text style={styles.statMetricLabel}>Wickets</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.bowling?.economy ?? '7.00'}</Text>
                    <Text style={styles.statMetricLabel}>Economy</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.bowling?.bestFigures ?? '3/24'}</Text>
                    <Text style={styles.statMetricLabel}>Best Figures</Text>
                  </View>
                </View>
              </View>

              {/* Fielding Card */}
              <View style={[styles.whiteItemCard, { marginTop: 14 }]}>
                <Text style={styles.cardHeaderTitle}>🧤 Fielding Record</Text>
                <Text style={styles.cardHeaderSubtitle}>Catches, dismissals, and ground fielding</Text>

                <View style={styles.statsGridRow}>
                  <View style={styles.statMetricCard}>
                    <Text style={[styles.statMetricValue, { color: '#16a34a' }]}>{catchesTaken}</Text>
                    <Text style={styles.statMetricLabel}>Catches</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.fielding?.runOuts ?? 2}</Text>
                    <Text style={styles.statMetricLabel}>Run-Outs</Text>
                  </View>
                  <View style={styles.statMetricCard}>
                    <Text style={styles.statMetricValue}>{statistics?.fielding?.stumpings ?? 0}</Text>
                    <Text style={styles.statMetricLabel}>Stumpings</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              9. TAB CONTENT: NOTICES
              ───────────────────────────────────────────────────────────── */}
          {!isLoading && activeTab === 'notifications' && (
            <View>
              <View style={styles.whiteItemCard}>
                <Text style={styles.cardHeaderTitle}>Association Bulletins & Alerts</Text>
                <Text style={styles.cardHeaderSubtitle}>Official notifications published by Cricket Federation of Virudhunagar District</Text>

                <View style={{ marginTop: 12 }}>
                  {notifications.length === 0 ? (
                    <Text style={styles.emptyCardSub}>No notices published at this time.</Text>
                  ) : (
                    notifications.map(n => (
                      <View key={n.id} style={styles.notifRowItem}>
                        <View style={styles.notifIconWrap}>
                          <Text style={{ fontSize: 16 }}>📢</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.notifItemTitle}>{n.title}</Text>
                            <Text style={styles.notifItemDate}>
                              {new Date(n.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                          <Text style={styles.notifItemMessage}>{n.message}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────
          10. EDIT PROFILE MODAL (Light Theme)
          ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isEditProfileVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalMainTitle}>Edit Player Profile</Text>
                <Text style={styles.modalSubTitle}>Update your equipment style and mobile contact</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {profileFeedback && (
              <View style={[styles.feedbackBannerBox, profileFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                <Text style={styles.feedbackBannerText}>{profileFeedback.message}</Text>
              </View>
            )}

            <ScrollView style={{ paddingHorizontal: 18, paddingVertical: 14 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Batting Style</Text>
                <TextInput
                  style={styles.formInput}
                  value={editBattingStyle}
                  onChangeText={setEditBattingStyle}
                  placeholder="e.g. Right Hand Bat / Left Hand Bat"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bowling Style</Text>
                <TextInput
                  style={styles.formInput}
                  value={editBowlingStyle}
                  onChangeText={setEditBowlingStyle}
                  placeholder="e.g. Right Arm Fast / Off Break"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preferred Jersey Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editJerseyNumber}
                  onChangeText={setEditJerseyNumber}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editMobile}
                  onChangeText={setEditMobile}
                  keyboardType="phone-pad"
                  placeholder="+91 94431 12345"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Taluk / Jurisdiction</Text>
                <TextInput
                  style={styles.formInput}
                  value={editTaluk}
                  onChangeText={setEditTaluk}
                  placeholder="Virudhunagar"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setIsEditProfileVisible(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalSave}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#020612" size="small" />
                ) : (
                  <Text style={styles.btnModalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          11. READ-ONLY SCORECARD MODAL (Light Theme)
          ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={!!selectedScorecardMatchId}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedScorecardMatchId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalMainTitle}>Certified Match Scorecard</Text>
                <Text style={styles.modalSubTitle}>🔒 Official Digital Score Record • Read-Only</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedScorecardMatchId(null)}>
                <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingScorecard ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator color="#d4af37" size="large" />
                <Text style={{ marginTop: 10, color: '#64748b' }}>Retrieving live match scorecard...</Text>
              </View>
            ) : (
              <ScrollView style={{ padding: 16 }}>
                <View style={styles.scorecardMatchBanner}>
                  <Text style={styles.scorecardBannerTournament}>
                    {scorecardData?.tournamentName || 'Virudhunagar Premier League 2026'}
                  </Text>
                  <Text style={styles.scorecardBannerTeams}>
                    {scorecardData?.teamA?.name || 'Spartans CC'} vs {scorecardData?.teamB?.name || 'Kings CC'}
                  </Text>
                  <Text style={styles.scorecardBannerVenue}>
                    📍 {scorecardData?.venue || 'Kamarajar Stadium'}
                  </Text>
                  {scorecardData?.result && (
                    <Text style={styles.scorecardBannerResultText}>
                      🏆 {scorecardData.result}
                    </Text>
                  )}
                </View>

                {/* Innings Tabs */}
                <View style={styles.inningsTabBar}>
                  <TouchableOpacity
                    style={[styles.inningsTabBtn, activeInningsTab === 0 && styles.inningsTabBtnActive]}
                    onPress={() => setActiveInningsTab(0)}
                  >
                    <Text style={[styles.inningsTabBtnText, activeInningsTab === 0 && styles.inningsTabBtnTextActive]}>
                      Innings 1 ({scorecardData?.innings?.[0]?.teamName || 'Team A'})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inningsTabBtn, activeInningsTab === 1 && styles.inningsTabBtnActive]}
                    onPress={() => setActiveInningsTab(1)}
                  >
                    <Text style={[styles.inningsTabBtnText, activeInningsTab === 1 && styles.inningsTabBtnTextActive]}>
                      Innings 2 ({scorecardData?.innings?.[1]?.teamName || 'Team B'})
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inningsContentBox}>
                  <Text style={styles.inningsHeaderTitle}>
                    {scorecardData?.innings?.[activeInningsTab]?.teamName || (activeInningsTab === 0 ? 'Team A' : 'Team B')} - Score: {scorecardData?.innings?.[activeInningsTab]?.totalRuns ?? 145}/{scorecardData?.innings?.[activeInningsTab]?.totalWickets ?? 6} ({scorecardData?.innings?.[activeInningsTab]?.overs ?? '20.0'} Ov)
                  </Text>

                  {/* Batting table */}
                  <View style={styles.tableBox}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeadCell, { flex: 2 }]}>Batter</Text>
                      <Text style={styles.tableHeadCell}>R</Text>
                      <Text style={styles.tableHeadCell}>B</Text>
                      <Text style={styles.tableHeadCell}>4s</Text>
                      <Text style={styles.tableHeadCell}>6s</Text>
                      <Text style={styles.tableHeadCell}>SR</Text>
                    </View>
                    {(scorecardData?.innings?.[activeInningsTab]?.batting || [
                      { batterName: playerName, runs: 68, balls: 45, fours: 7, sixes: 3, strikeRate: 151.1, dismissal: 'c & b Bowler' },
                      { batterName: 'R. Saravanan', runs: 42, balls: 30, fours: 4, sixes: 1, strikeRate: 140.0, dismissal: 'b Bowler' },
                      { batterName: 'S. Balaji (wk)', runs: 28, balls: 20, fours: 2, sixes: 1, strikeRate: 140.0, dismissal: 'not out' }
                    ]).map((b: any, idx: number) => (
                      <View key={idx} style={styles.tableBodyRow}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.batterNameText}>{b.batterName}</Text>
                          <Text style={styles.dismissalText}>{b.dismissal || 'not out'}</Text>
                        </View>
                        <Text style={[styles.tableBodyCell, { fontWeight: '800', color: '#0f172a' }]}>{b.runs}</Text>
                        <Text style={styles.tableBodyCell}>{b.balls}</Text>
                        <Text style={styles.tableBodyCell}>{b.fours}</Text>
                        <Text style={styles.tableBodyCell}>{b.sixes}</Text>
                        <Text style={styles.tableBodyCell}>{b.strikeRate || ((b.runs / (b.balls || 1)) * 100).toFixed(1)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setSelectedScorecardMatchId(null)}
              >
                <Text style={styles.btnModalCancelText}>Close Scorecard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          12. LOGOUT CONFIRMATION MODAL
          ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={logoutModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardContainer, { maxWidth: 400 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalMainTitle}>Confirm Logout</Text>
              <TouchableOpacity onPress={() => setLogoutModalOpen(false)}>
                <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 18 }}>
              <Text style={{ color: '#334155', fontSize: 14, lineHeight: 20 }}>
                Are you sure you want to end your player session? You can log back in at any time with your credentials.
              </Text>
            </View>
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setLogoutModalOpen(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModalSave, { backgroundColor: '#ef4444' }]}
                onPress={handleLogout}
              >
                <Text style={[styles.btnModalSaveText, { color: '#ffffff' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES: Pure Light Theme matching Admin & Association UI
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#f6f2e9'
  },

  // 1. TOP HEADER BAR
  topHeaderBar: {
    width: '100%',
    backgroundColor: '#071026',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexWrap: 'wrap',
    gap: 12,
    zIndex: 100
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandLogo: {
    width: 44,
    height: 44
  },
  brandTitleMain: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  brandTitleSub: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  userBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)'
  },
  userBadgePillText: {
    color: '#fde68a',
    fontSize: 11.5,
    fontWeight: '700'
  },
  exitBtnPill: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8
  },
  exitBtnPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },

  // 2. MAIN SCROLL CONTAINER
  mainScrollView: {
    flex: 1,
    backgroundColor: '#f6f2e9'
  },
  scrollContentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  contentConstrained: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto'
  },
  errorBannerBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600'
  },
  retryBtnText: {
    color: '#dc2626',
    fontWeight: '800',
    textDecorationLine: 'underline'
  },

  // 3. TABS BAR
  tabsCardBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  tabBtnActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  tabBtnTextActive: {
    color: '#020612',
    fontWeight: '900'
  },
  tabBadgeBlue: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6
  },
  tabBadgeBlueText: {
    color: '#1e40af',
    fontSize: 10.5,
    fontWeight: '800'
  },
  tabBadgeOrange: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6
  },
  tabBadgeOrangeText: {
    color: '#c2410c',
    fontSize: 10.5,
    fontWeight: '800'
  },
  tabBadgeGold: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6
  },
  tabBadgeGoldText: {
    color: '#b45309',
    fontSize: 10.5,
    fontWeight: '800'
  },
  logoutBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)'
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700'
  },

  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 13.5,
    fontWeight: '600'
  },

  // 4. HIGHLIGHT DARK NAVY CARDS (Matching Screenshot)
  highlightCardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  navyStatCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#0a1432',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(254, 215, 102, 0.45)',
    padding: 20
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  blueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statCardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800'
  },
  statCardSubtitle: {
    color: 'rgba(180, 196, 230, 0.75)',
    fontSize: 12,
    lineHeight: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254, 215, 102, 0.15)',
    paddingBottom: 12,
    marginBottom: 14
  },
  pillRowsContainer: {
    gap: 10
  },
  statRowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  rowPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981'
  },
  rowPillAmber: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#eab308'
  },
  rowPillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  rowPillIndigo: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#818cf8'
  },
  pillLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  glowingDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  pillCount: {
    fontSize: 20,
    fontWeight: '900'
  },

  // Donut Ring Card
  donutCardAlign: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  donutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  donutOuterRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center'
  },
  donutHole: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#071026',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  donutNumber: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 34
  },
  donutUnitLabel: {
    color: 'rgba(147, 197, 253, 0.9)',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2
  },
  donutLegendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600'
  },

  // 5. TOOLBAR
  toolbarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12
  },
  searchBox: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: '#0f172a',
    fontSize: 13
  },
  filterPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  filterStatusLabel: {
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: '600',
    marginRight: 4
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  filterPillActive: {
    backgroundColor: '#0a1432',
    borderColor: '#d4af37'
  },
  filterPillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600'
  },
  filterPillTextActive: {
    color: '#f59e0b',
    fontWeight: '800'
  },

  // 6. MAIN WHITE ITEM CARDS (Matching Screenshot Card)
  whiteItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    elevation: 2
  },
  cardApprovedBorder: {
    borderLeftColor: '#10b981'
  },
  itemCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14
  },
  itemTitleGroup: {
    flex: 1,
    minWidth: 260
  },
  itemTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  itemNameText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900'
  },
  badgeConfirmed: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  badgeConfirmedText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800'
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  badgeBlueText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800'
  },
  badgeGold: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  badgeGoldText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '800'
  },
  itemIdGradeText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  btnActionView: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  btnActionViewText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700'
  },
  btnActionEdit: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  btnActionEditText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700'
  },
  metaDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  metaCol: {
    flex: 1,
    minWidth: 140
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700'
  },

  // Match card layout
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginVertical: 12
  },
  matchTeamSide: {
    flex: 1,
    alignItems: 'center'
  },
  matchTeamTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  matchScoreText: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#071026',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10
  },
  vsCircleText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '900'
  },
  matchCardTournament: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800'
  },
  matchCardLocation: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2
  },
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  badgeBaseText: {
    fontSize: 11,
    fontWeight: '800'
  },
  badgeScheduled: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd'
  },
  badgeScheduledText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800'
  },
  badgeLive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5'
  },
  badgeLiveText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '800'
  },
  badgeCompleted: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  badgeCompletedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800'
  },
  resultBannerBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center'
  },
  resultBannerText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700'
  },

  // Notices
  noticeTitleBold: {
    color: '#0f172a',
    fontSize: 14.5,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 4
  },
  noticeBodyText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18
  },

  // Profile Dossier
  cardHeaderTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800'
  },
  cardHeaderSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2
  },
  profileDetailsGrid: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  profileRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  profileKey: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600'
  },
  profileVal: {
    color: '#0f172a',
    fontSize: 13.5,
    fontWeight: '700'
  },
  securityExplanation: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8
  },

  // Team
  teamStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    flexWrap: 'wrap'
  },
  teamStatBox: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center'
  },
  teamStatNum: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900'
  },
  teamStatLbl: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600'
  },
  squadRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  squadRowActive: {
    backgroundColor: '#fffbeb',
    borderRadius: 6
  },
  squadJerseyCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#071026',
    alignItems: 'center',
    justifyContent: 'center'
  },
  squadJerseyNum: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800'
  },
  squadMemberName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  youPillBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  youPillBadgeText: {
    color: '#b45309',
    fontSize: 9.5,
    fontWeight: '900'
  },
  squadMemberRole: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2
  },
  verifiedCheckPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  verifiedCheckText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700'
  },

  // Statistics
  statsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14
  },
  statMetricCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center'
  },
  statMetricValue: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900'
  },
  statMetricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3
  },

  // Notices Tab
  notifRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  notifItemTitle: {
    color: '#0f172a',
    fontSize: 13.5,
    fontWeight: '800'
  },
  notifItemDate: {
    color: '#64748b',
    fontSize: 11
  },
  notifItemMessage: {
    color: '#475569',
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 18
  },

  // Empty state
  emptyCardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 36,
    alignItems: 'center'
  },
  emptyCardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4
  },
  emptyCardSub: {
    color: '#64748b',
    fontSize: 13
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    elevation: 6
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  modalMainTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800'
  },
  modalSubTitle: {
    color: '#64748b',
    fontSize: 11.5,
    marginTop: 2
  },
  formGroup: {
    marginBottom: 14
  },
  formLabel: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6
  },
  formInput: {
    height: 42,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a'
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  btnModalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff'
  },
  btnModalCancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700'
  },
  btnModalSave: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#d4af37'
  },
  btnModalSaveText: {
    color: '#081225',
    fontSize: 13,
    fontWeight: '800'
  },
  feedbackBannerBox: {
    padding: 10,
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 6
  },
  feedbackSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac'
  },
  feedbackError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  feedbackBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a'
  },

  // Scorecard modal details
  scorecardMatchBanner: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    alignItems: 'center'
  },
  scorecardBannerTournament: {
    color: '#b45309',
    fontSize: 11.5,
    fontWeight: '800'
  },
  scorecardBannerTeams: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 4
  },
  scorecardBannerVenue: {
    color: '#64748b',
    fontSize: 12
  },
  scorecardBannerResultText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6
  },
  inningsTabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  inningsTabBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  inningsTabBtnActive: {
    backgroundColor: '#0a1432',
    borderColor: '#d4af37'
  },
  inningsTabBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700'
  },
  inningsTabBtnTextActive: {
    color: '#f59e0b',
    fontWeight: '800'
  },
  inningsContentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12
  },
  inningsHeaderTitle: {
    color: '#0f172a',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 10
  },
  tableBox: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableHeadCell: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    fontWeight: '800'
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  batterNameText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '700'
  },
  dismissalText: {
    color: '#64748b',
    fontSize: 10.5
  },
  tableBodyCell: {
    flex: 1,
    color: '#334155',
    fontSize: 12
  }
});
