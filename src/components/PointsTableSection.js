import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TABLE_DATA_SETS } from '../data/cricketData';

export default function PointsTableSection({ theme }) {
  const [activeTableKey, setActiveTableKey] = useState('div1');

  const tableData = TABLE_DATA_SETS[activeTableKey] || TABLE_DATA_SETS.div1;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <MaterialCommunityIcons name="format-list-numbered" size={12} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>LEAGUE STANDINGS</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Official League Points Table</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Updated in accordance with official TNCA District League points calculation rules
        </Text>
      </View>

      {/* Switch Buttons */}
      <View style={[styles.switchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}>
        {[
          { key: 'div1', label: '1st Div (3-Day)' },
          { key: 't20', label: 'Kamarajar T20' },
          { key: 'school', label: 'School Shield' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.switchBtn,
              activeTableKey === tab.key && [styles.activeSwitchBtn, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setActiveTableKey(tab.key)}
          >
            <Text
              style={[
                styles.switchBtnText,
                { color: activeTableKey === tab.key ? '#000' : theme.textSecondary, fontWeight: activeTableKey === tab.key ? '800' : '600' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Points Table Scrollable Horizontal */}
      <View style={[styles.tableCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.thCell, styles.posCol, { color: theme.textSecondary }]}>#</Text>
              <Text style={[styles.thCell, styles.teamCol, { color: theme.textSecondary }]}>Club / Team</Text>
              <Text style={[styles.thCell, styles.numCol, { color: theme.textSecondary }]}>P</Text>
              <Text style={[styles.thCell, styles.numCol, { color: theme.textSecondary }]}>W</Text>
              <Text style={[styles.thCell, styles.numCol, { color: theme.textSecondary }]}>L</Text>
              <Text style={[styles.thCell, styles.numCol, { color: theme.textSecondary }]}>D</Text>
              <Text style={[styles.thCell, styles.numCol, { color: theme.textSecondary }]}>Bonus</Text>
              <Text style={[styles.thCell, styles.nrrCol, { color: theme.textSecondary }]}>NRR</Text>
              <Text style={[styles.thCell, styles.ptsCol, { color: theme.primary }]}>PTS</Text>
              <Text style={[styles.thCell, styles.formCol, { color: theme.textSecondary }]}>Form</Text>
            </View>

            {/* Table Rows */}
            {tableData.map((row) => {
              const isQualified = row.pos <= 4;
              let badgeColor = 'transparent';
              if (row.badge === 'gold') badgeColor = '#F59E0B';
              if (row.badge === 'silver') badgeColor = '#94A3B8';
              if (row.badge === 'bronze') badgeColor = '#D97706';

              return (
                <View
                  key={row.pos}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isQualified ? theme.tableQualified : 'transparent',
                      borderBottomColor: theme.borderLight,
                    },
                  ]}
                >
                  {/* Pos */}
                  <View style={[styles.posCol, styles.centerAlign]}>
                    {row.badge ? (
                      <View style={[styles.medalBadge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.medalText}>{row.pos}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.posText, { color: theme.textSecondary }]}>{row.pos}</Text>
                    )}
                  </View>

                  {/* Team */}
                  <View style={styles.teamCol}>
                    <View style={styles.teamCellWrap}>
                      <View style={[styles.miniCrest, { backgroundColor: theme.primary }]}>
                        <Text style={styles.miniCrestText}>{row.code}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.teamTitle, { color: theme.text }]} numberOfLines={1}>
                          {row.name}
                        </Text>
                        {row.sub ? (
                          <Text style={[styles.subText, { color: isQualified ? theme.primary : theme.textMuted }]}>
                            {row.sub}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Numbers */}
                  <Text style={[styles.numCol, styles.centerAlign, { color: theme.text }]}>{row.p}</Text>
                  <Text style={[styles.numCol, styles.centerAlign, { color: theme.text, fontWeight: '800' }]}>{row.w}</Text>
                  <Text style={[styles.numCol, styles.centerAlign, { color: theme.textSecondary }]}>{row.l}</Text>
                  <Text style={[styles.numCol, styles.centerAlign, { color: theme.textSecondary }]}>{row.d}</Text>
                  <Text style={[styles.numCol, styles.centerAlign, { color: theme.textSecondary }]}>{row.bonus}</Text>
                  <Text style={[styles.nrrCol, styles.centerAlign, { color: theme.text }]}>{row.nrr}</Text>
                  <Text style={[styles.ptsCol, styles.centerAlign, { color: theme.primary, fontWeight: '900' }]}>{row.pts}</Text>

                  {/* Form */}
                  <View style={[styles.formCol, styles.formPillWrap]}>
                    {row.form.map((f, fi) => (
                      <View
                        key={fi}
                        style={[
                          styles.formPill,
                          {
                            backgroundColor:
                              f === 'w' ? '#10B981' : f === 'l' ? '#EF4444' : '#64748B',
                          },
                        ]}
                      >
                        <Text style={styles.formPillText}>{f.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  sectionHead: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  sectionTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    marginBottom: 10,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSwitchBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchBtnText: {
    fontSize: 11.5,
  },
  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableHeader: {
    paddingVertical: 8,
  },
  thCell: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  posCol: {
    width: 32,
    paddingLeft: 6,
  },
  centerAlign: {
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: {
    fontSize: 11,
    fontWeight: '700',
  },
  medalBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  teamCol: {
    width: 175,
    paddingHorizontal: 6,
  },
  teamCellWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniCrest: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCrestText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 9,
  },
  teamTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subText: {
    fontSize: 9,
    fontWeight: '600',
  },
  numCol: {
    width: 28,
    fontSize: 11,
  },
  nrrCol: {
    width: 52,
    fontSize: 10.5,
  },
  ptsCol: {
    width: 38,
    fontSize: 12,
  },
  formCol: {
    width: 95,
    paddingHorizontal: 4,
  },
  formPillWrap: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  formPill: {
    width: 15,
    height: 15,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formPillText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
});
