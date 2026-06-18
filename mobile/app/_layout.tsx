import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { PushNotificationProvider } from '../components/PushNotificationProvider';
import { UserEngagementProvider } from '../components/UserEngagementProvider';
import { UserRouteGuard } from '../components/UserRouteGuard';
import { recoverFromInvalidRefreshToken } from '../lib/supabase';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
};

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Axiforma-Regular': require('../assets/fonts/Kastelov - Axiforma Regular.otf'),
    'Axiforma-Medium': require('../assets/fonts/Kastelov - Axiforma Medium.otf'),
    'Axiforma-SemiBold': require('../assets/fonts/Kastelov - Axiforma SemiBold.otf'),
    'Axiforma-Bold': require('../assets/fonts/Kastelov - Axiforma Bold.otf'),
    'Axiforma-Book': require('../assets/fonts/Kastelov - Axiforma Book.otf'),
  });

  const [bootstrapReady, setBootstrapReady] = useState(false);

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  /* Hide splash and mount tree only after auth storage is validated. Otherwise PushNotificationProvider
   * and other code race getSession() with recoverFromInvalidRefreshToken and LogBox shows refresh errors. */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!fontsLoaded && !fontError) return;

      await recoverFromInvalidRefreshToken();
      if (cancelled) return;

      setBootstrapReady(true);
      await SplashScreen.hideAsync();
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!bootstrapReady) {
    return null;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <QueryClientProvider client={queryClient}>
          <PushNotificationProvider>
          <UserEngagementProvider>
          <UserRouteGuard>
          <View style={{ flex: 1, backgroundColor: '#000000' }}>
            <Stack screenOptions={screenOptions}>
              <Stack.Screen name="index" />
              <Stack.Screen name="admin" />
              <Stack.Screen name="auth/login" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="auth/reset-password" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="home" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="delete-account" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="signals" />
              <Stack.Screen name="signals/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="analysis/index" />
              <Stack.Screen name="analysis/[id]" />
              <Stack.Screen name="documents/index" />
              <Stack.Screen name="documents/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="events/index" />
              <Stack.Screen name="events/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="help" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="notification-preferences" />
              <Stack.Screen name="terms" />
              <Stack.Screen name="privacy" />
              <Stack.Screen name="about" />
              <Stack.Screen name="faq" />
              <Stack.Screen name="tips" />
              <Stack.Screen name="messages" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </View>
          </UserRouteGuard>
          </UserEngagementProvider>
          </PushNotificationProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F4C464',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
