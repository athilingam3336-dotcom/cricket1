import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function MatchCard({ match, theme, onSelectScorecard, onSetReminder }) {
  const isLive = match.category === 'live';
  const isUpcoming = match.category === 'upcoming';
  const isResult = match.category === 'results';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isLive ? theme.accentRed : theme.border,
          shadowColor: theme.cardShadow,
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        {/* Status Pill */}
        {isLive && (
          <View style={styles.livePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        )}
        {isUpcoming && (
          <View style={styles.upcomingPill}>
            <MaterialCommunityIcons name="clock-outline" size={11} color="#60A5FA" />
            <Text style={styles.upcomingPillText}>UPCOMING</Text>
          </View>
        )}
        {isResult && (
          <View style={styles.resultPill}>
            <MaterialCommunityIcons name="check-circle" size={11} color="#10B981" />
            <Text style={styles.resultPillText}>RESULT</Text>
          </View>
        )}

        <Text style={[styles.tournamentText, { color: theme.textSecondary }]} numberOfLines={1}>
          {match.tournament}
        </Text>

        <View style={[styles.formatBadge, { backgroundColor: match.formatColor + '20', borderColor: match.formatColor }]}>
          <Text style={[styles.formatBadgeText, { color: match.formatColor }]}>{match.format}</Text>
        </View>
      </View>

      {/* Teams & Scores */}
      <View style={[styles.teamsContainer, { borderBottomColor: theme.borderLight }]}>
        {/* Team 1 */}
        <View style={[styles.teamRow, match.team1.isBatting && { backgroundColor: theme.primary + '10' }]}>
          <View style={styles.teamMeta}>
            <View style={[styles.crestCircle, { backgroundColor: match.team1.color || theme.primary }]}>
              <Text style={styles.crestText}>{match.team1.code}</Text>
            </View>
            <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
              {match.team1.name}
            </Text>
            {match.team1.isBatting && (
              <MaterialCommunityIcons name="cricket" size={14} color={theme.accentGold} style={styles.battingIcon} />
            )}
            {match.team1.isWinner && (
              <FontAwesome5 name="trophy" size={12} color={theme.accentGold} style={styles.battingIcon} />
            )}
          </View>
          <View style={styles.scoreMeta}>
            <Text style={[styles.scoreText, { color: theme.text }]}>{match.team1.score}</Text>
            {match.team1.overs ? (
              <Text style={[styles.oversText, { color: theme.textSecondary }]}>{match.team1.overs}</Text>
            ) : null}
          </View>
        </View>

        {/* Team 2 */}
        <View style={[styles.teamRow, match.team2.isBatting && { backgroundColor: theme.primary + '10' }]}>
          <View style={styles.teamMeta}>
            <View style={[styles.crestCircle, { backgroundColor: match.team2.color || '#64748B' }]}>
              <Text style={styles.crestText}>{match.team2.code}</Text>
            </View>
            <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
              {match.team2.name}
            </Text>
            {match.team2.isBatting && (
              <MaterialCommunityIcons name="cricket" size={14} color={theme.accentGold} style={styles.battingIcon} />
            )}
            {match.team2.isWinner && (
              <FontAwesome5 name="trophy" size={12} color={theme.accentGold} style={styles.battingIcon} />
            )}
          </View>
          <View style={styles.scoreMeta}>
            <Text style={[styles.scoreText, { color: theme.text }]}>{match.team2.score}</Text>
            {match.team2.overs ? (
              <Text style={[styles.oversText, { color: theme.textSecondary }]}>{match.team2.overs}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Status Note */}
      <View style={styles.statusNoteRow}>
        <MaterialCommunityIcons
          name={isLive ? 'clock-fast' : isUpcoming ? 'calendar-clock' : 'trophy'}
          size={13}
          color={isLive ? theme.accentGold : isResult ? theme.accentGreen : theme.accentBlue}
        />
        <Text
          style={[
            styles.statusNoteText,
            {
              color: isLive ? theme.accentGold : isResult ? theme.accentGreen : theme.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {match.statusNote}
        </Text>
      </View>

      {/* Ground Venue */}
      <View style={styles.venueRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={theme.textMuted} />
        <Text style={[styles.venueText, { color: theme.textMuted }]} numberOfLines={1}>
          {match.venue}
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.actionRow}>
        {isUpcoming ? (
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.primary }]}
            onPress={() => onSetReminder(match)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={13} color={theme.primary} />
            <Text style={[styles.outlineBtnText, { color: theme.primary }]}>Set Match Reminder</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: isLive ? theme.accentRed : theme.primary }]}
            onPress={() => onSelectScorecard(match.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-document-outline" size={14} color="#FFF" />
            <Text style={styles.primaryActionBtnText}>
              {isLive ? 'View Live Scorecard' : 'Full Scorecard & Stats'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  livePillText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  upcomingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  upcomingPillText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '800',
  },
  resultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  resultPillText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  tournamentText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  formatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 6,
  },
  formatBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  teamsContainer: {
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 8,
    gap: 6,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  crestCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  crestText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  battingIcon: {
    marginLeft: 6,
  },
  scoreMeta: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '900',
  },
  oversText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  statusNoteText: {
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  venueText: {
    fontSize: 10.5,
  },
  actionRow: {
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
