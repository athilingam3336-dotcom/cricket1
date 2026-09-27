import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';

// Web vs Native WebView Fallback
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.log('WebView not available');
  }
}

const { width } = Dimensions.get('window');

const COLORS = {
  navyAbyss: '#020612',
  navyCard: '#0a1b3d',
  navyElevated: '#0f2452',
  goldPrimary: '#d4af37',
  goldBright: '#f5c43d',
  goldHighlight: '#fff7d6',
  cricketRed: '#9e182b',
  cricketRedBright: '#c81e37',
  textWhite: '#ffffff',
  textMuted: '#9bb0cf',
  turfGreen: '#22c55e',
};

type FilterType = 'all' | 'live' | 'upcoming' | 'results';

export default function App() {
  // If running on Mobile (iOS / Android) and WebView is supported, use full native WebView
  if (Platform.OS !== 'web' && WebView) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#020612' }}>
        <StatusBar barStyle="light-content" backgroundColor="#020612" />
        <WebView
          source={{ uri: 'https://raw.githack.com/athilingam3336-dotcom/cricket1/main/index.html' }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </SafeAreaView>
    );
  }

  // Web view fallback / Pure React Native UI render
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const matches = [
    {
      id: '1',
      category: 'live',
      tournament: 'Virudhunagar Premier League • Final',
      format: 'T20',
      team1: { code: 'VS', name: 'Virudhunagar Strikers', runs: '164/5', overs: '(18.2 ov)', isBatting: true },
      team2: { code: 'SSK', name: 'Sivakasi Super Kings', runs: '162/8', overs: '(20.0 ov)', isBatting: false },
      statusNote: 'Virudhunagar Strikers need 2 runs in 4 balls',
      ground: 'District Sports Complex Ground, Virudhunagar',
    },
    {
      id: '2',
      category: 'live',
      tournament: 'TNCA 1st Division League • Day 2',
      format: '3-DAY',
      team1: { code: 'RCC', name: 'Rajapalayam Cricket Club', runs: '312 & 45/1', overs: '(14 ov)', isBatting: true },
      team2: { code: 'AKS', name: 'Aruppukottai Stars', runs: '220', overs: '(68.4 ov)', isBatting: false },
      statusNote: 'Rajapalayam CC lead by 137 runs',
      ground: 'Kamarajar College Ground, Virudhunagar',
    },
    {
      id: '3',
      category: 'upcoming',
      tournament: 'K. Kamarajar T20 Trophy • Match 12',
      format: 'T20',
      team1: { code: 'SW', name: 'Srivilliputhur Warriors', runs: '-', overs: '', isBatting: false },
      team2: { code: 'SXI', name: 'Sattur XI', runs: '-', overs: '', isBatting: false },
      statusNote: 'Match starts tomorrow at 09:30 AM',
      ground: 'G.V.N. College Ground, Kovilpatti Road',
    },
  ];

  const filteredMatches = matches.filter(
    (m) => activeFilter === 'all' || m.category === activeFilter
  );

  // If on Web browser environment, render iframe or pure RN UI components nicely
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#020612' }}>
        <StatusBar barStyle="light-content" backgroundColor="#020612" />
        {/* @ts-ignore */}
        <iframe
          src="https://raw.githack.com/athilingam3336-dotcom/cricket1/main/index.html"
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '100vh' }}
          title="Cricket Federation Web UI"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyAbyss} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* 1. MAIN HEADER / BRANDING */}
        <View style={styles.header}>
          <View style={styles.brandFrame}>
            <View style={styles.logoEmblem}>
              <Text style={styles.logoText}>CFVD</Text>
            </View>
            <View style={styles.brandTextWrapper}>
              <Text style={styles.brandMain}>CRICKET FEDERATION</Text>
              <Text style={styles.brandSub}>OF VIRUDHUNAGAR DISTRICT</Text>
              <View style={styles.affiliationRow}>
                <Text style={styles.affiliationText}>🏆 Affiliated to TNCA</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.registerBtn} activeOpacity={0.8}>
            <Text style={styles.registerBtnText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* 2. LIVE TICKER BAR */}
        <View style={styles.tickerBar}>
          <View style={styles.liveBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveBadgeText}>LIVE TICKER</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickerScroll}>
            <Text style={styles.tickerText}>
              🏆 VPL 2026 Final: Virudhunagar Strikers 164/5 vs Sivakasi Super Kings 162/8 • 📢 TNCA Div 1: Day 2 Stumps
            </Text>
          </ScrollView>
        </View>

        {/* 3. HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <Text style={styles.goldPill}>OFFICIAL DISTRICT BODY</Text>
            <Text style={styles.heritagePill}>SRIVILLIPUTHUR HERITAGE</Text>
          </View>

          <Text style={styles.heroTitlePrefix}>Cricket Federation of</Text>
          <Text style={styles.heroTitleMain}>Virudhunagar District</Text>

          {/* Golden Ribbon Motto */}
          <View style={styles.mottoRibbon}>
            <Text style={styles.mottoText}>★ Enjoy the game and chase your dreams ★</Text>
          </View>

          <Text style={styles.heroDescription}>
            Governing and fostering grassroots & competitive cricket across Srivilliputhur, Sivakasi, Rajapalayam, Sattur, and Virudhunagar.
          </Text>

          {/* Hero CTAs */}
          <View style={styles.ctaGroup}>
            <TouchableOpacity style={styles.primaryCta} activeOpacity={0.8}>
              <Text style={styles.primaryCtaText}>Match Centre Live</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.8}>
              <Text style={styles.secondaryCtaText}>View Leagues</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>42</Text>
              <Text style={styles.metricLabel}>Clubs</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>1,450+</Text>
              <Text style={styles.metricLabel}>Players</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>8</Text>
              <Text style={styles.metricLabel}>Grounds</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>16</Text>
              <Text style={styles.metricLabel}>Leagues</Text>
            </View>
          </View>
        </View>

        {/* 4. QUICK ACCESS CARDS */}
        <View style={styles.quickAccessGrid}>
          {[
            { title: 'Match Centre', desc: 'Live scores & fixtures', icon: '📺' },
            { title: 'League Standings', desc: 'Official TNCA tables', icon: '📊' },
            { title: 'District Academy', desc: 'Coaching camps', icon: '🏏' },
            { title: 'Player Registration', desc: 'Season 2026-27 Trials', icon: '📝', highlight: true },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickCard, item.highlight && styles.quickCardHighlight]}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <View style={styles.quickDetails}>
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickDesc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. MATCH CENTRE SECTION */}
        <View style={styles.matchCentreSection}>
          <Text style={styles.sectionTag}>TNCA DISTRICT MATCH CENTRE</Text>
          <Text style={styles.sectionTitle}>Official Matches & Results</Text>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            {(['all', 'live', 'upcoming', 'results'] as FilterType[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterTabText, activeFilter === filter && styles.filterTabTextActive]}>
                  {filter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Match Cards List */}
          {filteredMatches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <View style={styles.cardHeader}>
                {match.category === 'live' && (
                  <View style={styles.livePill}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.livePillText}>LIVE</Text>
                  </View>
                )}
                <Text style={styles.cardTournament} numberOfLines={1}>
                  {match.tournament}
                </Text>
                <Text style={styles.formatBadge}>{match.format}</Text>
              </View>

              {/* Team 1 */}
              <View style={[styles.teamRow, match.team1.isBatting && styles.battingTeamRow]}>
                <View style={styles.teamMeta}>
                  <View style={styles.teamCrest}>
                    <Text style={styles.teamCrestText}>{match.team1.code}</Text>
                  </View>
                  <Text style={styles.teamName}>{match.team1.name}</Text>
                </View>
                <View style={styles.teamFigures}>
                  <Text style={styles.teamRuns}>{match.team1.runs}</Text>
                  <Text style={styles.teamOvers}>{match.team1.overs}</Text>
                </View>
              </View>

              {/* Team 2 */}
              <View style={[styles.teamRow, match.team2.isBatting && styles.battingTeamRow]}>
                <View style={styles.teamMeta}>
                  <View style={styles.teamCrest}>
                    <Text style={styles.teamCrestText}>{match.team2.code}</Text>
                  </View>
                  <Text style={styles.teamName}>{match.team2.name}</Text>
                </View>
                <View style={styles.teamFigures}>
                  <Text style={styles.teamRuns}>{match.team2.runs}</Text>
                  <Text style={styles.teamOvers}>{match.team2.overs}</Text>
                </View>
              </View>

              {/* Status Note */}
              <Text style={styles.statusNote}>📍 {match.statusNote}</Text>
              <Text style={styles.groundText}>🏟 {match.ground}</Text>

              <TouchableOpacity style={styles.scorecardBtn} activeOpacity={0.8}>
                <Text style={styles.scorecardBtnText}>View Scorecard</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navyAbyss,
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.navyAbyss,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  brandFrame: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoEmblem: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.goldPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontWeight: '900',
    color: COLORS.navyAbyss,
    fontSize: 12,
  },
  brandTextWrapper: {},
  brandMain: {
    color: COLORS.goldPrimary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandSub: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: 10,
  },
  affiliationRow: {
    marginTop: 2,
  },
  affiliationText: {
    color: COLORS.goldBright,
    fontSize: 9,
    fontWeight: '500',
  },
  registerBtn: {
    backgroundColor: COLORS.goldPrimary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  registerBtnText: {
    color: COLORS.navyAbyss,
    fontWeight: '700',
    fontSize: 12,
  },
  tickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050d22',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cricketRed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  tickerScroll: {
    flex: 1,
  },
  tickerText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  heroSection: {
    padding: 20,
    backgroundColor: COLORS.navyCard,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  goldPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    color: COLORS.goldPrimary,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.goldPrimary,
  },
  heritagePill: {
    backgroundColor: 'rgba(200, 30, 55, 0.15)',
    color: '#f87171',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  heroTitlePrefix: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: '400',
  },
  heroTitleMain: {
    color: COLORS.goldPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  mottoRibbon: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.goldPrimary,
  },
  mottoText: {
    color: COLORS.goldHighlight,
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  heroDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  ctaGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  primaryCta: {
    backgroundColor: COLORS.cricketRedBright,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryCta: {
    borderWidth: 1,
    borderColor: COLORS.goldPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryCtaText: {
    color: COLORS.goldPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.navyAbyss,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    color: COLORS.goldPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  quickAccessGrid: {
    paddingHorizontal: 14,
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickCard: {
    width: (width - 38) / 2,
    backgroundColor: COLORS.navyElevated,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickCardHighlight: {
    borderColor: COLORS.goldPrimary,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  quickIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickDetails: {
    flex: 1,
  },
  quickTitle: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  quickDesc: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  matchCentreSection: {
    paddingHorizontal: 14,
    marginTop: 24,
  },
  sectionTag: {
    color: COLORS.goldBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    color: COLORS.textWhite,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  filterTabs: {
    marginBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.navyElevated,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: {
    backgroundColor: COLORS.goldPrimary,
    borderColor: COLORS.goldPrimary,
  },
  filterTabText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: COLORS.navyAbyss,
  },
  matchCard: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cricketRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  livePillText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  cardTournament: {
    color: COLORS.textMuted,
    fontSize: 10,
    flex: 1,
    marginRight: 6,
  },
  formatBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: COLORS.goldPrimary,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  battingTeamRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamCrest: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  teamCrestText: {
    color: COLORS.goldPrimary,
    fontSize: 8,
    fontWeight: '900',
  },
  teamName: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  teamFigures: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  teamRuns: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '800',
    marginRight: 4,
  },
  teamOvers: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  statusNote: {
    color: COLORS.goldBright,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 10,
  },
  groundText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  scorecardBtn: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  scorecardBtnText: {
    color: COLORS.goldPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});
