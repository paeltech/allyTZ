import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors } from '../../shared/constants/colors';
import {
  MENTAL_STATE_OPTIONS,
  TRADING_SESSION_OPTIONS,
} from '../../shared/constants/check-in';
import type { DailyCheckIn, DailyCheckInInput, MentalState, TradingSession } from '../../shared/types/check-in';
import { getEatDateString } from '../../shared/utils/eat-time';
import { supabase } from '../lib/supabase';

type Props = {
  userId: string;
  existingCheckIn?: DailyCheckIn | null;
  compact?: boolean;
  onSuccess: (checkIn: DailyCheckIn) => void;
  onCancel?: () => void;
};

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function DailyCheckInForm({
  userId,
  existingCheckIn,
  compact = false,
  onSuccess,
  onCancel,
}: Props) {
  const [isActive, setIsActive] = useState<boolean | null>(
    existingCheckIn?.is_active ?? null
  );
  const [sessions, setSessions] = useState<TradingSession[]>(
    existingCheckIn?.trading_sessions ?? []
  );
  const [mentalState, setMentalState] = useState<MentalState | null>(
    existingCheckIn?.mental_state ?? null
  );
  const [needsAssistance, setNeedsAssistance] = useState(
    existingCheckIn?.needs_assistance ?? false
  );
  const [assistanceNote, setAssistanceNote] = useState(
    existingCheckIn?.assistance_note ?? ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSession = (value: TradingSession) => {
    setSessions((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const validate = (): string | null => {
    if (isActive === null) return 'Please confirm if you are active today.';
    if (!mentalState) return 'Please select your mental state for today.';
    if (isActive && sessions.length === 0) {
      return 'Select at least one session you expect to be active in.';
    }
    if (needsAssistance && assistanceNote.trim().length < 5) {
      return 'Please briefly describe what you need help with.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: DailyCheckInInput = {
      is_active: isActive!,
      trading_sessions: isActive ? sessions : [],
      mental_state: mentalState!,
      needs_assistance: needsAssistance,
      assistance_note: needsAssistance ? assistanceNote.trim() : null,
    };

    const checkInDate = getEatDateString();

    try {
      let result: DailyCheckIn | null = null;

      if (existingCheckIn?.id) {
        const { data, error: updateError } = await supabase
          .from('daily_check_ins')
          .update(payload)
          .eq('id', existingCheckIn.id)
          .select('*')
          .single();
        if (updateError) throw updateError;
        result = data as DailyCheckIn;
      } else {
        const { data, error: insertError } = await supabase
          .from('daily_check_ins')
          .upsert(
            {
              user_id: userId,
              check_in_date: checkInDate,
              ...payload,
            },
            { onConflict: 'user_id,check_in_date' }
          )
          .select('*')
          .single();
        if (insertError) throw insertError;
        result = data as DailyCheckIn;
      }

      if (result) onSuccess(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save check-in';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <>
      <Text style={styles.sectionLabel}>Are you active on trading today?</Text>
      <View style={styles.rowChips}>
        <Chip label="Yes, I'm active" selected={isActive === true} onPress={() => setIsActive(true)} />
        <Chip label="No, not today" selected={isActive === false} onPress={() => setIsActive(false)} />
      </View>

      {isActive === true && (
        <>
          <Text style={styles.sectionLabel}>Sessions you'll be active in</Text>
          <View style={styles.wrapChips}>
            {TRADING_SESSION_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={sessions.includes(opt.value)}
                onPress={() => toggleSession(opt.value)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Mental state today</Text>
      <View style={styles.wrapChips}>
        {MENTAL_STATE_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={mentalState === opt.value}
            onPress={() => setMentalState(opt.value)}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Need assistance or want to talk to your mentor?</Text>
      <View style={styles.rowChips}>
        <Chip label="No, I'm good" selected={!needsAssistance} onPress={() => setNeedsAssistance(false)} />
        <Chip label="Yes, I need help" selected={needsAssistance} onPress={() => setNeedsAssistance(true)} />
      </View>

      {needsAssistance && (
        <View style={styles.noteBlock}>
          <Text style={styles.sectionLabel}>Describe your issue</Text>
          <TextInput
            style={styles.textArea}
            value={assistanceNote}
            onChangeText={setAssistanceNote}
            placeholder="Share what's on your mind or what you need support with..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            selectionColor={Colors.gold}
          />
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        {onCancel ? (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={submitting}>
            <Text style={styles.cancelButtonText}>Later</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.submitButton, onCancel ? { flex: 1 } : null]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingCheckIn ? 'Update check-in' : 'Submit check-in'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  if (compact) {
    return <View style={styles.form}>{content}</View>;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
  form: {
    paddingBottom: 8,
  },
  sectionLabel: {
    color: '#C8C8C8',
    fontSize: 13,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 10,
    marginTop: 14,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  chipSelected: {
    backgroundColor: 'rgba(244, 196, 100, 0.15)',
    borderColor: Colors.gold,
  },
  chipText: {
    color: '#A8A8A8',
    fontSize: 13,
    fontFamily: 'Axiforma-Medium',
  },
  chipTextSelected: {
    color: Colors.gold,
    fontFamily: 'Axiforma-SemiBold',
  },
  noteBlock: {
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    padding: 14,
    minHeight: 100,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  cancelButtonText: {
    color: '#A0A0A0',
    fontSize: 15,
    fontFamily: 'Axiforma-SemiBold',
  },
  submitButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
  },
});
