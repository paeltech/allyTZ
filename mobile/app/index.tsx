import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase, isInvalidRefreshTokenError } from '../lib/supabase';
import { getPostAuthRoute } from '../lib/admin';
import { Colors } from '../../shared/constants/colors';
import { AppLogo } from '../components/AppLogo';

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

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (session) {
        const route = await getPostAuthRoute();
        router.replace(route);
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
      <AppLogo />
      <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
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
});
