import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../shared/constants/colors';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react-native';

export type PhoneContactFormValues = {
  phone_number: string;
  phone_used_for_calls: boolean;
  phone_used_for_whatsapp: boolean;
  secondary_phone_number: string;
  secondary_phone_used_for_calls: boolean;
  secondary_phone_used_for_whatsapp: boolean;
};

type Props = {
  visible: boolean;
  userId: string;
  initialPhone: string;
  initialValues?: Partial<PhoneContactFormValues>;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSuccess: () => void;
};

function ToggleChip({
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
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PhoneContactSetupModal({
  visible,
  userId,
  initialPhone,
  initialValues,
  title = 'Confirm your contact numbers',
  subtitle = 'Let us know how to reach you for calls and WhatsApp.',
  onClose,
  onSuccess,
}: Props) {
  const [sameForBoth, setSameForBoth] = useState<boolean | null>(() => {
    if (
      initialValues?.phone_used_for_calls &&
      initialValues?.phone_used_for_whatsapp &&
      !initialValues?.secondary_phone_number
    ) {
      return true;
    }
    if (
      initialValues?.phone_number &&
      (!initialValues.phone_used_for_calls || !initialValues.phone_used_for_whatsapp)
    ) {
      return false;
    }
    return null;
  });
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || initialValues?.phone_number || '');
  const [primaryCalls, setPrimaryCalls] = useState(initialValues?.phone_used_for_calls ?? true);
  const [primaryWhatsapp, setPrimaryWhatsapp] = useState(initialValues?.phone_used_for_whatsapp ?? true);
  const [secondaryPhone, setSecondaryPhone] = useState(initialValues?.secondary_phone_number ?? '');
  const [secondaryCalls, setSecondaryCalls] = useState(initialValues?.secondary_phone_used_for_calls ?? false);
  const [secondaryWhatsapp, setSecondaryWhatsapp] = useState(initialValues?.secondary_phone_used_for_whatsapp ?? false);
  const [submitting, setSubmitting] = useState(false);

  const handleSameForBoth = (same: boolean) => {
    setSameForBoth(same);
    if (same) {
      setPrimaryCalls(true);
      setPrimaryWhatsapp(true);
      setSecondaryPhone('');
      setSecondaryCalls(false);
      setSecondaryWhatsapp(false);
    }
  };

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone required', 'Please enter your primary phone number.');
      return;
    }
    if (sameForBoth === null) {
      Alert.alert('Selection required', 'Please confirm if you use the same number for calls and WhatsApp.');
      return;
    }
    if (!sameForBoth && !primaryCalls && !primaryWhatsapp) {
      Alert.alert('Usage required', 'Select what your primary number is used for.');
      return;
    }
    if (!sameForBoth && secondaryPhone.trim() && !secondaryCalls && !secondaryWhatsapp) {
      Alert.alert('Secondary usage', 'Select what your second number is used for.');
      return;
    }

    setSubmitting(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        phone_number: phoneNumber.trim(),
        phone_used_for_calls: sameForBoth ? true : primaryCalls,
        phone_used_for_whatsapp: sameForBoth ? true : primaryWhatsapp,
        secondary_phone_number: sameForBoth ? null : secondaryPhone.trim() || null,
        secondary_phone_used_for_calls: sameForBoth ? false : secondaryCalls,
        secondary_phone_used_for_whatsapp: sameForBoth ? false : secondaryWhatsapp,
        phone_contact_setup_completed_at: now,
        updated_at: now,
      });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', 'Could not save contact preferences. Please try again.');
      return;
    }

    await supabase.auth.updateUser({
      data: { phone: phoneNumber.trim() },
    });

    onSuccess();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={22} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Primary number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="+255..."
              placeholderTextColor="#666"
              selectionColor={Colors.gold}
            />

            <Text style={styles.label}>Use this number for both calls and WhatsApp?</Text>
            <View style={styles.row}>
              <ToggleChip label="Yes, same number" selected={sameForBoth === true} onPress={() => handleSameForBoth(true)} />
              <ToggleChip label="No, different" selected={sameForBoth === false} onPress={() => handleSameForBoth(false)} />
            </View>

            {sameForBoth === false && (
              <>
                <Text style={styles.label}>What is this number used for?</Text>
                <View style={styles.row}>
                  <ToggleChip label="Calls" selected={primaryCalls} onPress={() => setPrimaryCalls((v) => !v)} />
                  <ToggleChip label="WhatsApp" selected={primaryWhatsapp} onPress={() => setPrimaryWhatsapp((v) => !v)} />
                </View>

                <Text style={styles.label}>Second number (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={secondaryPhone}
                  onChangeText={setSecondaryPhone}
                  keyboardType="phone-pad"
                  placeholder="Other number for calls or WhatsApp"
                  placeholderTextColor="#666"
                  selectionColor={Colors.gold}
                />

                {secondaryPhone.trim().length > 0 && (
                  <>
                    <Text style={styles.label}>Second number is used for</Text>
                    <View style={styles.row}>
                      <ToggleChip label="Calls" selected={secondaryCalls} onPress={() => setSecondaryCalls((v) => !v)} />
                      <ToggleChip label="WhatsApp" selected={secondaryWhatsapp} onPress={() => setSecondaryWhatsapp((v) => !v)} />
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.laterBtn} onPress={onClose} disabled={submitting}>
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(244, 196, 100, 0.25)',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9A9A9A',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 18,
  },
  closeBtn: { padding: 4, marginLeft: 8 },
  label: {
    color: '#C8C8C8',
    fontSize: 13,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: {
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  laterBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  laterText: {
    color: '#A0A0A0',
    fontFamily: 'Axiforma-SemiBold',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#000',
    fontFamily: 'Axiforma-Bold',
    fontSize: 15,
  },
});
