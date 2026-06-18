import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { DailyCheckIn } from '../../shared/types/check-in';
import { DailyCheckInForm } from './DailyCheckInForm';
import { X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  userId: string;
  existingCheckIn?: DailyCheckIn | null;
  onClose: () => void;
  onSuccess: (checkIn: DailyCheckIn) => void;
};

export function DailyCheckInModal({ visible, userId, existingCheckIn, onClose, onSuccess }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Daily check-in</Text>
              <Text style={styles.subtitle}>
                Help us know how you're doing and when you're available today (EAT).
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <X size={22} color="#A0A0A0" />
            </TouchableOpacity>
          </View>
          <DailyCheckInForm
            userId={userId}
            existingCheckIn={existingCheckIn}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(244, 196, 100, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
