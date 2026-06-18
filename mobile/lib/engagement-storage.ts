import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKIN_PROMPT_KEY = '@allytz/checkin_prompt_v1';

export type CheckInPromptState = {
  date: string;
  block: number;
};

export async function getLastCheckInPrompt(): Promise<CheckInPromptState | null> {
  try {
    const raw = await AsyncStorage.getItem(CHECKIN_PROMPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckInPromptState;
  } catch {
    return null;
  }
}

export async function setLastCheckInPrompt(date: string, block: number): Promise<void> {
  await AsyncStorage.setItem(CHECKIN_PROMPT_KEY, JSON.stringify({ date, block }));
}
