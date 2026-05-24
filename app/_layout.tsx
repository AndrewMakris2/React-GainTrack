import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';

const isWeb = Platform.OS === 'web';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)' as any);
      }
      setInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)' as any);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const content = (
    <>
      <StatusBar style="light" />
      {initializing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F0F' } }} />
      )}
    </>
  );

  if (isWeb) {
    return (
      <SafeAreaProvider>
        <View style={styles.webBg}>
          <View style={styles.glowLeft} />
          <View style={styles.glowRight} />
          <View style={styles.webFrame}>
            {content}
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {content}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webBg: {
    flex: 1,
    backgroundColor: '#060606',
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  glowLeft: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#F97316',
    opacity: 0.04,
    top: '10%',
    left: '10%',
  } as any,
  glowRight: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EAB308',
    opacity: 0.03,
    bottom: '15%',
    right: '10%',
  } as any,
  webFrame: {
    width: 430,
    height: '92vh',
    maxHeight: 900,
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  } as any,
});
