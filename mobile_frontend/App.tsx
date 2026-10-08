import React, { useEffect } from 'react';
import { StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator, { useAppNavigation, AppScreenName } from './src/navigation/AppNavigator';
import HomeScreen from './screens/Home';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegistrationScreen from './src/screens/auth/RegistrationScreen';
import ScorerNavigator from './src/navigation/ScorerNavigator';
import PlayerDashboardScreen from './src/screens/player/PlayerDashboardScreen';
import TeamDashboardScreen from './src/screens/team/TeamDashboardScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';

function MainAppShell() {
  const { currentScreen, navigate, goBack, params } = useAppNavigation();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
        } else if (
          event.data.type === 'OPEN_ADMIN_DASHBOARD' ||
          event.data.type === 'OPEN_ADMIN_MODULE' ||
          event.data.route === '/admin'
        ) {
          navigate('Admin', event.data.params);
        } else if (
          event.data.type === 'OPEN_LOGIN_SCREEN' ||
          event.data.route === '/login' ||
          (event.data.route &&
            event.data.route.includes('login') &&
            !event.data.route.includes('admin') &&
            !event.data.route.includes('scorer') &&
            !event.data.route.includes('team'))
        ) {
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
        } else if (event.data.type === 'GO_BACK' || event.data.type === 'NAVIGATE_BACK') {
          goBack();
        }

        // Handle navigation messages to update the top-level browser URL
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
            } else if (route === '/admin') {
              navigate('Admin');
            } else {
              const [path, queryString] = route.split('?');
              const fullUrl = window.location.origin + path + (queryString ? '?' + queryString : '');
              window.history.pushState({ appScreen: route }, '', fullUrl);
            }
          } catch (e) {}
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [navigate, goBack]);

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

  if (currentScreen === 'Admin') {
    return <AdminDashboardScreen onExit={() => navigate('Home')} initialParams={params} />;
  }

  // Home Screen rendered as pure React Native component (no iframe, no bundled.html)
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#020612" />
      <HomeScreen />
    </SafeAreaView>
  );
}

export default function App() {
  const getInitialScreen = (): AppScreenName => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const fullPath = (window.location.pathname + window.location.hash + window.location.search).toLowerCase();
      if (fullPath.includes('scorer')) return 'Scorer';
      if (fullPath.includes('player')) return 'Player';
      if (fullPath.includes('team') || fullPath.includes('coach')) return 'Team';
      if (fullPath.includes('admin')) return 'Admin';
      if (fullPath.includes('login')) return 'Login';
      if (fullPath.includes('register')) return 'Registration';
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
  }
});

