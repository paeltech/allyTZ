import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQScreen() {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'What is AllyTZ Panel?',
      answer: 'AllyTZ Panel is a forex trading platform that provides trading signals, market analysis, documents, events, and community support. Content is for education only, not financial advice.',
    },
    {
      category: 'Getting Started',
      question: 'How do I sign up?',
      answer: 'Download the AllyTZ Panel app, tap "Sign Up" on the login screen, and fill in your details including full name, email, password, and optionally a phone number for WhatsApp updates. You\'ll receive a confirmation email to verify your account.',
    },
    {
      category: 'Getting Started',
      question: 'Is the app free to use?',
      answer: 'Yes. The AllyTZ Panel mobile app and the signals, analysis, and other content we offer through it are provided at no charge. You can choose what to receive in Profile → Notification Preferences.',
    },
    {
      category: 'Trading Signals',
      question: 'How accurate are your trading signals?',
      answer: 'Our signals maintain an average accuracy rate of 85%. However, forex trading involves risk, and past performance doesn\'t guarantee future results. Always use proper risk management.',
    },
    {
      category: 'Trading Signals',
      question: 'How often do you send signals?',
      answer: 'We typically send 3-7 high-quality signals per day, depending on market conditions. Quality over quantity is our priority. All signals include entry, stop loss, and take profit levels.',
    },
    {
      category: 'Trading Signals',
      question: 'What currency pairs do you cover?',
      answer: 'We cover major pairs (EUR/USD, GBP/USD, USD/JPY), minor pairs, and some exotic pairs. Our focus is on the most liquid and tradeable pairs.',
    },
    {
      category: 'Account & notifications',
      question: 'How do I choose what updates I get?',
      answer: 'Open Profile → Notification Preferences. You can turn email and push notifications on or off for signals, analyses, events, tips, and marketing messages.',
    },
    {
      category: 'Account & notifications',
      question: 'Do I need to pay for signals or analysis in the app?',
      answer: 'No. The mobile app does not charge for access to our signals, trade analyses, documents, or event listings. Use Notification Preferences to opt in to the types of updates you want.',
    },
    {
      category: 'Account & notifications',
      question: 'How do I get help with my account?',
      answer: 'Use the Help & Enquiry screen in the app, or email info@allytz.co. We typically respond within 24 hours.',
    },
    {
      category: 'Education & Support',
      question: 'What other resources are available?',
      answer: 'Browse Documents for trading guides and reference materials, check Events for webinars and workshops, and read daily tips from the Tips screen.',
    },
    {
      category: 'Education & Support',
      question: 'How do I contact customer support?',
      answer: 'You can reach us via the Help & Enquiry page in the app, email us at info@allytz.co, or call us at +255716885996. We are based in Dar es salaam, Tanzania. Website: www.allytz.co. We typically respond within 24 hours.',
    },
    {
      category: 'Technical',
      question: 'Is my data secure?',
      answer: 'Yes, we use bank-level encryption (SSL/TLS) to protect your data in transit and at rest. We never share your personal information with third parties without your consent.',
    },
    {
      category: 'Technical',
      question: 'Can I use AllyTZ Panel on multiple devices?',
      answer: 'Yes, you can access your account from multiple devices. Your data syncs automatically across all devices.',
    },
    {
      category: 'Technical',
      question: 'What if I forget my password?',
      answer: 'Click "Forgot Password" on the login screen. You\'ll receive an email with instructions to reset your password securely.',
    },
  ];

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq, index) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push({ ...faq, index });
    return acc;
  }, {} as Record<string, Array<FAQItem & { index: number }>>);

  const toggleItem = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <HelpCircle size={48} color={Colors.gold} strokeWidth={1.5} />
          <Text style={styles.introTitle}>Frequently Asked Questions</Text>
          <Text style={styles.introText}>
            Find answers to common questions about AllyTZ Panel. Can't find what you're looking for? Contact our support team.
          </Text>
        </View>

        {Object.entries(groupedFaqs).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            
            {items.map((item) => (
              <View key={item.index} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleItem(item.index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.question}>{item.question}</Text>
                  {expandedItems.includes(item.index) ? (
                    <ChevronUp size={20} color={Colors.gold} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={20} color={Colors.gold} strokeWidth={2} />
                  )}
                </TouchableOpacity>
                
                {expandedItems.includes(item.index) && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Contact Support Card */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Still have questions?</Text>
          <Text style={styles.supportText}>
            Our support team is here to help you 24/7.
          </Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => router.push('/help')}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  introTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    marginTop: 16,
    marginBottom: 12,
  },
  introText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: Colors.gold,
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  faqCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-SemiBold',
    marginRight: 12,
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  answer: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 22,
    marginTop: 12,
  },
  supportCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  supportTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  supportText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  supportButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  supportButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
});
