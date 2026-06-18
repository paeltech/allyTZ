/**
 * Signal form and display constants (admin + user apps)
 */

export const SIGNAL_TRADING_PAIRS = ["XAUUSD"] as const;
export type SignalTradingPair = (typeof SIGNAL_TRADING_PAIRS)[number];
export const DEFAULT_SIGNAL_TRADING_PAIR: SignalTradingPair = "XAUUSD";

export const SIGNAL_ORDER_TYPES = [
  { value: "market" as const, label: "Market" },
  { value: "limit" as const, label: "Limit" },
  { value: "stop" as const, label: "Stop" },
];

export type SignalOrderType = (typeof SIGNAL_ORDER_TYPES)[number]["value"];

export function getSignalEntryPriceLabel(orderType: SignalOrderType | string | null | undefined): string {
  if (orderType === "limit") return "Limit price";
  if (orderType === "stop") return "Stop price";
  return "Entry price";
}

export function getSignalEntryPriceShortLabel(orderType: SignalOrderType | string | null | undefined): string {
  if (orderType === "limit") return "Limit";
  if (orderType === "stop") return "Stop";
  return "Entry";
}

export function formatSignalOrderType(orderType: SignalOrderType | string | null | undefined): string {
  if (orderType === "limit") return "Limit";
  if (orderType === "stop") return "Stop";
  return "Market";
}

/** UI labels for signal fields (DB column names unchanged) */
export const SIGNAL_FIELD_LABELS: Record<string, string> = {
  trading_pair: "Trading pair",
  signal_type: "Type",
  order_type: "Order type",
  entry_price: "Entry price",
  stop_loss: "Stop loss",
  take_profit_1: "TP1",
  take_profit_2: "TP2",
  take_profit_3: "TP3",
  title: "Reason for decision",
  analysis: "Notes",
  confidence_level: "Confidence",
  status: "Status",
};
