/**
 * src/admin/pages/LiveScoringPage.tsx
 * Live Scoring Management Page for Cricket Association Professional Admin Panel.
 * Monitors real-time match scores, ball-by-ball tallies, batters at crease,
 * active bowlers, and current run rates across concurrent tournament fixtures.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { LiveScoringIcon, RefreshIcon, CricketBatIcon } from '../components/Icons';
import { adminApi } from '../services/adminApi';
import { useAdminLayout } from '../components/AdminLayout';

export const LiveScoringPage: React.FC = () => {
  const { showToast } = useAdminLayout();
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveScoring = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await adminApi.getLiveScoring();
      if (res && res.success) {
        setLiveMatches(res.liveMatches || []);
      }
    } catch (e: any) {
      showToast(`Failed to refresh live scores: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveScoring();
    const interval = setInterval(() => {
      fetchLiveScoring();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <PageHeader
        title="Live Scoring Monitor"
        subtitle="Monitor live ongoing cricket matches, real-time scorecards, batsman creases, and bowler tallies."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/dashboard' },
          { label: 'Live Scoring' }
        ]}
        actions={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchLiveScoring(true)}
            disabled={isRefreshing}
          >
            <RefreshIcon size={15} color="#0A2540" />
            <Text style={styles.refreshBtnText}>
              {isRefreshing ? 'Refreshing...' : 'Refresh Live Feed'}
            </Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <LoadingSkeleton rows={4} type="card" />
      ) : liveMatches.length === 0 ? (
        <EmptyState
          title="No live matches in progress"
          description="There are currently no active tournament matches marked as LIVE. Check upcoming fixtures in Matches."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.matchesList}>
          {liveMatches.map((m) => (
            <View key={m.matchId} style={styles.liveCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status="LIVE" />
                  <Text style={styles.tournamentTag}>{m.tournament}</Text>
                </View>
                <Text style={styles.venueTag}>{m.venue}</Text>
              </View>

              {/* Match Teams & Score Banner */}
              <View style={styles.scoreBanner}>
                <View style={styles.teamScoreCol}>
                  <Text style={styles.teamTitle}>{m.teamA}</Text>
                  <Text style={styles.scoreDigits}>
                    {m.runs}/{m.wickets}
                  </Text>
                  <Text style={styles.oversText}>
                    ({m.overs} ov, CRR: {m.crr})
                  </Text>
                </View>

                <View style={styles.versusPill}>
                  <Text style={styles.versusText}>VS</Text>
                </View>

                <View style={[styles.teamScoreCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.teamTitle}>{m.teamB}</Text>
                  <Text style={styles.fieldingLabel}>Fielding / 2nd Innings</Text>
                </View>
              </View>

              {/* Active Batters & Bowler Grid */}
              <View style={styles.detailsGrid}>
                {/* Batters */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionBlockTitle}>Batters at Crease</Text>
                  {(m.batters || []).length === 0 ? (
                    <Text style={styles.naText}>No batter details recorded.</Text>
                  ) : (
                    <View style={styles.tableMini}>
                      {(m.batters || []).map((b: any, idx: number) => (
                        <View key={idx} style={styles.batterRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.batterName}>
                              {b.name} {b.isStriker ? '*' : ''}
                            </Text>
                          </View>
                          <Text style={styles.batterStats}>
                            <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                              {b.runs}
                            </Text>{' '}
                            ({b.balls}b, {b.fours}x4, {b.sixes}x6)
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Bowler */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionBlockTitle}>Current Bowler</Text>
                  {m.bowler ? (
                    <View style={styles.bowlerBox}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.bowlerName}>{m.bowler.name}</Text>
                        <Text style={styles.bowlerFigures}>
                          {m.bowler.overs} ov • {m.bowler.maidens}m • {m.bowler.runs}r •{' '}
                          <Text style={{ fontWeight: '700', color: '#0A2540' }}>
                            {m.bowler.wickets}w
                          </Text>
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.naText}>No bowler active.</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A2540'
  },
  matchesList: {
    gap: 16
  },
  liveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tournamentTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2540'
  },
  venueTag: {
    fontSize: 12,
    color: '#64748B'
  },
  scoreBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  teamScoreCol: {
    flex: 1
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  scoreDigits: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A2540',
    marginTop: 4
  },
  oversText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  versusPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16
  },
  versusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B'
  },
  fieldingLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
    padding: 18
  } as any,
  sectionBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14
  },
  sectionBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  tableMini: {
    gap: 8
  },
  batterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  batterName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A'
  },
  batterStats: {
    fontSize: 12,
    color: '#64748B'
  },
  bowlerBox: {
    paddingVertical: 4
  },
  bowlerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A'
  },
  bowlerFigures: {
    fontSize: 12,
    color: '#64748B'
  },
  naText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic'
  }
});

export default LiveScoringPage;
