import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, MessageSquare, Send, Mail, Phone } from 'lucide-react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

const enquiryTypes = [
  { value: '', label: 'Select enquiry type...' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'trading', label: 'Trading Support' },
  { value: 'signals', label: 'Trading signals' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Account & access' },
  { value: 'partnership', label: 'Partnership Opportunities' },
  { value: 'other', label: 'Other' },
];

export default function HelpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enquiryType, setEnquiryType] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { unreadCount } = useUnreadNotificationsCount();

  const handleSubmit = async () => {
    // Validation
    if (!name || name.length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters');
      return;
    }
    if (!email || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }
    if (!enquiryType) {
      Alert.alert('Validation Error', 'Please select an enquiry type');
      return;
    }
    if (!subject || subject.length < 5) {
      Alert.alert('Validation Error', 'Subject must be at least 5 characters');
      return;
    }
    if (!message || message.length < 10) {
      Alert.alert('Validation Error', 'Message must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const payload = {
        user_id: session?.user?.id || null,
        name,
        email,
        phone: phone || null,
        enquiry_type: enquiryType,
        subject,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('enquiries').insert(payload);

      if (error) {
        console.error('Error submitting enquiry:', error);
        Alert.alert('Error', 'Failed to submit enquiry. Please try again.');
      } else {
        Alert.alert(
          'Success',
          "Your enquiry has been submitted successfully! We'll get back to you soon.",
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setName('');
                setEmail('');
                setPhone('');
                setEnquiryType('');
                setSubject('');
                setMessage('');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Enquiry submission error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <MessageSquare size={32} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.heroTitle}>How Can We Help?</Text>
          <Text style={styles.heroDescription}>
            Send us your enquiry and our team will get back to you as soon as possible
          </Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get In Touch</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Mail size={18} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.contactText}>info@allytz.co</Text>
            </View>
            <View style={styles.contactRow}>
              <Phone size={18} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.contactText}>+255716885996</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactText}>Dar es salaam, Tanzania</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactText}>www.allytz.co</Text>
            </View>
          </View>
        </View>

        {/* Enquiry Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Send Enquiry</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#A0A0A0"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+255716885996"
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Enquiry Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={enquiryType}
                onValueChange={(itemValue) => setEnquiryType(itemValue)}
                style={styles.picker}
                dropdownIconColor={Colors.gold}
              >
                {enquiryTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subject *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief subject of your enquiry"
              placeholderTextColor="#A0A0A0"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your enquiry in detail..."
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              selectionColor={Colors.gold}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Send size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.formNote}>
            * Required fields. We typically respond within 24 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Axiforma-Bold',
    lineHeight: 12,
  },
  heroCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 22,
  },
  contactSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactText: {
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    marginLeft: 12,
  },
  formSection: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  pickerContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: '#2A2A2A',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  formNote: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 16,
  },
});
