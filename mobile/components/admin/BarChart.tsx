import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../shared/constants/colors';

export type BarChartItem = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  title: string;
  items: BarChartItem[];
  emptyMessage?: string;
};

export function BarChart({ title, items, emptyMessage = 'No data yet' }: Props) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const hasData = items.some((i) => i.value > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {!hasData ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        items.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color ?? Colors.gold,
                  },
                ]}
              />
            </View>
            <Text style={styles.count}>{item.value}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 14,
  },
  empty: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: Colors.rainyGrey,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    width: 88,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 2,
  },
  count: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    width: 28,
    textAlign: 'right',
  },
});
