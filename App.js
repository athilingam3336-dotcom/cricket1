import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { INLINED_HTML } from './src/generated/inlinedHtml';
import { localAssets } from './src/utils/assets';
import {
  MATCHES_DATA,
  SCORECARD_DETAILS,
  TABLE_DATA_SETS,
  BATTING_LEADERS,
  BOWLING_LEADERS,
  TOURNAMENTS_DATA,
  GROUNDS_DATA,
  OFFICE_BEARERS,
  NEWS_ARTICLES,
  GALLERY_ITEMS,
  AFFILIATED_CLUBS,
  TALUKS,
  SPECIALTIES,
  REGISTRATION_TYPES,
} from './src/data/cricketData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dynamically load react-native-webview on native platforms (iOS / Android)
let NativeWebView = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('react-native-webview native module not loaded:', e);
  }
}

export default function App() {
  // Mode: 'exact' (100% pixel-perfect HTML/CSS/JS mirror) vs 'native' (Pure React Native UI)
  const [viewMode, setViewMode] = useState('exact');
  const [showModeSwitcher, setShowModeSwitcher] = useState(true);

  // Native UI state
  const [themeMode, setThemeMode] = useState('dark');
  const [floodlightMode, setFloodlightMode] = useState('on');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [matchCategory, setMatchCategory] = useState('all');
  const [activeTableKey, setActiveTableKey] = useState('div1');

  // Modals state
  const [scorecardModalVisible, setScorecardModalVisible] = useState(false);
  const [currentScorecardId, setCurrentScorecardId] = useState('match-1');
  const [modalTab, setModalTab] = useState('summary');

  const [registrationModalVisible, setRegistrationModalVisible] = useState(false);
  const [regCategory, setRegCategory] = useState('player_senior');
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regTaluk, setRegTaluk] = useState('Virudhunagar');
  const [regSpeciality, setRegSpeciality] = useState('Top Order Batter');
  const [regMobile, setRegMobile] = useState('');
  const [regTncaId, setRegTncaId] = useState('');
  const [regAgreed, setRegAgreed] = useState(true);

  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImgKey, setLightboxImgKey] = useState('stadium');
  const [lightboxCaption, setLightboxCaption] = useState('');
  const [activeNewsArticle, setActiveNewsArticle] = useState(null);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('Player Registration & Verification');
  const [contactMessage, setContactMessage] = useState('');

  const scrollViewRef = useRef(null);
  const sectionPositions = useRef({});

  const isDark = themeMode === 'dark';

  const toggleTheme = () => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const cycleFloodlightMode = () => {
    setFloodlightMode((prev) => (prev === 'on' ? 'warm' : prev === 'warm' ? 'off' : 'on'));
  };

  const openScorecard = (matchId) => {
    setCurrentScorecardId(matchId);
    setModalTab('summary');
    setScorecardModalVisible(true);
  };

  const openRegistration = (prefCategory = 'player_senior') => {
    setRegCategory(prefCategory);
    setRegistrationModalVisible(true);
    setMobileMenuOpen(false);
  };

  const openLightbox = (imgKey, caption) => {
    setLightboxImgKey(imgKey);
    setLightboxCaption(caption);
    setLightboxVisible(true);
  };

  const openNews = (newsId) => {
    const article = NEWS_ARTICLES.find((a) => a.id === newsId);
    if (article) setActiveNewsArticle(article);
  };

  const handleRegSubmit = () => {
    if (!regName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    if (!regMobile.trim()) {
      Alert.alert('Required Field', 'Please enter your Contact Mobile number.');
      return;
    }
    if (!regAgreed) {
      Alert.alert('Required', 'Please accept the declaration to proceed.');
      return;
    }
    const token = 'CFVD-' + Math.floor(100000 + Math.random() * 900000);
    const catObj = REGISTRATION_TYPES.find((t) => t.value === regCategory);
    const catTitle = catObj ? catObj.label : regCategory;

    Alert.alert(
      '✓ Application Submitted Successfully',
      `Candidate: ${regName}\nCategory: ${catTitle}\nApplication Reference ID: ${token}\n\nPlease save this Reference ID for verification.`,
      [{ text: 'OK', onPress: () => { setRegistrationModalVisible(false); setRegName(''); setRegMobile(''); } }]
    );
  };

  const handleContactSubmit = () => {
    if (!contactName.trim() || !contactMessage.trim()) {
      Alert.alert('Required', 'Please enter your Name and Message.');
      return;
    }
    Alert.alert(
      '✓ Message Logged',
      `Thank you ${contactName}! Your communication has been logged with the CFVD Secretariat.`,
      [{ text: 'OK', onPress: () => { setContactName(''); setContactEmail(''); setContactMessage(''); } }]
    );
  };

  const scrollToSection = (sectionKey) => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    const y = sectionPositions.current[sectionKey];
    if (y !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, y - 60), animated: true });
    }
  };

  const onLayoutSection = (key, event) => {
    sectionPositions.current[key] = event.nativeEvent.layout.y;
  };

  const filteredMatches = MATCHES_DATA.filter((m) => {
    if (matchCategory === 'all') return true;
    return m.category === matchCategory;
  });

  const activePointsTable = TABLE_DATA_SETS[activeTableKey] || TABLE_DATA_SETS.div1;
  const activeScorecard = SCORECARD_DETAILS[currentScorecardId] || SCORECARD_DETAILS['match-1'];

  const colors = {
    bgDark: isDark ? '#020612' : '#f6f2e9',
    bgCard: isDark ? 'rgba(10, 24, 56, 0.92)' : '#ffffff',
    bgCardHover: isDark ? 'rgba(15, 36, 82, 0.95)' : '#ffffff',
    bgGlass: isDark ? 'rgba(5, 13, 34, 0.92)' : 'rgba(255, 255, 255, 0.96)',
    textWhite: isDark ? '#ffffff' : '#06112c',
    textLight: isDark ? '#e6edf8' : '#162646',
    textMuted: isDark ? '#9bb0cf' : '#495e80',
    goldPrimary: isDark ? '#d4af37' : '#b8860b',
    goldBorder: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(184, 134, 11, 0.35)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    cricketRed: '#9e182b',
    cricketGreen: '#15803d',
    navyAbyss: isDark ? '#020612' : '#f6f2e8',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020612" />

      {/* ========================================================================= */}
      {/* MODE 1: EXACT 1:1 CARBON-COPY HTML/CSS/JS ENGINE (DEFAULT)               */}
      {/* Renders the EXACT same UI, fonts, floodlights, keyframes, and layout     */}
      {/* ========================================================================= */}
      {viewMode === 'exact' ? (
        <View style={styles.exactWebContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={INLINED_HTML}
              style={styles.webIframe}
              title="Cricket Federation of Virudhunagar District - Official Portal"
            />
          ) : NativeWebView ? (
            <NativeWebView
              source={{ html: INLINED_HTML }}
              style={styles.nativeWebView}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
              allowsInlineMediaPlayback={true}
            />
          ) : (
            <View style={styles.fallbackCenter}>
              <Text style={{ color: '#FFF' }}>Loading Official Cricket Portal...</Text>
            </View>
          )}
        </View>
      ) : (
        /* ======================================================================= */
        /* MODE 2: PURE NATIVE REACT NATIVE VIEW IMPLEMENTATION                   */
        /* ======================================================================= */
        <View style={[styles.nativeContainer, { backgroundColor: colors.bgDark }]}>
          {/* Site Background */}
          <View style={styles.tncaSiteBackground} pointerEvents="none">
            <Image
              source={localAssets.stadium}
              style={[styles.tncaBgStadium, { opacity: isDark ? 0.35 : 0.12 }]}
              resizeMode="cover"
            />
            <View style={[styles.tncaBgOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 18, 0.88)' : 'rgba(246, 242, 233, 0.92)' }]} />
            <View style={styles.tncaBgWatermark}>
              <Image source={localAssets.logo} style={[styles.tncaWatermarkCrest, { opacity: isDark ? 0.16 : 0.10 }]} resizeMode="contain" />
            </View>
          </View>

          {/* Header */}
          <View style={[styles.mainHeader, { backgroundColor: colors.bgGlass, borderBottomColor: colors.goldBorder }]}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.brandBlock} onPress={() => scrollToSection('hero')} activeOpacity={0.8}>
                <View style={styles.brandLogoFrame}>
                  <Image source={localAssets.logo} style={styles.brandLogoImg} resizeMode="contain" />
                </View>
                <View style={styles.brandText}>
                  <Text style={[styles.nameMain, { color: colors.textWhite }]}>CRICKET FEDERATION</Text>
                  <Text style={[styles.nameSub, { color: colors.goldPrimary }]}>OF VIRUDHUNAGAR DISTRICT</Text>
                  <View style={styles.associationSubline}>
                    <MaterialCommunityIcons name="certificate" size={11} color={colors.goldPrimary} />
                    <Text style={[styles.associationAffiliation, { color: colors.textMuted }]}>Affiliated to TNCA</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.btn, styles.btnGold, styles.btnSm]} onPress={() => openRegistration('player_senior')}>
                  <FontAwesome5 name="id-card" size={11} color="#000" />
                  <Text style={styles.btnGoldText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.themeBtn, { borderColor: colors.borderLight }]} onPress={toggleTheme}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={14} color={isDark ? colors.goldPrimary : '#F59E0B'} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.mobileToggle, { borderColor: colors.goldBorder }]} onPress={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={18} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Marquee Ticker */}
          <View style={[styles.marqueeTickerBar, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderLight }]}>
            <View style={styles.livePulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.livePulseText}>LIVE TICKER</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={[styles.tickerSpan, { color: colors.textWhite }]}>
                🏆 <Text style={{ fontWeight: '800' }}>VPL 2026 Final:</Text> Virudhunagar Strikers 164/5 (18.2 ov) vs Sivakasi Super Kings 162/8 — Need 2 runs in 4 balls
              </Text>
            </ScrollView>
          </View>

          {/* Continuous Scroll View */}
          <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Hero */}
            <View style={styles.heroSection} onLayout={(e) => onLayoutSection('hero', e)}>
              <View style={styles.heroPretitle}>
                <View style={[styles.goldPill, { borderColor: colors.goldPrimary }]}>
                  <Text style={[styles.goldPillText, { color: colors.goldPrimary }]}>OFFICIAL DISTRICT BODY</Text>
                </View>
                <View style={styles.tncaTagLight}>
                  <Text style={styles.tncaTagLightText}>AFFILIATED TO TNCA</Text>
                </View>
              </View>
              <Text style={styles.heroTitlePrefix}>Cricket Federation of</Text>
              <Text style={[styles.heroTitleMain, { color: colors.goldPrimary }]}>Virudhunagar District</Text>
              <View style={styles.emblemMottoRibbon}>
                <Text style={styles.ribbonText}>Enjoy the game and chase your dreams</Text>
              </View>
              <Text style={[styles.heroDescription, { color: colors.textLight }]}>
                Governing, developing, and fostering grassroots and competitive cricket across Srivilliputhur, Sivakasi, Rajapalayam, Sattur, Aruppukottai, and Virudhunagar under the guidance of Tamil Nadu Cricket Association.
              </Text>
              <View style={styles.heroCtaGroup}>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.btnLg]} onPress={() => scrollToSection('match-centre')}>
                  <Text style={styles.btnPrimaryText}>Match Centre Live</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutlineGold, styles.btnLg]} onPress={() => scrollToSection('tournaments')}>
                  <Text style={[styles.btnOutlineGoldText, { color: colors.goldPrimary }]}>View Leagues</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Strip */}
            <View style={styles.quickStrip}>
              <View style={styles.quickGrid}>
                <TouchableOpacity style={[styles.quickCard, { backgroundColor: colors.bgCard, borderColor: colors.goldBorder }]} onPress={() => scrollToSection('match-centre')}>
                  <Text style={[styles.quickTitle, { color: colors.textWhite }]}>Match Centre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickCard, { backgroundColor: colors.bgCard, borderColor: colors.goldBorder }]} onPress={() => scrollToSection('points-table')}>
                  <Text style={[styles.quickTitle, { color: colors.textWhite }]}>League Standings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Match Centre */}
            <View style={styles.section} onLayout={(e) => onLayoutSection('match-centre', e)}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Official Matches, Fixtures & Results</Text>
              </View>
              <View style={styles.matchesGrid}>
                {filteredMatches.map((m) => (
                  <View key={m.id} style={[styles.matchCard, { backgroundColor: colors.bgCard, borderColor: colors.goldBorder }]}>
                    <Text style={{ color: colors.goldPrimary, fontWeight: '800' }}>{m.tournament}</Text>
                    <Text style={{ color: colors.textWhite, fontSize: 14, fontWeight: '800', marginTop: 4 }}>
                      {m.team1.name} {m.team1.score} vs {m.team2.name} {m.team2.score}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{m.statusNote}</Text>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.btnSm, { marginTop: 8 }]} onPress={() => openScorecard(m.id)}>
                      <Text style={styles.btnPrimaryText}>View Scorecard</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Points Table */}
            <View style={styles.section} onLayout={(e) => onLayoutSection('points-table', e)}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Official League Points Table</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ backgroundColor: colors.bgCard, padding: 10, borderRadius: 8 }}>
                  {activePointsTable.map((row) => (
                    <Text key={row.pos} style={{ color: colors.textWhite, paddingVertical: 4 }}>
                      {row.pos}. {row.name} - P:{row.p} W:{row.w} L:{row.l} PTS:{row.pts} NRR:{row.nrr}
                    </Text>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ========================================================================= */}
      {/* FLOATING CONTROL BAR: TOGGLE EXACT WEB COPY VS NATIVE CODE               */}
      {/* ========================================================================= */}
      {showModeSwitcher && (
        <View style={styles.floatingSwitcher}>
          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'exact' && styles.switcherTabActive]}
            onPress={() => setViewMode('exact')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="web" size={13} color={viewMode === 'exact' ? '#000' : '#FFF'} />
            <Text style={[styles.switcherText, { color: viewMode === 'exact' ? '#000' : '#FFF' }]}>
              Exact HTML/CSS/JS (1:1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'native' && styles.switcherTabActive]}
            onPress={() => setViewMode('native')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="react" size={13} color={viewMode === 'native' ? '#000' : '#FFF'} />
            <Text style={[styles.switcherText, { color: viewMode === 'native' ? '#000' : '#FFF' }]}>
              Native RN Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeSwitcherBtn}
            onPress={() => setShowModeSwitcher(false)}
            title="Minimize"
          >
            <Ionicons name="close-circle" size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020612',
  },
  exactWebContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#020612',
  },
  webIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#020612',
  },
  nativeWebView: {
    flex: 1,
    backgroundColor: '#020612',
  },
  fallbackCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeContainer: {
    flex: 1,
  },
  floatingSwitcher: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 13, 34, 0.95)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 24,
    padding: 4,
    gap: 4,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  switcherTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  switcherTabActive: {
    backgroundColor: '#D4AF37',
  },
  switcherText: {
    fontSize: 11,
    fontWeight: '800',
  },
  closeSwitcherBtn: {
    paddingHorizontal: 4,
  },

  /* Native Styles */
  tncaSiteBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  tncaBgStadium: {
    width: '100%',
    height: '100%',
  },
  tncaBgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tncaBgWatermark: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -130,
    width: 260,
    height: 260,
  },
  tncaWatermarkCrest: {
    width: '100%',
    height: '100%',
  },
  mainHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandLogoFrame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#070D1E',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandLogoImg: {
    width: 34,
    height: 34,
  },
  brandText: {
    flex: 1,
  },
  nameMain: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  nameSub: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  associationSubline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  associationAffiliation: {
    fontSize: 9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  themeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileToggle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marqueeTickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 6,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  livePulseText: {
    color: '#EF4444',
    fontSize: 8,
    fontWeight: '900',
  },
  tickerSpan: {
    fontSize: 11,
  },
  heroSection: {
    padding: 14,
  },
  heroPretitle: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
  },
  goldPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goldPillText: {
    fontSize: 8,
    fontWeight: '900',
  },
  tncaTagLight: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tncaTagLightText: {
    color: '#93C5FD',
    fontSize: 8,
    fontWeight: '800',
  },
  heroTitlePrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  heroTitleMain: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  emblemMottoRibbon: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
  ribbonText: {
    color: '#000',
    fontSize: 10.5,
    fontWeight: '900',
  },
  heroDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    marginVertical: 8,
  },
  heroCtaGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  quickStrip: {
    paddingHorizontal: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    padding: 14,
  },
  sectionHead: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  matchesGrid: {
    gap: 8,
  },
  matchCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 6,
  },
  btnSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnLg: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnPrimary: {
    backgroundColor: '#D4AF37',
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  btnGold: {
    backgroundColor: '#D4AF37',
  },
  btnGoldText: {
    color: '#000',
    fontSize: 10.5,
    fontWeight: '800',
  },
  btnOutlineGold: {
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  btnOutlineGoldText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
