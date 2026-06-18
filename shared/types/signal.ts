/**
 * Shared Signal types
 * Used by both web and mobile apps
 */
export interface Signal {
  id: string;
  trading_pair: string;
  signal_type: "buy" | "sell";
  order_type: "market" | "limit" | "stop";
  entry_price: number;
  stop_loss: number;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  title: string;
  analysis: string | null;
  confidence_level: "low" | "medium" | "high" | null;
  status: "active" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface SignalPricing {
  id: string;
  pricing_type: "monthly" | "per_pip";
  price: number;
  currency: string;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
}

/** Single field change (old → new) */
export interface SignalFieldChange {
  old: number | string | null;
  new: number | string | null;
}

/** One revision in signal history: either initial snapshot or an update diff */
export interface SignalUpdate {
  id: string;
  signal_id: string;
  revision_type: "initial" | "update";
  /** Set for revision_type 'initial': full snapshot of signal at first update */
  snapshot?: Record<string, unknown> | null;
  /** Set for revision_type 'update': { "stop_loss": { "old": x, "new": y }, ... } */
  changes?: Record<string, SignalFieldChange> | null;
  created_at: string;
}

export type SignalPostType = "feedback" | "update" | "question" | "query";
export type SignalPostAudience = "all_users" | "admin_only";

/** User or admin post on a signal thread */
export interface SignalPost {
  id: string;
  signal_id: string;
  author_id: string;
  post_type: SignalPostType;
  audience: SignalPostAudience;
  summary: string;
  attachment_path: string | null;
  author_display_name: string | null;
  created_at: string;
  author?: {
    full_name: string | null;
    email: string | null;
  } | null;
}
