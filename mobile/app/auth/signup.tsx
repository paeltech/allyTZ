import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatAuthErrorMessage } from '../../lib/auth-errors';
import { supabase, canReachSupabase } from '../../lib/supabase';
import { Colors } from '../../../shared/constants/colors';
import { Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed.length > 0 && phoneTrimmed.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number or leave it blank');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);

      const reachable = await canReachSupabase();
      if (!reachable) {
        Alert.alert(
          'Connection problem',
          'AllyTZ Panel could not reach the server. Check Wi‑Fi or cellular data, turn off VPN if you use one, then try again.'
        );
        return;
      }

      const phoneTrimmed = phone.trim();
      const hasPhone = phoneTrimmed.length > 0;
      const fullPhoneForMetadata = hasPhone
        ? phoneTrimmed.startsWith('+')
          ? phoneTrimmed
          : `+${phoneTrimmed}`
        : undefined;

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            ...(fullPhoneForMetadata ? { phone: fullPhoneForMetadata } : {}),
          },
        },
      });

      if (authError) {
        Alert.alert('Signup Failed', formatAuthErrorMessage(authError));
        return;
      }

      if (authData.user) {
        const fullPhoneNumber = fullPhoneForMetadata ?? '';
        const { error: profileError } = await supabase.rpc('update_user_profile_on_signup', {
          user_id: authData.user.id,
          phone_number_param: fullPhoneNumber,
          phone_verified_param: hasPhone,
          whatsapp_notifications_param: hasPhone,
          email_notifications_param: true,
          full_name_param: fullName.trim() || null,
        });

        if (profileError) {
          console.warn('Profile update after signup:', profileError.message);
        }

        Alert.alert(
          'Success',
          'Account created successfully! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      }
    } catch (error: unknown) {
      Alert.alert('Error', formatAuthErrorMessage(error));
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
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={28} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join AllyTZ Panel and start trading</Text>
          </View>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <UserIcon size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666666"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
              selectionColor={Colors.gold}
              autoComplete="name"
            />
          </View>

          {/* Email Input */}
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

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Phone size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              placeholderTextColor="#666666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
              selectionColor={Colors.gold}
              autoComplete="tel"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              selectionColor={Colors.gold}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.rainyGrey} strokeWidth={2} />
              ) : (
                <Eye size={20} color={Colors.rainyGrey} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
              selectionColor={Colors.gold}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={Colors.rainyGrey} strokeWidth={2} />
              ) : (
                <Eye size={20} color={Colors.rainyGrey} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Required Field Note */}
          <Text style={styles.requiredNote}>
            Add a phone number for WhatsApp updates (optional).
          </Text>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
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
  eyeIcon: {
    padding: 4,
  },
  requiredNote: {
    color: Colors.rainyGrey,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  signupButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  loginText: {
    color: Colors.rainyGrey,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
  },
  loginLink: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
  },
});
