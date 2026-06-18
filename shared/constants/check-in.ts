import type { MentalState, TradingSession } from '../types/check-in';

export const TRADING_SESSION_OPTIONS: { value: TradingSession; label: string }[] = [
  { value: 'asian', label: 'Asian session' },
  { value: 'london', label: 'London session' },
  { value: 'new_york', label: 'New York session' },
];

export const MENTAL_STATE_OPTIONS: { value: MentalState; label: string }[] = [
  { value: 'focused', label: 'Focused' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'distracted', label: 'Distracted' },
  { value: 'stressed', label: 'Stressed' },
  { value: 'tired', label: 'Tired' },
  { value: 'energized', label: 'Energized' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'motivated', label: 'Motivated' },
];

export const EAT_TIMEZONE = 'Africa/Nairobi';

/** Four-hour blocks from 00:00 EAT: 0=00-03, 1=04-07, … 5=20-23 */
export const CHECK_IN_BLOCK_HOURS = 4;
export const SIGNUP_PHONE_PROMPT_HOURS = 10;
