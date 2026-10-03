import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { ScorerNavigationContext, useScorerNavigation, ScreenName } from './ScorerNavigationContext';
import ScorerAuthScreen from '../screens/scorer/ScorerAuthScreen';
import ScorerDashboardScreen from '../screens/scorer/ScorerDashboardScreen';
import MatchSetupScreen from '../screens/scorer/MatchSetupScreen';
import LiveScoringScreen from '../screens/scorer/LiveScoringScreen';
import ScorecardScreen from '../screens/scorer/ScorecardScreen';
import SharedBackground from '../components/scorer/SharedBackground';





interface Props {
  onExit: (target?: string, params?: any) => void;
  initialParams?: any;
}

export default function ScorerNavigator({ onExit, initialParams }: Props) {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(initialParams?.initialScreen || 'Auth');
  const [params, setParams] = useState<any>(initialParams || null);

  useEffect(() => {
    if (initialParams) {
      setParams(initialParams);
      if (initialParams.initialScreen) {
        setCurrentScreen(initialParams.initialScreen);
      }
    }
  }, [initialParams]);

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
