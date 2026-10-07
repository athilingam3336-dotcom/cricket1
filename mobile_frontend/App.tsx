import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator, { useAppNavigation, AppScreenName } from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegistrationScreen from './src/screens/auth/RegistrationScreen';
import ScorerNavigator from './src/navigation/ScorerNavigator';
import PlayerDashboardScreen from './src/screens/player/PlayerDashboardScreen';
import TeamDashboardScreen from './src/screens/team/TeamDashboardScreen';

function MainAppShell() {
  const { currentScreen, navigate, goBack, params } = useAppNavigation();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const getIframe = (): HTMLIFrameElement | null =>
        document.getElementById('cfvd-main-frame') as HTMLIFrameElement | null;

      const handleMessage = (event: MessageEvent) => {
        if (!event.data) return;

        if (event.data.type === 'OPEN_SCORER_MODULE' || event.data.route === '/scorer') {
          navigate('Scorer');
        } else if (
          event.data.type === 'OPEN_PLAYER_DASHBOARD' ||
          event.data.type === 'OPEN_PLAYER_MODULE' ||
          event.data.route === '/player'
        ) {
          navigate('Player', event.data.params);
        } else if (
          event.data.type === 'OPEN_COACH_DASHBOARD' ||
          event.data.type === 'OPEN_TEAM_DASHBOARD' ||
          event.data.type === 'OPEN_TEAM_MODULE' ||
          event.data.route === '/team' ||
          event.data.route === '/coach'
        ) {
          navigate('Team', event.data.params);
        } else if (event.data.type === 'OPEN_LOGIN_SCREEN' || event.data.route === '/login' || (event.data.route && event.data.route.includes('login') && !event.data.route.includes('admin') && !event.data.route.includes('scorer') && !event.data.route.includes('team'))) {
          navigate('Login', event.data.initialRole ? { initialRole: event.data.initialRole } : undefined);
        } else if (
          event.data.type === 'OPEN_REGISTRATION_SCREEN' ||
          event.data.route === '/player-registration' ||
          event.data.route === '/register'
        ) {
          const role = event.data.initialRole || (event.data.route === '/player-registration' ? 'PLAYER' : undefined);
          navigate('Registration', role ? { initialRole: role } : undefined);
        } else if (
          event.data.type === 'OPEN_HOME_SCREEN' ||
          event.data.type === 'GO_HOME' ||
          event.data.route === '/' ||
          event.data.route === '/home' ||
          event.data.route === ''
        ) {
          navigate('Home');
        } else if (
          event.data.type === 'GO_BACK' ||
          event.data.type === 'NAVIGATE_BACK'
        ) {
          goBack();
        }

        // Handle navigation messages from the iframe to update the top-level browser URL
        if (event.data && event.data.type === 'NAVIGATE' && event.data.route) {
          try {
            const route: string = event.data.route;
            if (route === '/' || route === '/home' || route === '') {
              navigate('Home');
            } else if (route === '/scorer' || route === '/scorer-login') {
              navigate('Scorer');
            } else if (route === '/player') {
              navigate('Player');
            } else if (route === '/team' || route === '/coach') {
              navigate('Team');
            } else {
              const [path, queryString] = route.split('?');
              const fullUrl = window.location.origin + path + (queryString ? '?' + queryString : '');
              window.history.pushState({ iframeRoute: route }, '', fullUrl);
            }
          } catch (e) {}
        }

        // Handle section-based hash navigation from iframe
        if (event.data && event.data.type === 'SECTION_NAV' && event.data.hash) {
          try {
            const hash: string = event.data.hash;
            window.history.pushState({ iframeHash: hash }, '', hash);
          } catch (e) {}
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [navigate]);

  if (currentScreen === 'Login') {
    return <LoginScreen />;
  }

  if (currentScreen === 'Registration') {
    return <RegistrationScreen />;
  }

  if (currentScreen === 'Scorer') {
    return <ScorerNavigator onExit={() => navigate('Home')} initialParams={params} />;
  }

  if (currentScreen === 'Player') {
    return <PlayerDashboardScreen onExit={() => navigate('Home')} initialParams={params} />;
  }

  if (currentScreen === 'Team' || currentScreen === 'Coach') {
    return <TeamDashboardScreen onExit={() => navigate('Home')} initialParams={params} />;
  }

  // Home Screen with Top Native Bar containing only "Login" and "Scorer Login" (No separate Register)
  const renderWebView = () => {
    if (Platform.OS === 'web') {
      const initialPath =
        typeof window !== 'undefined' && window.location.pathname !== '/'
          ? '#' + window.location.pathname + window.location.search
          : '';
      return (
        <View style={styles.webviewContainer}>
          {/* @ts-ignore */}
          <iframe
            id="cfvd-main-frame"
            src={`/bundled.html${initialPath}`}
            style={styles.iframe as any}
            title="Cricket Federation Portal"
          />
        </View>
      );
    }

    const { WebView } = require('react-native-webview');
    return (
      <WebView
        source={require('./public/bundled.html')}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        showsVerticalScrollIndicator={false}
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data && data.type === 'OPEN_SCORER_MODULE') {
              navigate('Scorer');
            } else if (data && (data.type === 'OPEN_COACH_DASHBOARD' || data.type === 'OPEN_TEAM_DASHBOARD' || data.route === '/coach' || data.route === '/team')) {
              navigate('Team', data.params);
            } else if (data && (data.type === 'OPEN_LOGIN_SCREEN' || data.route === '/login' || (data.route && data.route.includes('login')))) {
              navigate('Login', data.initialRole ? { initialRole: data.initialRole } : undefined);
            } else if (data && (data.type === 'OPEN_REGISTRATION_SCREEN' || data.route === '/player-registration' || data.route === '/team-registration' || data.route === '/register')) {
              const role = data.initialRole || (data.route === '/team-registration' ? 'TEAM' : data.route === '/player-registration' ? 'PLAYER' : undefined);
              navigate('Registration', role ? { initialRole: role } : undefined);
            } else if (data && (data.type === 'OPEN_HOME_SCREEN' || data.type === 'GO_HOME' || data.route === '/' || data.route === '/home')) {
              navigate('Home');
            }
          } catch (e) {}
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#020612" />
      {renderWebView()}
    </SafeAreaView>
  );
}

export default function App() {
  const getInitialScreen = (): AppScreenName => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('scorer')) return 'Scorer';
      if (path.includes('player')) return 'Player';
      if (path.includes('team') || path.includes('coach')) return 'Team';
      if (path.includes('login')) return 'Login';
      if (path.includes('register')) return 'Registration';
    }
    return 'Home';
  };

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppNavigator initialScreen={getInitialScreen()}>
        <MainAppShell />
      </AppNavigator>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020612'
  },
  webviewContainer: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  webview: {
    flex: 1,
    backgroundColor: '#020612'
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: '#020612'
  }
});
