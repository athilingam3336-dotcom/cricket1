export const themes = {
  dark: {
    name: 'dark',
    background: '#070D1E',
    surface: '#0F1A36',
    surfaceElevated: '#17254B',
    surfaceLight: '#1E2F5B',
    border: 'rgba(212, 175, 55, 0.22)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#D4AF37',       // TNCA Gold
    primaryDark: '#B8860B',
    primaryLight: '#F3E5AB',
    accentGold: '#FFD700',
    accentRed: '#EF4444',      // Live Indicator
    accentGreen: '#10B981',    // Win / Qualified
    accentBlue: '#3B82F6',     // Selection / Junior
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    statusBarStyle: 'light-content',
    tableRowAlt: 'rgba(255, 255, 255, 0.02)',
    tableQualified: 'rgba(212, 175, 55, 0.08)',
  },
  light: {
    name: 'light',
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    surfaceLight: '#EDE9FE',
    border: 'rgba(212, 175, 55, 0.35)',
    borderLight: 'rgba(0, 0, 0, 0.08)',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    primary: '#B45309',       // Deep rich gold for light bg
    primaryDark: '#854D0E',
    primaryLight: '#FEF3C7',
    accentGold: '#D97706',
    accentRed: '#DC2626',
    accentGreen: '#059669',
    accentBlue: '#2563EB',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    statusBarStyle: 'dark-content',
    tableRowAlt: '#F8FAFC',
    tableQualified: '#FEF9C3',
  },
};

export const floodlightStyles = {
  on: {
    mode: 'on',
    name: 'Match Night',
    glowColor: 'rgba(56, 189, 248, 0.22)',
    beamColor: 'rgba(255, 255, 255, 0.15)',
    indicatorColor: '#38BDF8',
    icon: 'lightbulb',
  },
  warm: {
    mode: 'warm',
    name: 'Golden Sunset',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    beamColor: 'rgba(251, 191, 36, 0.15)',
    indicatorColor: '#F59E0B',
    icon: 'weather-sunset',
  },
  off: {
    mode: 'off',
    name: 'Lights Off',
    glowColor: 'transparent',
    beamColor: 'transparent',
    indicatorColor: '#64748B',
    icon: 'lightbulb-outline',
  },
};
