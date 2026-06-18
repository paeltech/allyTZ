import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Shield } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PrivacyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Shield size={48} color={Colors.gold} strokeWidth={1.5} />
        </View>

        <Text style={styles.lastUpdated}>Last updated: January 15, 2026</Text>

        <Text style={styles.introText}>
          At AllyTZ Panel, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.subsectionTitle}>Personal Information</Text>
        <Text style={styles.paragraph}>
          We collect information that you provide directly to us, including:
        </Text>
        <Text style={styles.bulletPoint}>• Name and contact information (email, phone number)</Text>
        <Text style={styles.bulletPoint}>• Account credentials (username, password)</Text>
        <Text style={styles.bulletPoint}>• Profile information and notification preferences</Text>

        <Text style={styles.subsectionTitle}>Usage Information</Text>
        <Text style={styles.paragraph}>
          We automatically collect certain information about your device and how you interact with our Service:
        </Text>
        <Text style={styles.bulletPoint}>• Device information (model, operating system, unique identifiers)</Text>
        <Text style={styles.bulletPoint}>• Log data (IP address, access times, pages viewed)</Text>
        <Text style={styles.bulletPoint}>• Usage patterns and preferences</Text>
        <Text style={styles.bulletPoint}>• Location data (with your permission)</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the collected information for various purposes:
        </Text>
        <Text style={styles.bulletPoint}>• To provide, maintain, and improve our services</Text>
        <Text style={styles.bulletPoint}>• To operate your account and send service-related messages</Text>
        <Text style={styles.bulletPoint}>• To send you technical notices and support messages</Text>
        <Text style={styles.bulletPoint}>• To respond to your comments and questions</Text>
        <Text style={styles.bulletPoint}>• To send you trading signals, analyses, and educational content</Text>
        <Text style={styles.bulletPoint}>• To detect, prevent, and address technical issues</Text>
        <Text style={styles.bulletPoint}>• To personalize your experience</Text>

        <Text style={styles.sectionTitle}>3. Information Sharing and Disclosure</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We may share your information in the following situations:
        </Text>
        <Text style={styles.bulletPoint}>• With service providers who assist in our operations</Text>
        <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
        <Text style={styles.bulletPoint}>• To protect and defend our rights and property</Text>
        <Text style={styles.bulletPoint}>• With your consent or at your direction</Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
        </Text>
        <View style={styles.securityBox}>
          <Text style={styles.securityText}>
            🔒 Your data is encrypted in transit using SSL/TLS and at rest using industry-standard encryption protocols.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          Depending on your location, you may have certain rights regarding your personal information:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information</Text>
        <Text style={styles.bulletPoint}>• Correct inaccurate or incomplete data</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your data (Profile → Delete Account in the app)</Text>
        <Text style={styles.bulletPoint}>• Object to or restrict certain processing</Text>
        <Text style={styles.bulletPoint}>• Data portability</Text>
        <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>

        <Text style={styles.sectionTitle}>7. Cookies and Tracking Technologies</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar tracking technologies to collect and store information about your preferences and usage patterns. You can control cookies through your browser settings.
        </Text>

        <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our Service is not intended for children under 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy or our data practices, please contact us:
        </Text>
        <Text style={styles.contactInfo}>Email: info@allytz.co</Text>
        <Text style={styles.contactInfo}>Phone: +255716885996</Text>
        <Text style={styles.contactInfo}>Location: Dar es salaam, Tanzania</Text>
        <Text style={styles.contactInfo}>Website: www.allytz.co</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using AllyTZ Panel, you consent to the collection and use of your information as described in this Privacy Policy.
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
    marginBottom: 24,
  },
  introText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
    marginTop: 16,
    marginBottom: 8,
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
  securityBox: {
    backgroundColor: '#1A2A1A',
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  securityText: {
    color: '#22C55E',
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
