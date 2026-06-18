import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors } from '../../../shared/constants/colors';

type Props = {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
  style?: ViewStyle;
};

export function StatCard({ label, value, subtitle, accent = Colors.gold, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 28,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 4,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Axiforma-Medium',
  },
  subtitle: {
    color: Colors.rainyGrey,
    fontSize: 11,
    fontFamily: 'Axiforma-Regular',
    marginTop: 4,
  },
});
