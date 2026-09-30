import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ScorerNavigator from './src/navigation/ScorerNavigator';

export default function App() {
  const [isScorerMode, setIsScorerMode] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const getIframe = (): HTMLIFrameElement | null =>
        document.getElementById('cfvd-main-frame') as HTMLIFrameElement | null;

      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'OPEN_SCORER_MODULE') {
          setIsScorerMode(true);
        }
        // Handle navigation messages from the iframe to update the top-level browser URL
        if (event.data && event.data.type === 'NAVIGATE' && event.data.route) {
          try {
            const route: string = event.data.route;
            const [path, queryString] = route.split('?');
            const fullUrl = window.location.origin + path + (queryString ? '?' + queryString : '');
            window.history.pushState({ iframeRoute: route }, '', fullUrl);
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

      // When user presses Back/Forward, tell the iframe to navigate to the matching route
      const handlePopState = (e: PopStateEvent) => {
        try {
          const route = (e.state && e.state.iframeRoute)
            ? e.state.iframeRoute
            : window.location.pathname + window.location.search;
          const iframe = getIframe();
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'NAVIGATE_TO', route }, '*');
          }
        } catch (e) {}
      };

      window.addEventListener('message', handleMessage);
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  if (isScorerMode) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <ScorerNavigator onExit={() => setIsScorerMode(false)} />
      </SafeAreaProvider>
    );
  }

  const renderWebView = () => {
    if (Platform.OS === 'web') {
      // Compute initial route from current URL path to support deep links
      const initialPath = (typeof window !== 'undefined' && window.location.pathname !== '/')
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
              setIsScorerMode(true);
            }
          } catch (e) {}
        }}
      />
    );
  };

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
        {renderWebView()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  webviewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020612',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: '#020612',
  },
  scorerFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#b8860b',
  },
  scorerFabText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
