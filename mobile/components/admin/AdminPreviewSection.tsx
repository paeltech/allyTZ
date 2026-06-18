import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../shared/constants/colors';

type Props = {
  label: string;
  value: string | number | null | undefined;
};

export function AdminDetailRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

type SectionProps = { title: string; children: React.ReactNode };

export function AdminPreviewSection({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 12,
  },
  label: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 13, flex: 1 },
  value: { color: '#FFF', fontFamily: 'Axiforma-Medium', fontSize: 13, flex: 1.2, textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionBody: { backgroundColor: '#2A2A2A', borderRadius: 14, padding: 14 },
});
