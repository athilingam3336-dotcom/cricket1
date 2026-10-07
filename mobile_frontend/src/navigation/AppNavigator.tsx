import React, { createContext, useState, useContext, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';

export type AppScreenName =
  | 'Home'
  | 'Login'
  | 'Registration'
  | 'Scorer'
  | 'Admin'
  | 'Player'
  | 'Coach'
  | 'Team'
  | 'Content';

interface AppNavigationContextType {
  currentScreen: AppScreenName;
  navigate: (screen: AppScreenName, params?: any) => void;
  params: any;
  goBack: () => void;
}

const AppNavigationContext = createContext<AppNavigationContextType>({
  currentScreen: 'Home',
  navigate: () => {},
  params: null,
  goBack: () => {}
});

export const useAppNavigation = () => useContext(AppNavigationContext);

interface AppNavigatorProps {
  children?: React.ReactNode;
  initialScreen?: AppScreenName;
  renderScreenContent?: (
    currentScreen: AppScreenName,
    navigate: (screen: AppScreenName, params?: any) => void,
    params: any
  ) => React.ReactNode;
}

export default function AppNavigator({
  children,
  initialScreen = 'Home',
  renderScreenContent
}: AppNavigatorProps) {
  // Check initial path on Web
  const getInitialScreen = (): AppScreenName => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('scorer')) return 'Scorer';
      if (p.includes('player')) return 'Player';
      if (p.includes('team') || p.includes('coach')) return 'Team';
      if (p.includes('login')) return 'Login';
      if (p.includes('register')) return 'Registration';
      if (p.includes('admin')) return 'Admin';
    }
    return initialScreen;
  };

  const [screenHistory, setScreenHistory] = useState<AppScreenName[]>([getInitialScreen()]);
  const [params, setParams] = useState<any>(null);

  const currentScreen = screenHistory[screenHistory.length - 1] || 'Home';

  const navigate = (screen: AppScreenName, screenParams?: any) => {
    const targetScreen: AppScreenName = screen === 'Coach' ? 'Team' : screen;
    setParams(screenParams || null);

    if (targetScreen === 'Home') {
      setScreenHistory(['Home']);
    } else {
      setScreenHistory((prev) => [...prev.filter((s) => s !== targetScreen), targetScreen]);
    }

    // Update browser URL if on Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        let route = '/';
        if (targetScreen === 'Login') route = '/login';
        else if (targetScreen === 'Registration') route = '/register';
        else if (targetScreen === 'Scorer') route = '/scorer';
        else if (targetScreen === 'Admin') route = '/admin';
        else if (targetScreen === 'Player') route = '/player';
        else if (targetScreen === 'Team') route = '/team';
        else if (targetScreen === 'Content') route = '/admin';
        else if (targetScreen === 'Home') route = '/';

        if (window.location.pathname !== route) {
          window.history.pushState({ appScreen: targetScreen }, '', route);
        }

        // If navigating to Home on Web, notify iframe to render home page
        if (targetScreen === 'Home') {
          const iframe = document.getElementById('cfvd-main-frame') as HTMLIFrameElement | null;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'NAVIGATE', route: '/' }, '*');
          }
        }
      } catch (e) {}
    }
  };

  const goBack = () => {
    setScreenHistory((prev) => {
      const next: AppScreenName[] = prev.length <= 1 ? ['Home'] : prev.slice(0, prev.length - 1);
      const targetScreen: AppScreenName = next[next.length - 1] || 'Home';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          let route = '/';
          if (targetScreen === 'Login') route = '/login';
          else if (targetScreen === 'Registration') route = '/register';
          else if (targetScreen === 'Scorer') route = '/scorer';
          else if (targetScreen === 'Admin') route = '/admin';
          else if (targetScreen === 'Player') route = '/player';
          else if (targetScreen === 'Team' || targetScreen === 'Coach') route = '/team';
          else if (targetScreen === 'Content') route = '/admin';
          else if (targetScreen === 'Home') route = '/';

          if (window.location.pathname !== route) {
            window.history.pushState({ appScreen: targetScreen }, '', route);
          }

          if (targetScreen === 'Home') {
            const iframe = document.getElementById('cfvd-main-frame') as HTMLIFrameElement | null;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'NAVIGATE', route: '/' }, '*');
            }
          }
        } catch (e) {}
      }
      return next;
    });
  };

  // Sync browser back/forward buttons on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePopState = (e: PopStateEvent) => {
        if (e.state && e.state.appScreen) {
          setScreenHistory((prev) => [...prev, e.state.appScreen]);
        } else {
          const path = window.location.pathname;
          if (path.includes('admin')) {
            setScreenHistory(['Admin']);
          } else if (path.includes('scorer')) {
            setScreenHistory(['Scorer']);
          } else if (path.includes('player')) {
            setScreenHistory(['Player']);
          } else if (path.includes('team') || path.includes('coach')) {
            setScreenHistory(['Team']);
          } else if (path.includes('login')) {
            setScreenHistory(['Login']);
          } else if (path.includes('register')) {
            setScreenHistory(['Registration']);
          } else {
            setScreenHistory(['Home']);
          }
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  return (
    <AppNavigationContext.Provider value={{ currentScreen, navigate, params, goBack }}>
      <View style={styles.container}>
        {renderScreenContent ? renderScreenContent(currentScreen, navigate, params) : children}
      </View>
    </AppNavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#020612'
  }
});
