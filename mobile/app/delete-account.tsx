import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Trash2, AlertTriangle, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { deleteUserAccount } from '../lib/delete-account';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountScreen() {
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canSubmit =
    understood &&
    confirmationText.trim().toUpperCase() === CONFIRM_WORD &&
    !isDeleting;

  const runDeletion = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      Alert.alert('Not signed in', 'Please log in and try again.');
      router.replace('/auth/login');
      return;
    }

    setIsDeleting(true);
    try {
      if (reason.trim()) {
        try {
          await supabase.from('enquiries').insert({
            user_id: session.user.id,
            name: session.user.user_metadata?.full_name || 'App user',
            email: session.user.email || '',
            enquiry_type: 'other',
            subject: 'Account deletion (mobile)',
            message: reason.trim(),
            status: 'pending',
          });
        } catch {
          // Do not block deletion if optional feedback fails to save
        }
      }

      const result = await deleteUserAccount(session.user.id);
      if (!result.ok) {
        Alert.alert('Deletion failed', result.message);
        return;
      }

      await supabase.auth.signOut({ scope: 'local' });

      Alert.alert(
        'Account deleted',
        'Your account and associated data have been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (e) {
      console.error('Account deletion error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again or email info@allytz.co.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePress = () => {
    if (!canSubmit) {
      if (!understood) {
        Alert.alert('Confirmation required', 'Please confirm you understand this action is permanent.');
      } else {
        Alert.alert('Type DELETE', `Type ${CONFIRM_WORD} in the box to confirm.`);
      }
      return;
    }

    Alert.alert(
      'Delete account permanently?',
      'This cannot be undone. All profile data, preferences, registrations, and your login will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () => void runDeletion(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isDeleting}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <Trash2 size={28} color="#EF4444" strokeWidth={2} />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.title}>Permanent account deletion</Text>
            <Text style={styles.subtitle}>
              This removes your AllyTZ Panel account and data from our systems. It is not a temporary deactivation.
            </Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <AlertTriangle size={22} color="#EF4444" strokeWidth={2} />
          <Text style={styles.warningText}>
            This action cannot be undone. The following will be permanently deleted:
          </Text>
          <Text style={styles.bullet}>• Profile and contact information</Text>
          <Text style={styles.bullet}>• Notification preferences and device tokens</Text>
          <Text style={styles.bullet}>• Event registrations and in-app activity tied to your account</Text>
          <Text style={styles.bullet}>• Your ability to sign in with this account</Text>
        </View>

        <View style={styles.infoCard}>
          <Shield size={20} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.infoText}>
            Deletion is completed in this app. You do not need to email support to finish. Optional feedback below is only used to improve AllyTZ Panel.
          </Text>
        </View>

        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput
          style={styles.textArea}
          value={reason}
          onChangeText={setReason}
          placeholder="Tell us why you're leaving..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isDeleting}
          selectionColor={Colors.gold}
        />

        <View style={styles.switchRow}>
          <Switch
            value={understood}
            onValueChange={setUnderstood}
            disabled={isDeleting}
            trackColor={{ false: '#3A3A3A', true: Colors.gold }}
            thumbColor="#FFFFFF"
          />
          <Text style={styles.switchLabel}>
            I understand this is permanent and I want to delete my account and associated data.
          </Text>
        </View>

        <Text style={styles.label}>
          Type <Text style={styles.deleteWord}>{CONFIRM_WORD}</Text> to confirm
        </Text>
        <TextInput
          style={styles.input}
          value={confirmationText}
          onChangeText={(t) => setConfirmationText(t.toUpperCase())}
          placeholder={CONFIRM_WORD}
          placeholderTextColor="#666666"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isDeleting}
          selectionColor={Colors.gold}
        />

        <TouchableOpacity
          style={[styles.deleteButton, !canSubmit && styles.deleteButtonDisabled]}
          onPress={handleDeletePress}
          disabled={!canSubmit}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteButtonText}>Permanently delete my account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isDeleting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Questions? Contact info@allytz.co before deleting if you need help.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: 'rgba(127, 29, 29, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#FECACA',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 8,
  },
  bullet: {
    color: '#E0E0E0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  infoText: {
    flex: 1,
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 19,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 8,
  },
  deleteWord: {
    color: '#EF4444',
    fontFamily: 'Axiforma-Bold',
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    minHeight: 100,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 2,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  switchLabel: {
    flex: 1,
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
  },
  footerNote: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
});
