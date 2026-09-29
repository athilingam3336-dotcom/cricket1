import React from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020612" />
        {/* @ts-ignore */}
        <iframe
          src="/bundled.html"
          style={styles.iframe as any}
          title="Cricket Federation Portal"
        />
      </View>
    );
  }

  // Native iOS / Android WebView
  const { WebView } = require('react-native-webview');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#020612" />
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
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020612',
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
});
