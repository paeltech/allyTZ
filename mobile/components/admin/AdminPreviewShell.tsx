import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../shared/constants/colors';
import { AdminScreenHeader } from './AdminScreenHeader';

type Props = {
  title: string;
  subtitle?: string;
  editHref: string;
  loading: boolean;
  children: React.ReactNode;
};

export function AdminPreviewShell({ title, subtitle, editHref, loading, children }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AdminScreenHeader title={title} subtitle={subtitle ?? 'Preview'} showBack />
        {loading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          <>
            {children}
            <TouchableOpacity style={styles.editButton} onPress={() => router.push(editHref)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  editButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
