export type TradingSession = 'asian' | 'london' | 'new_york';

export type MentalState =
  | 'focused'
  | 'neutral'
  | 'distracted'
  | 'stressed'
  | 'tired'
  | 'energized'
  | 'anxious'
  | 'motivated';

export interface DailyCheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  is_active: boolean;
  trading_sessions: TradingSession[];
  mental_state: MentalState;
  needs_assistance: boolean;
  assistance_note: string | null;
  created_at: string;
}

export interface DailyCheckInInput {
  is_active: boolean;
  trading_sessions: TradingSession[];
  mental_state: MentalState;
  needs_assistance: boolean;
  assistance_note?: string | null;
}

export type PhoneUsage = 'both' | 'whatsapp' | 'calls';

export interface PhoneContactPrefs {
  phone_number: string | null;
  phone_used_for_calls: boolean;
  phone_used_for_whatsapp: boolean;
  secondary_phone_number: string | null;
  secondary_phone_used_for_calls: boolean;
  secondary_phone_used_for_whatsapp: boolean;
  phone_contact_setup_completed_at: string | null;
}
