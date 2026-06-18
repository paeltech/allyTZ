import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatAuthErrorMessage } from '../../lib/auth-errors';
import { supabase, canReachSupabase } from '../../lib/supabase';
import { Colors } from '../../../shared/constants/colors';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

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

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Login Failed', formatAuthErrorMessage(error));
        return;
      }

      if (data.session) {
        router.replace('/home');
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.appName}>AllyTZ Panel</Text>
            <Text style={styles.tagline}>PIPS HUNTING</Text>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue trading</Text>
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              selectionColor={Colors.gold}
              autoComplete="password"
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontFamily: 'Axiforma-Bold',
    color: '#000000',
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    color: Colors.gold,
    letterSpacing: 2,
  },
  welcomeContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
  },
  loginButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: Colors.rainyGrey,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
  },
  signupLink: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
  },
});
