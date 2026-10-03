import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const COMMON_ROLES = [
  'Captain',
  'Vice Captain',
  'Wicket Keeper',
  'Batter',
  'Bowler',
  'All-Rounder',
];

const SAMPLE_15_SQUAD = [
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
  { name: 'D. Rajesh', email: 'rajesh.d@strikerscc.org', role: 'Wicket Keeper' },
];

export default function RegistrationModal({ visible, onClose, theme }) {
  // Team & Coach Fields
  const [teamName, setTeamName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');

  // 3 Fields for adding each player
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerRole, setPlayerRole] = useState('Batter');

  // List of added players
  const [players, setPlayers] = useState([]);
  const [agreed, setAgreed] = useState(true);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());

  // Add a single player using the 3 fields
  const handleAddPlayer = () => {
    const name = playerName.trim();
    const email = playerEmail.trim().toLowerCase();
    const role = playerRole.trim() || 'Player';

    if (!name) {
      Alert.alert('Required', 'Please enter Player Name.');
      return;
    }

    if (!email || !validateEmail(email)) {
      Alert.alert('Required', 'Please enter a valid Player Email ID (e.g. player@team.org).');
      return;
    }

    if (coachEmail.trim() && email === coachEmail.trim().toLowerCase()) {
      Alert.alert('Invalid Email', `Player email "${email}" cannot be identical to Coach Email.`);
      return;
    }

    if (players.some((p) => p.email.toLowerCase() === email)) {
      Alert.alert('Duplicate Player', `A player with email "${email}" has already been added to the squad.`);
      return;
    }

    if (players.length >= 15) {
      Alert.alert('Roster Full', 'Maximum 15 players have already been added to the squad.');
      return;
    }

    setPlayers((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        name,
        email,
        role,
      },
    ]);

    setPlayerName('');
    setPlayerEmail('');
  };

  const handleRemovePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAutoFillSquad = () => {
    if (!teamName.trim()) setTeamName('Virudhunagar Strikers Cricket Club');
    if (!coachName.trim()) setCoachName('S. Murugan (NIS Certified Coach)');
    if (!coachEmail.trim()) setCoachEmail('coach.murugan@strikerscc.org');

    const sample = SAMPLE_15_SQUAD.map((item, idx) => ({
      id: `sample-${idx + 1}-${Date.now()}`,
      name: item.name,
      email: item.email,
      role: item.role,
    }));
    setPlayers(sample);
    Alert.alert('⚡ Sample Squad Loaded', '15 players, team name, and coach details have been loaded. You can edit, remove, or submit.');
  };

  const handleClearSquad = () => {
    setPlayers([]);
  };

  const handleSubmit = () => {
    if (!teamName.trim()) {
      Alert.alert('Missing Field', 'Please enter Team Name.');
      return;
    }
    if (!coachName.trim()) {
      Alert.alert('Missing Field', 'Please enter Coach Full Name.');
      return;
    }
    if (!coachEmail.trim() || !validateEmail(coachEmail)) {
      Alert.alert('Missing Field', 'Please enter a valid Coach Email ID.');
      return;
    }

    if (players.length !== 15) {
      Alert.alert(
        '15 Players Required',
        `Team registration requires exactly 15 squad players. Currently added: ${players.length} / 15 players (Need ${15 - players.length} more).`
      );
      return;
    }

    if (!agreed) {
      Alert.alert('Required', 'Please accept the declaration to proceed.');
      return;
    }

    const teamToken = 'TEAM-VRD-' + Math.floor(100000 + Math.random() * 900000);
    const passkey = 'PASS-' + Math.floor(1000 + Math.random() * 9000);

    Alert.alert(
      '✓ Team Registration Submitted',
      `Team Name: ${teamName}\nTeam ID: ${teamToken}\nPasskey: ${passkey}\nCoach: ${coachName} (${coachEmail})\nSquad: 15 / 15 Players Enrolled\n\nPlease save your Team ID and Passkey to log in to the Team Portal.`,
      [
        {
          text: 'Save & Close',
          onPress: () => {
            onClose();
            setTeamName('');
            setCoachName('');
            setCoachEmail('');
            setPlayers([]);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>CFVD OFFICIAL REGISTRATION</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Official Team Registration</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Register Team Name, Coach Details, and add 15 Squad Players.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* 1. Team & Coach Details */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Team Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                placeholder="e.g. Virudhunagar Strikers Cricket Club"
                placeholderTextColor={theme.textMuted}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Coach Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                placeholder="e.g. S. Murugan"
                placeholderTextColor={theme.textMuted}
                value={coachName}
                onChangeText={setCoachName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Coach Email ID *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight, color: theme.text }]}
                placeholder="e.g. coach.murugan@strikerscc.org"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={coachEmail}
                onChangeText={setCoachEmail}
              />
            </View>

            {/* 2. Squad Section Header */}
            <View style={[styles.squadHeaderRow, { borderTopColor: theme.borderLight }]}>
              <View>
                <Text style={[styles.squadSectionTitle, { color: theme.primary }]}>Squad Players (15 Required) *</Text>
                <Text style={[styles.squadSectionSub, { color: theme.textSecondary }]}>
                  Add each player using the 3 fields below
                </Text>
              </View>
              <View
                style={[
                  styles.counterBadge,
                  {
                    backgroundColor: players.length === 15 ? 'rgba(22, 163, 74, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                    borderColor: players.length === 15 ? '#16a34a' : theme.primary,
                  },
                ]}
              >
                <Text style={[styles.counterBadgeText, { color: players.length === 15 ? '#16a34a' : theme.primary }]}>
                  {players.length} / 15 Players
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(players.length / 15) * 100}%`,
                    backgroundColor: players.length === 15 ? '#16a34a' : '#eab308',
                  },
                ]}
              />
            </View>

            {/* THE 3 FIELDS FOR ADDING PLAYER */}
            <View style={[styles.playerInputBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>1. Player Name *</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.borderLight, color: theme.text }]}
                placeholder="Enter player name (e.g. R. Saravanan)"
                placeholderTextColor={theme.textMuted}
                value={playerName}
                onChangeText={setPlayerName}
                editable={players.length < 15}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>2. Player Email ID *</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: theme.borderLight, color: theme.text }]}
                placeholder="Enter player email (e.g. saravanan@team.org)"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={playerEmail}
                onChangeText={setPlayerEmail}
                editable={players.length < 15}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>3. Player Role *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsScroll}>
                {COMMON_ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: playerRole === role ? theme.primary : 'transparent',
                        borderColor: playerRole === role ? theme.primary : theme.borderLight,
                      },
                    ]}
                    onPress={() => setPlayerRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        { color: playerRole === role ? '#000' : theme.textSecondary, fontWeight: playerRole === role ? '800' : '500' },
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Add Button */}
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  { backgroundColor: players.length >= 15 ? '#94a3b8' : theme.primary },
                ]}
                onPress={handleAddPlayer}
                disabled={players.length >= 15}
              >
                <FontAwesome5 name="user-plus" size={13} color="#000" />
                <Text style={styles.addBtnText}>
                  {players.length >= 15 ? 'Squad Full (15/15)' : '+ Add Player to Squad'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Helper Actions */}
            <View style={styles.helperActionsRow}>
              <TouchableOpacity style={[styles.autoFillBtn, { borderColor: theme.primary }]} onPress={handleAutoFillSquad}>
                <Text style={[styles.autoFillText, { color: theme.primary }]}>⚡ Quick Add 15 Sample Players</Text>
              </TouchableOpacity>
              {players.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearSquad}>
                  <Text style={styles.clearText}>Clear List</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Added Players List */}
            <View style={styles.squadListHeader}>
              <Text style={[styles.squadListTitle, { color: theme.text }]}>
                Squad List ({players.length} / 15)
              </Text>
              {players.length < 15 ? (
                <Text style={styles.squadRemaining}>{15 - players.length} more needed</Text>
              ) : (
                <Text style={styles.squadComplete}>✓ Squad Complete</Text>
              )}
            </View>

            {players.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: theme.borderLight }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No players added yet. Fill Player Name, Email, and Role above and tap "+ Add Player to Squad".
                </Text>
              </View>
            ) : (
              <View style={styles.playersListWrap}>
                {players.map((p, idx) => (
                  <View key={p.id} style={[styles.playerItemCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
                    <View style={styles.playerItemLeft}>
                      <View style={styles.playerNumBadge}>
                        <Text style={styles.playerNumText}>#{idx + 1}</Text>
                      </View>
                      <View>
                        <View style={styles.nameRoleRow}>
                          <Text style={[styles.playerNameText, { color: theme.text }]}>{p.name}</Text>
                          <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>{p.role}</Text>
                          </View>
                        </View>
                        <Text style={[styles.playerEmailText, { color: theme.textSecondary }]}>{p.email}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePlayer(p.id)}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Declaration Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={agreed ? theme.primary : theme.textMuted}
              />
              <Text style={[styles.checkboxText, { color: theme.textSecondary }]}>
                I hereby certify that all 15 squad players and coach details submitted are true, authentic, and abide by CFVD & TNCA regulations.
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: players.length === 15 ? theme.primary : '#94a3b8' },
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="check-circle" size={14} color="#000" />
              <Text style={styles.submitBtnText}>
                {players.length === 15
                  ? 'Submit Team Registration (15 Players)'
                  : `Add 15 Players to Submit (${players.length}/15)`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    maxHeight: 520,
  },
  bodyContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },

  /* Squad Header */
  squadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  squadSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  squadSectionSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  counterBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* 3 Player Fields Box */
  playerInputBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 4,
  },
  fieldInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 12.5,
    marginBottom: 8,
  },
  roleChipsScroll: {
    gap: 6,
    paddingVertical: 2,
    marginBottom: 10,
  },
  roleChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 11,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  addBtnText: {
    color: '#000',
    fontSize: 12.5,
    fontWeight: '900',
  },

  /* Helper Actions */
  helperActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  autoFillBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  autoFillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
  },

  /* Added Players List */
  squadListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  squadListTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  squadRemaining: {
    fontSize: 11.5,
    color: '#b45309',
    fontWeight: '700',
  },
  squadComplete: {
    fontSize: 11.5,
    color: '#15803d',
    fontWeight: '800',
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  playersListWrap: {
    gap: 8,
    marginBottom: 12,
  },
  playerItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  playerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  playerNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerNameText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  roleTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#d4af37',
  },
  playerEmailText: {
    fontSize: 11,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
});
