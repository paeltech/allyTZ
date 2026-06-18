export type TradingTipContentKind = 'tip' | 'quote';

export interface TradingTip {
  id: string;
  title: string;
  body: string;
  content_kind: TradingTipContentKind;
  sort_order: number;
  active: boolean;
  created_at: string;
}
