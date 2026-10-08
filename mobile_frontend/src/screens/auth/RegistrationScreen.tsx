import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useAppNavigation } from '../../navigation/AppNavigator';
import SharedBackground from '../../components/scorer/SharedBackground';
import { ScorerApi } from '../../services/api';

export type RegistrationRole = 'PLAYER' | 'TEAM' | 'SCORER';

export interface SquadPlayer {
  id: string;
  name: string;
  email: string;
  role: string;
}

const COMMON_ROLES = [
  'Captain',
  'Vice Captain',
  'Wicket Keeper',
  'Batter',
  'Bowler',
  'All-Rounder'
];

const PLAYER_ROLES = ['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const AGE_CATEGORIES = ['Senior Men', "Women's Senior", 'Under-23', 'Under-19', 'Under-16', 'Under-14'];
const BATTING_STYLES = ['Right Hand Bat', 'Left Hand Bat'];
const BOWLING_STYLES = ['Right Arm Fast/Medium', 'Right Arm Spin', 'Left Arm Orthodox', 'Left Arm Fast'];
const TALUKS = ['Virudhunagar', 'Sivakasi', 'Rajapalayam', 'Srivilliputhur', 'Aruppukottai', 'Sattur', 'Watrap'];
const SCORER_LEVELS = ['District Certified', 'State Panel', 'Club Scorer', 'Trainee Scorer'];

const SAMPLE_15_SQUAD: Array<{ name: string; email: string; role: string }> = [
  { name: 'R. Saravanan', email: 'saravanan.r@strikerscc.org', role: 'Captain' },
  { name: 'S. Karthik', email: 'karthik.s@strikerscc.org', role: 'Vice Captain' },
  { name: 'K. Murugan', email: 'murugan.k@strikerscc.org', role: 'Wicket Keeper' },
  { name: 'V. Vignesh', email: 'vignesh.v@strikerscc.org', role: 'Bowler' },
  { name: 'M. Ashwin Kumar', email: 'ashwin.k@strikerscc.org', role: 'All-Rounder' },
  { name: 'P. Vijay Anand', email: 'vijay.a@strikerscc.org', role: 'Batter' },
  { name: 'B. Dinesh Babu', email: 'dinesh.b@strikerscc.org', role: 'Batter' },
  { name: 'T. Praveen Raj', email: 'praveen.r@strikerscc.org', role: 'Bowler' },
  { name: 'A. Suresh Kumar', email: 'suresh.k@strikerscc.org', role: 'Bowler' },
  { name: 'N. Bala Murugan', email: 'bala.m@strikerscc.org', role: 'Bowler' },
  { name: 'G. Arun Pandian', email: 'arun.p@strikerscc.org', role: 'Batter' },
  { name: 'C. Manikandan', email: 'manikandan.c@strikerscc.org', role: 'All-Rounder' },
  { name: 'E. Gokul Nath', email: 'gokul.n@strikerscc.org', role: 'Bowler' },
  { name: 'L. Selva Ganesh', email: 'selva.g@strikerscc.org', role: 'Batter' },
  { name: 'D. Rajesh', email: 'rajesh.d@strikerscc.org', role: 'Wicket Keeper' }
];

export default function RegistrationScreen() {
  const { navigate, goBack, params } = useAppNavigation();

  const getInitialRole = (): RegistrationRole => {
    const r = (params?.initialRole as string)?.toUpperCase();
    if (r === 'PLAYER') return 'PLAYER';
    if (r === 'TEAM' || r === 'COACH') return 'TEAM';
    if (r === 'SCORER') return 'SCORER';
    return 'PLAYER';
  };

  const [activeRole, setActiveRole] = useState<RegistrationRole>(getInitialRole());

  // Global loading and status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | null>(null);

  // -------------------------------------------------------------
  // 1. PLAYER REGISTRATION STATE (PDF Module 2)
  // -------------------------------------------------------------
  const [pName, setPName] = useState<string>('');
  const [pEmail, setPEmail] = useState<string>('');
  const [pMobile, setPMobile] = useState<string>('');
  const [pRole, setPRole] = useState<string>('Batter');
  const [pCategory, setPCategory] = useState<string>('Senior Men');
  const [pTaluk, setPTaluk] = useState<string>('Virudhunagar');
  const [pBattingStyle, setPBattingStyle] = useState<string>('Right Hand Bat');
  const [pBowlingStyle, setPBowlingStyle] = useState<string>('Right Arm Fast/Medium');
  const [pClub, setPClub] = useState<string>('');
  const [pAgreed, setPAgreed] = useState<boolean>(true);

  // -------------------------------------------------------------
  // 2. TEAM REGISTRATION STATE (PDF Module 3)
  // -------------------------------------------------------------
  const [teamName, setTeamName] = useState<string>('');
  const [coachName, setCoachName] = useState<string>('');
  const [coachEmail, setCoachEmail] = useState<string>('');
  const [teamTaluk, setTeamTaluk] = useState<string>('Virudhunagar');
  const [squadPlayerName, setSquadPlayerName] = useState<string>('');
  const [squadPlayerEmail, setSquadPlayerEmail] = useState<string>('');
  const [squadPlayerRole, setSquadPlayerRole] = useState<string>('Batter');
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [teamAgreed, setTeamAgreed] = useState<boolean>(true);

  // -------------------------------------------------------------
  // 3. SCORER REGISTRATION STATE (PDF Module 5 & 10)
  // -------------------------------------------------------------
  const [sName, setSName] = useState<string>('');
  const [sEmail, setSEmail] = useState<string>('');
  const [sMobile, setSMobile] = useState<string>('');
  const [sTaluk, setSTaluk] = useState<string>('Virudhunagar');
  const [sLevel, setSLevel] = useState<string>('District Certified');
  const [sPin, setSPin] = useState<string>('1234');
  const [sAgreed, setSAgreed] = useState<boolean>(true);

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const switchRole = (role: RegistrationRole) => {
    setActiveRole(role);
    setStatusMessage(null);
    setStatusType(null);
  };

  // =============================================================
  // SUBMISSION HANDLERS
  // =============================================================

  // 1. Submit Player Registration
  const handlePlayerSubmit = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const name = pName.trim();
    const email = pEmail.trim().toLowerCase();
    const mobile = pMobile.trim();

    if (!name) {
      setStatusMessage('Please enter Player Full Name.');
      setStatusType('error');
      return;
    }
    if (!email || !validateEmail(email)) {
      setStatusMessage('Please enter a valid Player Email address.');
      setStatusType('error');
      return;
    }
    if (!mobile || mobile.length < 10) {
      setStatusMessage('Please enter a valid 10-digit Mobile Number.');
      setStatusType('error');
      return;
    }
    if (!pAgreed) {
      setStatusMessage('Please accept the declaration to submit player registration.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Submitting Player Registration to CFVD Secretariat...');
    setStatusType('info');

    try {
      const resp = await ScorerApi.registerPlayer({
        name,
        email,
        mobile,
        role: pRole,
        category: pCategory,
        taluk: pTaluk,
        battingStyle: pBattingStyle,
        bowlingStyle: pBowlingStyle,
        clubChoice: pClub.trim() || undefined
      });

      setIsLoading(false);
      setStatusMessage(resp?.message || '✓ Player Registration Submitted! Awaiting Admin Approval.');
      setStatusType('success');

      const alertMsg =
        `Player Name: ${name}\n` +
        `Email: ${email}\n` +
        `Role: ${pRole}\n` +
        `Category: ${pCategory}\n` +
        `Status: PENDING ADMIN APPROVAL\n\n` +
        `Notification dispatched to Association Secretariat. Once verified by the administrator, you can log in to the Player Portal via Nodemailer OTP.`;

      if (Platform.OS === 'web') {
        alert(`✓ Player Registration Submitted Successfully!\n\n${alertMsg}`);
      } else {
        Alert.alert('Registration Submitted', alertMsg);
      }
      setTimeout(() => navigate('Login', { initialRole: 'PLAYER' }), 1200);
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage(err?.message || 'Player registration failed. Please try again.');
      setStatusType('error');
    }
  };

  // 2. Team Squad Helpers & Submission
  const handleAddPlayer = () => {
    setStatusMessage(null);
    setStatusType(null);

    const name = squadPlayerName.trim();
    const email = squadPlayerEmail.trim().toLowerCase();
    const role = squadPlayerRole.trim() || 'Player';

    if (!name) {
      setStatusMessage('Please enter Player Name.');
      setStatusType('error');
      return;
    }

    if (!email || !validateEmail(email)) {
      setStatusMessage('Please enter a valid Player Email ID (e.g. player@team.org).');
      setStatusType('error');
      return;
    }

    if (coachEmail.trim() && email === coachEmail.trim().toLowerCase()) {
      setStatusMessage(`Player email "${email}" cannot be identical to Coach Email.`);
      setStatusType('error');
      return;
    }

    if (players.some((p) => p.email.toLowerCase() === email)) {
      setStatusMessage(`A player with email "${email}" has already been added to the squad.`);
      setStatusType('error');
      return;
    }

    if (players.length >= 15) {
      setStatusMessage('Squad roster is already full with 15 players. Remove a player to add a new one.');
      setStatusType('error');
      return;
    }

    const newPlayer: SquadPlayer = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name,
      email,
      role
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setSquadPlayerName('');
    setSquadPlayerEmail('');

    const newCount = players.length + 1;
    if (newCount === 15) {
      setStatusMessage('✓ All 15 squad players successfully added! You can now submit registration.');
      setStatusType('success');
    } else {
      setStatusMessage(`✓ Added ${name} (${role}) to squad! (${newCount}/15 players added)`);
      setStatusType('info');
    }
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setStatusMessage('Player removed from squad list.');
    setStatusType('info');
  };

  const handleAutoFillSampleSquad = () => {
    if (!teamName.trim()) setTeamName('Virudhunagar Strikers Cricket Club');
    if (!coachName.trim()) setCoachName('S. Murugan (NIS Certified Coach)');
    if (!coachEmail.trim()) setCoachEmail('coach.murugan@strikerscc.org');

    const squad: SquadPlayer[] = SAMPLE_15_SQUAD.map((item, idx) => ({
      id: `sample-${idx + 1}-${Date.now()}`,
      name: item.name,
      email: item.email,
      role: item.role
    }));

    setPlayers(squad);
    setStatusMessage('⚡ Sample squad loaded! Coach details and all 15 squad players added.');
    setStatusType('success');
  };

  const handleClearAllPlayers = () => {
    setPlayers([]);
    setStatusMessage('All players cleared from squad list. Add 15 players to proceed.');
    setStatusType('info');
  };

  const handleTeamSubmit = async () => {
    setStatusMessage(null);
    setStatusType(null);

    if (!teamName.trim()) {
      setStatusMessage('Please enter Team Name.');
      setStatusType('error');
      return;
    }
    if (!coachName.trim()) {
      setStatusMessage('Please enter Coach Full Name.');
      setStatusType('error');
      return;
    }
    if (!coachEmail.trim() || !validateEmail(coachEmail)) {
      setStatusMessage('Please enter a valid Coach Email ID.');
      setStatusType('error');
      return;
    }
    if (players.length !== 15) {
      setStatusMessage(`Team registration requires exactly 15 squad players. Currently added: ${players.length}/15.`);
      setStatusType('error');
      return;
    }
    const cleanCoachEmail = coachEmail.trim().toLowerCase();
    const coachConflict = players.find((p) => p.email.toLowerCase() === cleanCoachEmail);
    if (coachConflict) {
      setStatusMessage(`Coach email "${cleanCoachEmail}" cannot be identical to player "${coachConflict.name}".`);
      setStatusType('error');
      return;
    }
    if (!teamAgreed) {
      setStatusMessage('Please accept the team declaration to proceed.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Registering Team and 15 Squad Players with CFVD Secretariat...');
    setStatusType('info');

    try {
      const resp = await ScorerApi.registerTeam({
        teamName: teamName.trim(),
        coachName: coachName.trim(),
        coachEmail: cleanCoachEmail,
        taluk: teamTaluk,
        players: players.map((p) => ({
          name: p.name,
          email: p.email,
          role: p.role
        }))
      });

      setIsLoading(false);
      setStatusMessage(`✓ Team "${teamName.trim()}" Submitted! Awaiting Admin Approval.`);
      setStatusType('success');

      const summaryMsg =
        `Team: ${teamName.trim()}\n` +
        `Coach: ${coachName.trim()} (${cleanCoachEmail})\n` +
        `Squad: 15/15 Players Registered\n` +
        `Status: PENDING ADMIN APPROVAL\n\n` +
        `Notification sent to Administrator. Once approved, players and coach can log in via Nodemailer OTP.`;

      if (Platform.OS === 'web') {
        alert(`✓ Team Registration Submitted Successfully!\n\n${summaryMsg}`);
      } else {
        Alert.alert('Team Registration Submitted', summaryMsg);
      }
      setTimeout(() => navigate('Login', { initialRole: 'TEAM' }), 1200);
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage(err?.message || 'Team registration failed.');
      setStatusType('error');
    }
  };

  // 3. Submit Scorer Registration
  const handleScorerSubmit = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const name = sName.trim();
    const email = sEmail.trim().toLowerCase();
    const mobile = sMobile.trim();

    if (!name) {
      setStatusMessage('Please enter Scorer Full Name.');
      setStatusType('error');
      return;
    }
    if (!email || !validateEmail(email)) {
      setStatusMessage('Please enter a valid Official Email address.');
      setStatusType('error');
      return;
    }
    if (!mobile || mobile.length < 10) {
      setStatusMessage('Please enter a valid 10-digit Mobile Number.');
      setStatusType('error');
      return;
    }
    if (!sAgreed) {
      setStatusMessage('Please accept the official scorer code of conduct.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Submitting Official Scorer Registration...');
    setStatusType('info');

    try {
      const resp = await ScorerApi.registerScorer({
        name,
        email,
        mobile,
        taluk: sTaluk,
        certificationLevel: sLevel,
        pin: sPin.trim() || '1234'
      });

      setIsLoading(false);
      setStatusMessage(resp?.message || '✓ Scorer Registration Submitted! Awaiting Admin Approval.');
      setStatusType('success');

      const alertMsg =
        `Scorer: ${name}\n` +
        `Email: ${email}\n` +
        `Level: ${sLevel}\n` +
        `Status: PENDING ADMIN APPROVAL\n\n` +
        `Your scorer credentials have been submitted for verification. Upon administrative clearance, you will be authorized to access live scoring consoles.`;

      if (Platform.OS === 'web') {
        alert(`✓ Scorer Registration Submitted!\n\n${alertMsg}`);
      } else {
        Alert.alert('Scorer Registration Submitted', alertMsg);
      }
      setTimeout(() => navigate('Login', { initialRole: 'SCORER' }), 1200);
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage(err?.message || 'Scorer registration failed.');
      setStatusType('error');
    }
  };



  return (
    <SharedBackground>
      <View style={styles.container}>
        {/* Header with Back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.cardContainer}>
            {/* Crest / Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.mainTitle}>CRICKET FEDERATION OF VIRUDHUNAGAR DISTRICT</Text>
              <Text style={styles.mainSubtitle}>OFFICIAL PORTAL</Text>
            </View>

            {/* Registration Card */}
            <View style={styles.card}>
              <Text style={styles.title}>
                {activeRole === 'PLAYER' && 'Official Player Registration'}
                {activeRole === 'TEAM' && 'Official Team & Squad Registration'}
                {activeRole === 'SCORER' && 'Official Scorer Registration'}
              </Text>
              <Text style={styles.subtitle}>
                {activeRole === 'PLAYER' && 'Register for official district trials, player profiling, and tournament squad allocation.'}
                {activeRole === 'TEAM' && 'Fill out your club information, coach contact, and add all 15 squad members to participate.'}
                {activeRole === 'SCORER' && 'Register as an official match scorer to access the ball-by-ball scoring console.'}
              </Text>

              {/* 3 Role Switcher Tabs */}
              <View style={styles.roleTabsContainer}>
                <TouchableOpacity
                  style={[styles.roleTab, activeRole === 'PLAYER' && styles.roleTabActive]}
                  onPress={() => switchRole('PLAYER')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleTabText, activeRole === 'PLAYER' && styles.roleTabTextActive]}>
                    Player
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleTab, activeRole === 'TEAM' && styles.roleTabActive]}
                  onPress={() => switchRole('TEAM')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleTabText, activeRole === 'TEAM' && styles.roleTabTextActive]}>
                    Team / Coach
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleTab, activeRole === 'SCORER' && styles.roleTabActive]}
                  onPress={() => switchRole('SCORER')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleTabText, activeRole === 'SCORER' && styles.roleTabTextActive]}>
                    Scorer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Status Banner */}
              {statusMessage && (
                <View
                  style={[
                    styles.statusBanner,
                    statusType === 'error' && styles.statusError,
                    statusType === 'success' && styles.statusSuccess,
                    statusType === 'info' && styles.statusInfo
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusType === 'error' && styles.statusTextError,
                      statusType === 'success' && styles.statusTextSuccess,
                      statusType === 'info' && styles.statusTextInfo
                    ]}
                  >
                    {statusMessage}
                  </Text>
                </View>
              )}

              {/* Section Header */}
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.sectionHeaderText}>
                  {activeRole === 'PLAYER' && 'PLAYER ENROLLMENT FORM (MODULE 2)'}
                  {activeRole === 'TEAM' && 'TEAM & 15-PLAYER SQUAD REGISTRATION (MODULE 3)'}
                  {activeRole === 'SCORER' && 'OFFICIAL MATCH SCORER ACCREDITATION (MODULE 5)'}
                </Text>
              </View>

              {/* ============================================================== */}
              {/* FORM 1: PLAYER REGISTRATION                                     */}
              {/* ============================================================== */}
              {activeRole === 'PLAYER' && (
                <>
                  <Text style={styles.label}>Full Name (as in Aadhaar / Birth Certificate) *</Text>
                  <TextInput
                    style={styles.input}
                    value={pName}
                    onChangeText={setPName}
                    placeholder="e.g. K. Praveen Kumar"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Registered Email (Identity Anchor for OTP Verification) *</Text>
                  <TextInput
                    style={styles.input}
                    value={pEmail}
                    onChangeText={setPEmail}
                    placeholder="e.g. praveen.k@gmail.com"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Text style={styles.label}>Mobile / Contact Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={pMobile}
                    onChangeText={setPMobile}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.label}>Age Category *</Text>
                  <View style={styles.roleChipsRow}>
                    {AGE_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.roleChip, pCategory === cat && styles.roleChipActive]}
                        onPress={() => setPCategory(cat)}
                      >
                        <Text style={[styles.roleChipText, pCategory === cat && styles.roleChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Primary Playing Role *</Text>
                  <View style={styles.roleChipsRow}>
                    {PLAYER_ROLES.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleChip, pRole === r && styles.roleChipActive]}
                        onPress={() => setPRole(r)}
                      >
                        <Text style={[styles.roleChipText, pRole === r && styles.roleChipTextActive]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Taluk / District Area *</Text>
                  <View style={styles.roleChipsRow}>
                    {TALUKS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.roleChip, pTaluk === t && styles.roleChipActive]}
                        onPress={() => setPTaluk(t)}
                      >
                        <Text style={[styles.roleChipText, pTaluk === t && styles.roleChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Batting Style</Text>
                  <View style={styles.roleChipsRow}>
                    {BATTING_STYLES.map((bs) => (
                      <TouchableOpacity
                        key={bs}
                        style={[styles.roleChip, pBattingStyle === bs && styles.roleChipActive]}
                        onPress={() => setPBattingStyle(bs)}
                      >
                        <Text style={[styles.roleChipText, pBattingStyle === bs && styles.roleChipTextActive]}>
                          {bs}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Bowling Style</Text>
                  <View style={styles.roleChipsRow}>
                    {BOWLING_STYLES.map((bw) => (
                      <TouchableOpacity
                        key={bw}
                        style={[styles.roleChip, pBowlingStyle === bw && styles.roleChipActive]}
                        onPress={() => setPBowlingStyle(bw)}
                      >
                        <Text style={[styles.roleChipText, pBowlingStyle === bw && styles.roleChipTextActive]}>
                          {bw}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Preferred Club / Team (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={pClub}
                    onChangeText={setPClub}
                    placeholder="e.g. Virudhunagar Strikers CC or Independent"
                    placeholderTextColor="#94a3b8"
                  />

                  {/* Declaration */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setPAgreed(!pAgreed)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, pAgreed && styles.checkboxChecked]}>
                      {pAgreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I certify that all details provided are authentic, accurate, and comply with TNCA & CFVD regulations.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handlePlayerSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Player Registration</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* ============================================================== */}
              {/* FORM 2: TEAM REGISTRATION (15 SQUAD PLAYERS)                    */}
              {/* ============================================================== */}
              {activeRole === 'TEAM' && (
                <>
                  <Text style={styles.label}>Club / Team Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={teamName}
                    onChangeText={setTeamName}
                    placeholder="e.g. Sivakasi Super Kings"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Coach / Team Manager Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={coachName}
                    onChangeText={setCoachName}
                    placeholder="e.g. K. Muthu (Coach)"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Coach Email ID (Identity Anchor) *</Text>
                  <TextInput
                    style={styles.input}
                    value={coachEmail}
                    onChangeText={setCoachEmail}
                    placeholder="e.g. coach.muthu@strikerscc.org"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Text style={styles.label}>Taluk / Area *</Text>
                  <View style={styles.roleChipsRow}>
                    {TALUKS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.roleChip, teamTaluk === t && styles.roleChipActive]}
                        onPress={() => setTeamTaluk(t)}
                      >
                        <Text style={[styles.roleChipText, teamTaluk === t && styles.roleChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Squad Section Header & Counter */}
                  <View style={styles.squadTitleRow}>
                    <Text style={styles.label}>Squad Members (15 Required)</Text>
                    <View
                      style={[
                        styles.squadCounterBadge,
                        players.length === 15 ? styles.squadCounterComplete : styles.squadCounterIncomplete
                      ]}
                    >
                      <Text
                        style={[
                          styles.squadCounterText,
                          players.length === 15
                            ? styles.squadCounterTextComplete
                            : styles.squadCounterTextIncomplete
                        ]}
                      >
                        {players.length} / 15 Added
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, (players.length / 15) * 100)}%`,
                          backgroundColor: players.length === 15 ? '#16a34a' : '#eab308'
                        }
                      ]}
                    />
                  </View>

                  {/* 3-Field Squad Input Box */}
                  <View style={styles.playerInputFormBox}>
                    <Text style={styles.fieldLabel}>Player Full Name *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={squadPlayerName}
                      onChangeText={setSquadPlayerName}
                      placeholder="e.g. R. Saravanan"
                      placeholderTextColor="#94a3b8"
                    />

                    <Text style={styles.fieldLabel}>Player Email (For OTP Login upon Approval) *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={squadPlayerEmail}
                      onChangeText={setSquadPlayerEmail}
                      placeholder="e.g. saravanan.r@strikerscc.org"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />

                    <Text style={styles.fieldLabel}>Playing Role *</Text>
                    <View style={styles.roleChipsRow}>
                      {COMMON_ROLES.map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.roleChip, squadPlayerRole === r && styles.roleChipActive]}
                          onPress={() => setSquadPlayerRole(r)}
                        >
                          <Text
                            style={[
                              styles.roleChipText,
                              squadPlayerRole === r && styles.roleChipTextActive
                            ]}
                          >
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.addPlayerBtn, players.length >= 15 && styles.addPlayerBtnDisabled]}
                      onPress={handleAddPlayer}
                      disabled={players.length >= 15}
                    >
                      <Text style={styles.addPlayerBtnText}>
                        {players.length >= 15 ? '✓ Squad Roster Full (15/15)' : '+ Add Player to Squad'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Action Buttons */}
                  <View style={styles.quickActionsRow}>
                    <TouchableOpacity
                      style={styles.autoFillBtn}
                      onPress={handleAutoFillSampleSquad}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.autoFillBtnText}>⚡ Quick Add 15 Sample Players</Text>
                    </TouchableOpacity>

                    {players.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={handleClearAllPlayers}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.clearBtnText}>Clear List</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Added Players List */}
                  {players.length > 0 && (
                    <View style={styles.playersListWrap}>
                      {players.map((item, index) => (
                        <View key={item.id} style={styles.playerListItem}>
                          <View style={styles.playerIndexCircle}>
                            <Text style={styles.playerIndexNumber}>#{index + 1}</Text>
                          </View>
                          <View style={styles.playerItemDetails}>
                            <View style={styles.playerNameRoleRow}>
                              <Text style={styles.playerItemName}>{item.name}</Text>
                              <View style={styles.playerItemRoleBadge}>
                                <Text style={styles.playerItemRoleText}>{item.role}</Text>
                              </View>
                            </View>
                            <Text style={styles.playerItemEmail}>{item.email}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemovePlayer(item.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.removeBtnText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Team Declaration */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setTeamAgreed(!teamAgreed)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, teamAgreed && styles.checkboxChecked]}>
                      {teamAgreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I confirm that all 15 squad players and coach details are authentic, verified, and comply with TNCA & CFVD regulations.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, players.length !== 15 && styles.submitBtnDisabled]}
                    onPress={handleTeamSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {players.length === 15
                          ? 'Submit Team Registration (15 Players)'
                          : `Add 15 Players to Submit (${players.length}/15 added)`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* ============================================================== */}
              {/* FORM 3: OFFICIAL SCORER REGISTRATION                            */}
              {/* ============================================================== */}
              {activeRole === 'SCORER' && (
                <>
                  <Text style={styles.label}>Official Scorer Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={sName}
                    onChangeText={setSName}
                    placeholder="e.g. Ramesh Sundaram"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Official Email (For Nodemailer OTP Scoring Sign In) *</Text>
                  <TextInput
                    style={styles.input}
                    value={sEmail}
                    onChangeText={setSEmail}
                    placeholder="e.g. scorer.ramesh@cfvd.org"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Text style={styles.label}>Mobile / Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={sMobile}
                    onChangeText={setSMobile}
                    placeholder="e.g. 9443215678"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.label}>Certification / Experience Level *</Text>
                  <View style={styles.roleChipsRow}>
                    {SCORER_LEVELS.map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.roleChip, sLevel === lvl && styles.roleChipActive]}
                        onPress={() => setSLevel(lvl)}
                      >
                        <Text style={[styles.roleChipText, sLevel === lvl && styles.roleChipTextActive]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Home Taluk / Preferred Venue *</Text>
                  <View style={styles.roleChipsRow}>
                    {TALUKS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.roleChip, sTaluk === t && styles.roleChipActive]}
                        onPress={() => setSTaluk(t)}
                      >
                        <Text style={[styles.roleChipText, sTaluk === t && styles.roleChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Preferred 4-Digit Scoring PIN</Text>
                  <TextInput
                    style={styles.input}
                    value={sPin}
                    onChangeText={setSPin}
                    placeholder="Default: 1234"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setSAgreed(!sAgreed)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, sAgreed && styles.checkboxChecked]}>
                      {sAgreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I agree to maintain impartial, accurate ball-by-ball match scoring complying with official TNCA regulations.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleScorerSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Scorer Registration</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}



              {/* Link to Login */}
              <View style={styles.loginPromptRow}>
                <Text style={styles.promptNormalText}>Already registered? </Text>
                <TouchableOpacity
                  onPress={() => navigate('Login', { initialRole: activeRole })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLinkText}>Login to Portal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SharedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', width: '100%' },
  header: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  backBtn: { alignSelf: 'flex-start', padding: 8, paddingLeft: 0 },
  backText: { color: '#eab308', fontSize: 16, fontWeight: 'bold' },
  scroll: { flexGrow: 1, width: '100%' },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
    width: '100%'
  },
  logoContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logo: { width: 75, height: 75, marginBottom: 8 },
  mainTitle: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  mainSubtitle: { color: '#b45309', fontSize: 21, fontWeight: '900', letterSpacing: 1 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 580,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  title: { color: '#1e293b', fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 13, marginBottom: 20, textAlign: 'center', lineHeight: 18 },

  statusBanner: { padding: 12, borderRadius: 6, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  statusSuccess: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  statusInfo: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  statusText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  statusTextError: { color: '#b91c1c' },
  statusTextSuccess: { color: '#15803d' },
  statusTextInfo: { color: '#1d4ed8' },

  sectionHeaderBox: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 14,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#eab308'
  },
  sectionHeaderText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3
  },

  roleTabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center'
  },
  roleTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  roleTabActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b'
  },
  roleTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  roleTabTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },

  label: { color: '#334155', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 14.5
  },

  squadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  squadCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  squadCounterIncomplete: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#ca8a04'
  },
  squadCounterComplete: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderColor: '#16a34a'
  },
  squadCounterText: {
    fontSize: 11.5,
    fontWeight: '800'
  },
  squadCounterTextIncomplete: { color: '#b45309' },
  squadCounterTextComplete: { color: '#15803d' },

  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },

  playerInputFormBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 4
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
    fontSize: 13.5,
    marginBottom: 10
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
    marginTop: 2
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  roleChipActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b'
  },
  roleChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569'
  },
  roleChipTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  addPlayerBtn: {
    backgroundColor: '#eab308',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3
  },
  addPlayerBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  addPlayerBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13.5,
    letterSpacing: 0.3
  },

  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  autoFillBtn: {
    flex: 1,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  autoFillBtnText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800'
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  clearBtnText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700'
  },

  playersListWrap: {
    marginBottom: 16,
    gap: 8
  },
  playerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    gap: 10
  },
  playerIndexCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playerIndexNumber: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900'
  },
  playerItemDetails: {
    flex: 1
  },
  playerNameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  playerItemName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a'
  },
  playerItemRoleBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  playerItemRoleText: {
    color: '#92400e',
    fontSize: 10.5,
    fontWeight: '800'
  },
  playerItemEmail: {
    fontSize: 12,
    color: '#64748b'
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '900'
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  checkboxChecked: {
    backgroundColor: '#eab308',
    borderColor: '#ca8a04'
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17
  },

  submitBtn: {
    backgroundColor: '#eab308',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  submitBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  loginPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  promptNormalText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '400'
  },
  loginLinkText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline'
  }
});
