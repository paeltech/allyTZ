import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../shared/constants/colors';

type AppLogoProps = {
  size?: number;
  showTitle?: boolean;
};

export function AppLogo({ size = 120, showTitle = true }: AppLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={[styles.logo, { width: size, height: size, borderRadius: size * 0.12 }]}
        resizeMode="contain"
        accessibilityLabel="AllyTZ Panel logo"
      />
      {showTitle ? (
        <>
          <Text style={styles.appName}>AllyTZ Panel</Text>
          <Text style={styles.tagline}>PIPS HUNTING</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.gold,
    letterSpacing: 2,
  },
});
