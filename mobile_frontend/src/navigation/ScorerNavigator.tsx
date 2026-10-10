import React, { useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import ScorerAuthScreen from '../screens/scorer/ScorerAuthScreen';
import ScorerDashboardScreen from '../screens/scorer/ScorerDashboardScreen';
import MatchSetupScreen from '../screens/scorer/MatchSetupScreen';
import LiveScoringScreen from '../screens/scorer/LiveScoringScreen';
import ScorecardScreen from '../screens/scorer/ScorecardScreen';
import SharedBackground from '../components/scorer/SharedBackground';

import {
  ScreenName,
  ScorerNavigationContext,
  useScorerNavigation
} from './ScorerNavigationContext';

export { ScreenName, ScorerNavigationContext, useScorerNavigation };

interface Props {
  onExit: () => void;
  initialParams?: any;
}

export default function ScorerNavigator({ onExit, initialParams }: Props) {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(initialParams?.initialScreen || 'Dashboard');
  const [params, setParams] = useState<any>(initialParams || null);

  const navigate = (screen: ScreenName, screenParams?: any) => {
    setCurrentScreen(screen);
    setParams(screenParams || null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Auth': return <ScorerAuthScreen />;
      case 'Dashboard': return <ScorerDashboardScreen />;
      case 'MatchSetup': return <MatchSetupScreen />;
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
