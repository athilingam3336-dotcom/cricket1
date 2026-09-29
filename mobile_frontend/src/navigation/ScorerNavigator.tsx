import React, { createContext, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';

import ScorerAuthScreen from '../screens/scorer/ScorerAuthScreen';
import ScorerDashboardScreen from '../screens/scorer/ScorerDashboardScreen';
import LiveScoringScreen from '../screens/scorer/LiveScoringScreen';
import ScorecardScreen from '../screens/scorer/ScorecardScreen';
import SharedBackground from '../components/scorer/SharedBackground';

export type ScreenName = 'Auth' | 'Dashboard' | 'LiveScoring' | 'Scorecard';

interface ScorerNavigationContextType {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName, params?: any) => void;
  params: any;
  onExit: () => void;
}

const ScorerNavigationContext = createContext<ScorerNavigationContextType>({
  currentScreen: 'Auth',
  navigate: () => {},
  params: null,
  onExit: () => {}
});

export const useScorerNavigation = () => useContext(ScorerNavigationContext);

interface Props {
  onExit: () => void;
}

export default function ScorerNavigator({ onExit }: Props) {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Auth');
  const [params, setParams] = useState<any>(null);

  const navigate = (screen: ScreenName, screenParams?: any) => {
    setCurrentScreen(screen);
    setParams(screenParams || null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Auth': return <ScorerAuthScreen />;
      case 'Dashboard': return <ScorerDashboardScreen />;
      case 'LiveScoring': return <LiveScoringScreen />;
      case 'Scorecard': return <ScorecardScreen />;
      default: return <ScorerAuthScreen />;
    }
  };

  return (
    <ScorerNavigationContext.Provider value={{ currentScreen, navigate, params, onExit }}>
      <SharedBackground>
        <SafeAreaView style={styles.container}>
          {renderScreen()}
        </SafeAreaView>
      </SharedBackground>
    </ScorerNavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});
