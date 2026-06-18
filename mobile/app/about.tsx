import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, TrendingUp, Target, Users, Award, Mail, Phone, MapPin, Globe } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AboutScreen() {
  const handleContactPress = (type: 'email' | 'phone' | 'website') => {
    const urls = {
      email: 'mailto:info@allytz.co',
      phone: 'tel:+255716885996',
      website: 'https://www.allytz.co',
    };
    Linking.openURL(urls[type]);
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
        <Text style={styles.headerTitle}>About AllyTZ Panel</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <TrendingUp size={64} color={Colors.gold} strokeWidth={2} />
          </View>
          <Text style={styles.appName}>AllyTZ Panel</Text>
          <Text style={styles.tagline}>PIPS HUNTING</Text>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            AllyTZ Panel is dedicated to empowering traders across Africa and beyond with world-class forex education, trading signals, and comprehensive market analysis. We believe that with the right knowledge and tools, anyone can master the art of trading.
          </Text>
        </View>

        {/* What We Offer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <TrendingUp size={24} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Trading Signals</Text>
              <Text style={styles.featureDescription}>
                Real-time forex signals with high accuracy, complete with entry points, stop loss, and take profit levels.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Target size={24} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Market Analysis</Text>
              <Text style={styles.featureDescription}>
                In-depth technical and fundamental analysis to help you understand market movements and make informed decisions.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Users size={24} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Education & Mentorship</Text>
              <Text style={styles.featureDescription}>
                Comprehensive courses, webinars, and one-on-one mentorship to accelerate your trading journey.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Award size={24} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Community Support</Text>
              <Text style={styles.featureDescription}>
                Join a vibrant community of traders sharing insights, strategies, and success stories.
              </Text>
            </View>
          </View>
        </View>

        {/* Why Choose Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose AllyTZ Panel?</Text>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5+</Text>
            <Text style={styles.statLabel}>Years of Experience</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>10,000+</Text>
            <Text style={styles.statLabel}>Active Traders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Signal Accuracy</Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get In Touch</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContactPress('email')}
          >
            <View style={styles.contactIcon}>
              <Mail size={20} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>info@allytz.co</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContactPress('phone')}
          >
            <View style={styles.contactIcon}>
              <Phone size={20} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+255716885996</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <MapPin size={20} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Location</Text>
              <Text style={styles.contactValue}>Dar es salaam, Tanzania</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContactPress('website')}
          >
            <View style={styles.contactIcon}>
              <Globe size={20} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.allytz.co</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 AllyTZ Panel. All rights reserved.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  logoSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    color: Colors.gold,
    fontSize: 32,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  tagline: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-SemiBold',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 16,
  },
  paragraph: {
    color: '#A0A0A0',
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.gold,
    fontSize: 36,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  statLabel: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 2,
  },
  contactValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-SemiBold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 4,
  },
  versionText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
  },
});
