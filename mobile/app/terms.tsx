import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, FileText } from 'lucide-react-native';
import { router } from 'expo-router';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <FileText size={48} color={Colors.gold} strokeWidth={1.5} />
        </View>

        <Text style={styles.lastUpdated}>Last updated: January 15, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using AllyTZ Panel ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms & Conditions, please do not use the Service.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          AllyTZ Panel provides forex trading education, signals, analysis, and related content. We are an educational platform and do not provide financial advice. All content is for informational and educational purposes only.
        </Text>

        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You agree to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide accurate and complete information when creating your account</Text>
        <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
        <Text style={styles.bulletPoint}>• Not share your account with others</Text>
        <Text style={styles.bulletPoint}>• Use the Service in compliance with all applicable laws and regulations</Text>
        <Text style={styles.bulletPoint}>• Not use the Service for any illegal or unauthorized purpose</Text>

        <Text style={styles.sectionTitle}>4. Trading Risks</Text>
        <Text style={styles.paragraph}>
          Trading forex involves substantial risk of loss and is not suitable for everyone. Past performance does not guarantee future results. You should not invest money that you cannot afford to lose.
        </Text>
        <Text style={styles.warningBox}>
          ⚠️ WARNING: Trading signals and analyses provided are for educational purposes only and should not be considered as financial advice. Always conduct your own research and consult with a licensed financial advisor before making investment decisions.
        </Text>

        <Text style={styles.sectionTitle}>5. Free mobile service and preferences</Text>
        <Text style={styles.paragraph}>
          This mobile application is offered without charging you fees for signals, analyses, academy content, or event listings shown in the app. You choose what notifications and emails you receive through your in-app notification preferences. Separate websites, future products, or other channels may have different terms; those do not change that this app is provided at no charge unless we notify you otherwise.
        </Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, including but not limited to text, graphics, logos, images, and software, is the property of AllyTZ Panel or its content suppliers and protected by international copyright laws.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          AllyTZ Panel shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the Service, including but not limited to trading losses.
        </Text>

        <Text style={styles.sectionTitle}>8. Account Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to terminate or suspend your account at any time, with or without cause or notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
        </Text>

        <Text style={styles.sectionTitle}>10. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AllyTZ Panel operates, without regard to its conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Information</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <Text style={styles.contactInfo}>Email: info@allytz.co</Text>
        <Text style={styles.contactInfo}>Phone: +255716885996</Text>
        <Text style={styles.contactInfo}>Location: Dar es salaam, Tanzania</Text>
        <Text style={styles.contactInfo}>Website: www.allytz.co</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using AllyTZ Panel, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  lastUpdated: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 10,
  },
  warningBox: {
    backgroundColor: '#2A1A1A',
    borderLeftWidth: 3,
    borderLeftColor: '#FFBF00',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    color: '#FFBF00',
    fontSize: 13,
    fontFamily: 'Axiforma-SemiBold',
    lineHeight: 20,
  },
  contactInfo: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
});
