import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../../shared/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function AdminScreenHeader({ title, subtitle, showBack = false, onBack }: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin');
    }
  };

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.backPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  backPlaceholder: {
    width: 40,
  },
  textWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.rainyGrey,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
});
