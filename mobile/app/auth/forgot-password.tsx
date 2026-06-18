import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../../shared/constants/colors';
import { Mail } from 'lucide-react-native';

// Redirect URL for password reset email. Add this exact URL to Supabase Auth > URL Configuration > Redirect URLs.
const PASSWORD_RESET_REDIRECT_URL = 'allytz-panel://auth/reset-password';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: PASSWORD_RESET_REDIRECT_URL,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Check your email',
        "We've sent you a link to reset your password. Open the link from this device to set a new password.",
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Mail size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              selectionColor={Colors.gold}
              autoComplete="email"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSendResetLink}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backLinkText}>Back to sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
  },
  submitButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  backLink: {
    alignSelf: 'center',
  },
  backLinkText: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
  },
});
