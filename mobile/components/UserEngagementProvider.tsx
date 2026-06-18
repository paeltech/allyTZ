import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { SIGNUP_PHONE_PROMPT_HOURS } from '../../shared/constants/check-in';
import { getEatDateString, getEatFourHourBlock, isWithinHoursOfSignup } from '../../shared/utils/eat-time';
import type { DailyCheckIn } from '../../shared/types/check-in';
import { getLastCheckInPrompt, setLastCheckInPrompt } from '../lib/engagement-storage';
import { DailyCheckInModal } from './DailyCheckInModal';
import { PhoneContactSetupModal } from './PhoneContactSetupModal';
import { checkIsAdmin } from '../lib/admin';

type Props = { children: React.ReactNode };

function isAuthRoute(segments: string[]): boolean {
  return segments[0] === 'auth' || segments.length === 0;
}

function isAdminRoute(segments: string[]): boolean {
  return segments[0] === 'admin';
}

export function UserEngagementProvider({ children }: Props) {
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [profilePhone, setProfilePhone] = useState('');
  const [phonePrefs, setPhonePrefs] = useState<Record<string, unknown>>({});
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const evaluatingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadEngagementState = useCallback(async (userId: string) => {
    const today = getEatDateString();
    const [{ data: checkIn }, { data: profile }] = await Promise.all([
      supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select(
          'phone_number, phone_used_for_calls, phone_used_for_whatsapp, secondary_phone_number, secondary_phone_used_for_calls, secondary_phone_used_for_whatsapp, phone_contact_setup_completed_at'
        )
        .eq('id', userId)
        .maybeSingle(),
    ]);

    setTodayCheckIn((checkIn as DailyCheckIn) ?? null);
    setProfilePhone(profile?.phone_number ?? '');
    setPhonePrefs(profile ?? {});
    return { checkIn, profile };
  }, []);

  const evaluatePrompts = useCallback(async () => {
    if (!session?.user || isAuthRoute(segments as string[]) || isAdminRoute(segments as string[]) || evaluatingRef.current) return;

    evaluatingRef.current = true;
    try {
      const isAdmin = await checkIsAdmin(session.user.id);
      if (isAdmin) return;
      const { checkIn, profile } = await loadEngagementState(session.user.id);
      const eatDate = getEatDateString();
      const block = getEatFourHourBlock();

      const needsPhonePrompt =
        isWithinHoursOfSignup(session.user.created_at, SIGNUP_PHONE_PROMPT_HOURS) &&
        !profile?.phone_contact_setup_completed_at;

      if (needsPhonePrompt) {
        setShowPhone(true);
        setShowCheckIn(false);
        return;
      }

      if (checkIn) {
        setShowCheckIn(false);
        return;
      }

      const lastPrompt = await getLastCheckInPrompt();
      const shouldPromptCheckIn =
        !lastPrompt ||
        lastPrompt.date !== eatDate ||
        block > lastPrompt.block;

      if (shouldPromptCheckIn) {
        await setLastCheckInPrompt(eatDate, block);
        setShowCheckIn(true);
      }
    } finally {
      evaluatingRef.current = false;
    }
  }, [session, segments, loadEngagementState]);

  useEffect(() => {
    if (!session?.user) {
      setShowCheckIn(false);
      setShowPhone(false);
      return;
    }
    void evaluatePrompts();
    const interval = setInterval(() => void evaluatePrompts(), 60_000);
    return () => clearInterval(interval);
  }, [session, segments, evaluatePrompts]);

  const handleCheckInSuccess = (checkIn: DailyCheckIn) => {
    setTodayCheckIn(checkIn);
    setShowCheckIn(false);
  };

  const handlePhoneSuccess = async () => {
    setShowPhone(false);
    if (session?.user) await loadEngagementState(session.user.id);
  };

  return (
    <>
      {children}
      {session?.user ? (
        <>
          <DailyCheckInModal
            visible={showCheckIn}
            userId={session.user.id}
            existingCheckIn={todayCheckIn}
            onClose={() => setShowCheckIn(false)}
            onSuccess={handleCheckInSuccess}
          />
          <PhoneContactSetupModal
            visible={showPhone}
            userId={session.user.id}
            initialPhone={profilePhone}
            initialValues={{
              phone_number: profilePhone,
              phone_used_for_calls: Boolean(phonePrefs.phone_used_for_calls ?? true),
              phone_used_for_whatsapp: Boolean(phonePrefs.phone_used_for_whatsapp ?? true),
              secondary_phone_number: (phonePrefs.secondary_phone_number as string) ?? '',
              secondary_phone_used_for_calls: Boolean(phonePrefs.secondary_phone_used_for_calls),
              secondary_phone_used_for_whatsapp: Boolean(phonePrefs.secondary_phone_used_for_whatsapp),
            }}
            onClose={() => setShowPhone(false)}
            onSuccess={handlePhoneSuccess}
          />
        </>
      ) : null}
    </>
  );
}
