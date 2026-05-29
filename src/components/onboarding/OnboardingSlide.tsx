import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, FontSize, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');

export type Slide = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  accentColor: string;
};

type Props = { slide: Slide };

export default function OnboardingSlide({ slide }: Props) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconWrap, { backgroundColor: slide.accentColor + '22' }]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.subtitle}>{slide.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emoji: { fontSize: 72 },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
});
