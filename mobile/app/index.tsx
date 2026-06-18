import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase, isInvalidRefreshTokenError } from '../lib/supabase';
import { Colors } from '../../shared/constants/colors';

export default function IndexScreen() {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error && isInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut({ scope: 'local' });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.replace('/auth/login');
        return;
      }

      // Small delay for splash effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (session) {
        router.replace('/home');
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      if (isInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut({ scope: 'local' });
      }
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.appName}>AllyTZ Panel</Text>
        <Text style={styles.tagline}>PIPS HUNTING</Text>
        <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
          </View>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 64,
    fontFamily: 'Axiforma-Bold',
    color: '#000000',
  },
  appName: {
    fontSize: 36,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.gold,
    letterSpacing: 2,
  },
});
