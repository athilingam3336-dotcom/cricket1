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
import { ScorerApi, TeamApi } from '../../services/api';

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



export default function RegistrationScreen() {
  const { navigate } = useAppNavigation();

  // Team & Coach Fields
  const [teamName, setTeamName] = useState<string>('');
  const [coachName, setCoachName] = useState<string>('');
  const [coachEmail, setCoachEmail] = useState<string>('');

  // 3 Fields for adding each player
  const [playerName, setPlayerName] = useState<string>('');
  const [playerEmail, setPlayerEmail] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<string>('Batter');

  // List of added players (Must contain 15 players to submit)
  const [players, setPlayers] = useState<SquadPlayer[]>([]);

  // Feedback & Status
  const [agreed, setAgreed] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | null>(null);
  // Success Confirmation Modal State
  const [successData, setSuccessData] = useState<{
    teamId: string;
    teamName: string;
    coachName: string;
    coachEmail: string;
    passkey: string;
  } | null>(null);


  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Add a single player using the 3 fields
  const handleAddPlayer = () => {
    setStatusMessage(null);
    setStatusType(null);

    const name = playerName.trim();
    const email = playerEmail.trim().toLowerCase();
    const role = playerRole.trim() || 'Player';

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

    // Check if player email is already in the list
    if (players.some((p) => p.email.toLowerCase() === email)) {
      setStatusMessage(`A player with email "${email}" has already been added to the squad.`);
      setStatusType('error');
      return;
    }

    // Check maximum 15 players limit
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
    setPlayerName('');
    setPlayerEmail('');

    const newCount = players.length + 1;
    if (newCount === 15) {
      setStatusMessage('✓ All 15 squad players successfully added! You can now submit registration.');
      setStatusType('success');
    } else {
      setStatusMessage(`✓ Added ${name} (${role}) to squad! (${newCount}/15 players added)`);
      setStatusType('info');
    }
  };

  // Remove player from the list
  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setStatusMessage('Player removed from squad list.');
    setStatusType('info');
  };

  // 1-Click Auto-Fill 15 Sample Players
  

  // Clear all added players
  const handleClearAllPlayers = () => {
    setPlayers([]);
    setStatusMessage('All players cleared from squad list. Add 15 players to proceed.');
    setStatusType('info');
  };

  // Submit Final Team Registration
  const handleSubmit = async () => {
    setStatusMessage(null);
    setStatusType(null);

    const cleanTeam = teamName.trim();
    const cleanCoach = coachName.trim();
    const cleanEmail = coachEmail.trim().toLowerCase();

    if (!cleanTeam) {
      setStatusMessage('Please enter the Official Team Name.');
      setStatusType('error');
      return;
    }

    if (!cleanCoach) {
      setStatusMessage('Please enter the Coach Full Name.');
      setStatusType('error');
      return;
    }

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setStatusMessage('Please enter a valid Coach Email address (e.g. coach@example.com).');
      setStatusType('error');
      return;
    }

    if (players.length !== 15) {
      setStatusMessage(`Exactly 15 players are required. Currently added: ${players.length}/15.`);
      setStatusType('error');
      return;
    }

    if (!agreed) {
      setStatusMessage('Please agree to the District Cricket Federation Team Registration Terms & Conditions.');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Submitting 15-player team registration to database...');
    setStatusType('info');

    try {
      const res = await TeamApi.registerTeam({
        teamName: cleanTeam,
        coachName: cleanCoach,
        coachEmail: cleanEmail,
        players: players.map(p => ({
          name: p.name.trim(),
          email: p.email.trim().toLowerCase(),
          role: p.role.trim()
        }))
      });

      if (res && res.success && res.team) {
        setIsLoading(false);
        setSuccessData({
          teamId: res.team.teamId,
          teamName: res.team.teamName,
          coachName: res.team.coachName,
          coachEmail: res.team.coachEmail,
          passkey: res.team.passkey
        });
      } else {
        setIsLoading(false);
        setStatusMessage(res?.message || 'Registration failed. Please try again.');
        setStatusType('error');
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage(err.message || 'Registration failed due to a server error. Please try again.');
      setStatusType('error');
    }
  };

  return (
    <SharedBackground>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('Home')} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.cardContainer}>
            {/* Crest / Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo_transparent.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.mainTitle}>CRICKET FEDERATION OF</Text>
              <Text style={styles.mainSubtitle}>VIRUDHUNAGAR DISTRICT</Text>
            </View>

            {/* Registration Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Official Team Registration</Text>
              <Text style={styles.subtitle}>
                Register your Team Name, Coach Information, and add 15 Squad Players.
              </Text>

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

              {/* ============================================================== */}
              {/* SECTION 1: TEAM & COACH DETAILS                                 */}
              {/* ============================================================== */}
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.sectionHeaderText}>1. Team & Coach Details</Text>
              </View>

              {/* Team Name */}
              <Text style={styles.label}>Team Name *</Text>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="e.g. Virudhunagar Strikers Cricket Club"
                placeholderTextColor="#9bb0cf"
              />

              {/* Coach Name */}
              <Text style={styles.label}>Coach Full Name *</Text>
              <TextInput
                style={styles.input}
                value={coachName}
                onChangeText={setCoachName}
                placeholder="e.g. S. Murugan"
                placeholderTextColor="#9bb0cf"
              />

              {/* Coach Email ID */}
              <Text style={styles.label}>Coach Email ID *</Text>
              <TextInput
                style={styles.input}
                value={coachEmail}
                onChangeText={setCoachEmail}
                placeholder="e.g. coach.murugan@strikerscc.org"
                keyboardType="email-address"
                placeholderTextColor="#9bb0cf"
                autoCapitalize="none"
              />

              {/* ============================================================== */}
              {/* SECTION 2: ADD PLAYER (3 FIELDS: NAME, EMAIL, ROLE + ADD BTN)  */}
              {/* ============================================================== */}
              <View style={styles.sectionHeaderBox}>
                <View style={styles.squadTitleRow}>
                  <Text style={styles.sectionHeaderText}>2. Add Squad Player</Text>
                  <View
                    style={[
                      styles.squadCounterBadge,
                      players.length === 15 ? styles.squadCounterComplete : styles.squadCounterIncomplete
                    ]}
                  >
                    <Text
                      style={[
                        styles.squadCounterText,
                        players.length === 15 ? styles.squadCounterTextComplete : styles.squadCounterTextIncomplete
                      ]}
                    >
                      {players.length === 15 ? 'SQUAD READY (15/15)' : `${players.length} / 15 Players`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(players.length / 15) * 100}%`,
                      backgroundColor: players.length === 15 ? '#16a34a' : '#eab308'
                    }
                  ]}
                />
              </View>

              {/* The 3 Player Input Fields */}
              <View style={styles.playerInputFormBox}>
                {/* Field 1: Player Name */}
                <Text style={styles.fieldLabel}>1. Player Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={playerName}
                  onChangeText={setPlayerName}
                  placeholder="Enter player full name (e.g. R. Saravanan)"
                  placeholderTextColor="#9bb0cf"
                  editable={players.length < 15}
                />

                {/* Field 2: Player Email */}
                <Text style={styles.fieldLabel}>2. Player Email ID *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={playerEmail}
                  onChangeText={setPlayerEmail}
                  placeholder="Enter player email (e.g. saravanan.r@strikerscc.org)"
                  keyboardType="email-address"
                  placeholderTextColor="#9bb0cf"
                  autoCapitalize="none"
                  editable={players.length < 15}
                />

                {/* Field 3: Player Role */}
                <Text style={styles.fieldLabel}>3. Player Role *</Text>
                <View style={styles.roleChipsRow}>
                  {COMMON_ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleChip, playerRole === role && styles.roleChipActive]}
                      onPress={() => setPlayerRole(role)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.roleChipText, playerRole === role && styles.roleChipTextActive]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ADD BUTTON */}
                <TouchableOpacity
                  style={[styles.addPlayerBtn, players.length >= 15 && styles.addPlayerBtnDisabled]}
                  onPress={handleAddPlayer}
                  disabled={players.length >= 15}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addPlayerBtnText}>
                    {players.length >= 15 ? 'Squad Roster Full (15/15)' : '+ Add Player to Squad'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Helper Actions */}
              {players.length > 0 && (
                <View style={styles.quickActionsRow}>
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={handleClearAllPlayers}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearBtnText}>Clear Squad List</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* ============================================================== */}
              {/* SECTION 3: ADDED PLAYERS LIST                                  */}
              {/* ============================================================== */}
              <View style={styles.squadListHeaderRow}>
                <Text style={styles.squadListTitle}>
                  Added Squad List ({players.length} / 15)
                </Text>
                {players.length < 15 ? (
                  <Text style={styles.squadRemainingText}>{15 - players.length} more needed</Text>
                ) : (
                  <Text style={styles.squadCompleteText}>✓ Complete (15/15)</Text>
                )}
              </View>

              {players.length === 0 ? (
                <View style={styles.emptySquadBox}>
                  <Text style={styles.emptySquadText}>
                    No players added yet. Enter Player Name, Email, and Role above and click "+ Add Player to Squad".
                  </Text>
                </View>
              ) : (
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

              {/* ============================================================== */}
              {/* DECLARATION & SUBMISSION                                       */}
              {/* ============================================================== */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm that all 15 squad players and coach details are authentic, verified, and comply with TNCA & CFVD regulations.
                </Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  players.length !== 15 && styles.submitBtnDisabled
                ]}
                onPress={handleSubmit}
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

              {/* Link to Login */}
              <View style={styles.loginPromptRow}>
                <Text style={styles.promptNormalText}>Already registered? </Text>
                <TouchableOpacity onPress={() => navigate('Home')} activeOpacity={0.7}>
                  <Text style={styles.loginLinkText}>Login to Team Portal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </ScrollView>
      
      {/* SUCCESS CONFIRMATION MODAL WITH ONE-TIME PASSKEY DISPLAY */}
      {successData && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 18, 0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          zIndex: 99999
        }}>
          <View style={{
            backgroundColor: '#0a162e',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 480,
            borderWidth: 1.5,
            borderColor: '#eab308',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 12
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(34, 197, 94, 0.18)',
              borderWidth: 2,
              borderColor: '#22c55e',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Text style={{ color: '#22c55e', fontSize: 28, fontWeight: 'bold' }}>✓</Text>
            </View>

            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>
              TEAM REGISTRATION SUCCESSFUL
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
              Official 15-player squad roster enrolled in database.
            </Text>

            <View style={{ width: '100%', backgroundColor: '#040d1f', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 18 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 2 }}>TEAM NAME</Text>
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>{successData.teamName}</Text>

              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 2 }}>GENERATED TEAM ID (LOGIN IDENTIFIER)</Text>
              <Text style={{ color: '#eab308', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 10 }}>{successData.teamId}</Text>

              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 2 }}>HEAD COACH</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>{successData.coachName} ({successData.coachEmail})</Text>

              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 2 }}>GENERATED TEAM PASSKEY (ONE-TIME DISPLAY)</Text>
              <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', borderWidth: 1, borderColor: '#eab308', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: '#fef08a', fontSize: 22, fontWeight: '900', letterSpacing: 3 }}>{successData.passkey}</Text>
                <Text style={{ color: '#ca8a04', fontSize: 11, marginTop: 4, fontWeight: '700' }}>⚠️ Save this passkey now. It will not be shown again.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#eab308',
                paddingVertical: 14,
                paddingHorizontal: 28,
                borderRadius: 8,
                width: '100%',
                alignItems: 'center'
              }}
              onPress={() => {
                const idToPass = successData.teamId;
                setSuccessData(null);
                navigate('Home');
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#020612', fontSize: 14.5, fontWeight: '900', letterSpacing: 0.5 }}>
                GO TO TEAM LOGIN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3
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

  /* The 3-field Player Input Box */
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

  /* Quick action buttons */
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

  /* Added Players List */
  squadListHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4
  },
  squadListTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  squadRemainingText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '700'
  },
  squadCompleteText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '800'
  },
  emptySquadBox: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  emptySquadText: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
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
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 'bold'
  },

  /* Checkbox & Final Submit */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 14
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
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
