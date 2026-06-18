import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Edit3 } from 'lucide-react-native';
import { Colors } from '../../shared/constants/colors';
import type { Signal } from '../../shared/types/signal';
import {
  formatSignalOrderType,
  getSignalEntryPriceShortLabel,
} from '../../shared/constants/signals';

type SignalListCardProps = {
  signal: Signal;
  updateCount?: number;
  analysisLines?: number;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
};

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const createdAt = new Date(dateString);
  const diffMs = now.getTime() - createdAt.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} sec${diffSec === 1 ? '' : 's'} ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

function renderPrice(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—';
  return String(value);
}

export function SignalListCard({
  signal,
  updateCount = 0,
  analysisLines = 3,
  style,
  onPress,
}: SignalListCardProps) {
  const orderType = signal.order_type ?? 'market';
  const entryLabel = getSignalEntryPriceShortLabel(orderType);
  const isBuy = signal.signal_type === 'buy';
  const hasUpdates = updateCount > 0;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Part 1 — core signal details */}
      <View style={styles.coreSection}>
        <View style={styles.metaHeader}>
          <View style={styles.metaLeft}>
            <Text style={styles.pair}>{signal.trading_pair}</Text>
            <View style={styles.orderTypeBadge}>
              <Text style={styles.orderTypeText}>{formatSignalOrderType(orderType)}</Text>
            </View>
          </View>
          <View style={[styles.sideButton, isBuy ? styles.buyButton : styles.sellButton]}>
            <Text style={styles.sideButtonText}>{signal.signal_type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.priceHero}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>{entryLabel}</Text>
            <Text style={styles.priceValue}>{renderPrice(signal.entry_price)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>SL</Text>
            <Text style={[styles.priceValue, styles.slValue]}>{renderPrice(signal.stop_loss)}</Text>
          </View>
        </View>

        {(signal.take_profit_1 != null || signal.take_profit_2 != null) && (
          <View style={styles.tpRow}>
            {signal.take_profit_1 != null && (
              <View style={styles.tpItem}>
                <Text style={styles.tpLabel}>TP1</Text>
                <Text style={styles.tpValue}>{String(signal.take_profit_1)}</Text>
              </View>
            )}
            {signal.take_profit_2 != null && (
              <View style={styles.tpItem}>
                <Text style={styles.tpLabel}>TP2</Text>
                <Text style={styles.tpValue}>{String(signal.take_profit_2)}</Text>
              </View>
            )}
          </View>
        )}

        {hasUpdates && (
          <View style={styles.updateBadge}>
            <Edit3 size={12} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.updateBadgeText}>
              {updateCount} update{updateCount === 1 ? '' : 's'}
            </Text>
          </View>
        )}
      </View>

      {/* Part 2 — supporting context */}
      <View style={styles.supportingSection}>
          {signal.title?.trim() ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportLabel}>Reason for decision</Text>
              <Text style={styles.supportValue} numberOfLines={2}>{signal.title}</Text>
            </View>
          ) : null}

          {signal.analysis?.trim() ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportLabel}>Notes</Text>
              <Text style={styles.supportValue} numberOfLines={analysisLines}>{signal.analysis}</Text>
            </View>
          ) : null}

          <View style={styles.supportFooter}>
            <Text style={styles.timestamp}>{formatRelativeTime(signal.created_at)}</Text>
            {signal.confidence_level ? (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <Text style={styles.confidenceText}>
                  {signal.confidence_level.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#3A3A3A',
  },
  coreSection: {
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8,
  },
  pair: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  orderTypeBadge: {
    backgroundColor: 'rgba(244, 196, 100, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderTypeText: {
    color: Colors.gold,
    fontSize: 11,
    fontFamily: 'Axiforma-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sideButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 30,
    marginLeft: 8,
  },
  buyButton: {
    backgroundColor: '#22C55E',
  },
  sellButton: {
    backgroundColor: '#FF4444',
  },
  sideButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
  },
  priceHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 8,
  },
  priceLabel: {
    color: Colors.gold,
    fontSize: 11,
    fontFamily: 'Axiforma-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.3,
  },
  slValue: {
    color: '#FF8A8A',
  },
  tpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  tpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tpLabel: {
    color: '#9A9A9A',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    textTransform: 'uppercase',
  },
  tpValue: {
    color: '#F0F0F0',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  updateBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
  },
  supportingSection: {
    backgroundColor: '#2C2C2C',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  supportBlock: {
    marginBottom: 10,
  },
  supportLabel: {
    color: '#6E6E6E',
    fontSize: 10,
    fontFamily: 'Axiforma-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  supportValue: {
    color: '#A8A8A8',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 18,
  },
  supportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  timestamp: {
    color: '#6E6E6E',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confidenceLabel: {
    color: '#6E6E6E',
    fontFamily: 'Axiforma-Regular',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceText: {
    color: '#8A8A8A',
    fontFamily: 'Axiforma-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
