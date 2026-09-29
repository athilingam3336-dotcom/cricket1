import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ScorerNavigator from './src/navigation/ScorerNavigator';

export default function App() {
  const [isScorerMode, setIsScorerMode] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'OPEN_SCORER_MODULE') {
          setIsScorerMode(true);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
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
      return (
        <View style={styles.webviewContainer}>
          {/* @ts-ignore */}
          <iframe
            src="/bundled.html"
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
