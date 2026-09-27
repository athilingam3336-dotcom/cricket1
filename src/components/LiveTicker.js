import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TICKER_ITEMS } from '../data/cricketData';

export default function LiveTicker({ theme }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.borderLight }]}>
      <View style={styles.badgeWrap}>
        <View style={styles.pulseDot} />
        <Text style={styles.badgeText}>LIVE</Text>
      </View>

      <TouchableOpacity
        style={styles.textWrap}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={[styles.tickerText, { color: theme.text }]} numberOfLines={1}>
          {TICKER_ITEMS[currentIndex]}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNext} style={styles.arrowBtn}>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  badgeText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  tickerText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  arrowBtn: {
    paddingLeft: 4,
  },
});
