import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useIsAdmin } from '../../hooks/use-is-admin';
import { Colors } from '../../../shared/constants/colors';

export default function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      router.replace('/home');
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="users" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="check-ins" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="signals" />
      <Stack.Screen name="analyses" />
      <Stack.Screen name="events" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="tips" />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
