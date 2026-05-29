import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingSlide, { Slide } from '../components/onboarding/OnboardingSlide';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '📖',
    title: 'Your Dev StickyBook',
    subtitle:
      'Save code snippets, links, and resources in one place — built for developers who move fast.',
    accentColor: Colors.primary,
  },
  {
    id: '2',
    emoji: '⚡',
    title: 'Find It Instantly',
    subtitle:
      'Powerful search across all your saved content. Never lose a useful snippet again.',
    accentColor: Colors.warning,
  },
  {
    id: '3',
    emoji: '🗂️',
    title: 'Organised by Design',
    subtitle:
      'Folders, tags, and categories keep your knowledge base clean and ready to use.',
    accentColor: Colors.success,
  },
];

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const { completeOnboarding } = useAuth();
  const insets = useSafeAreaInsets();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.lg }]}>
      <TouchableOpacity style={[styles.skip, { top: insets.top + Spacing.sm }]} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OnboardingSlide slide={item} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.list}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.btnText}>{isLast ? 'Get Started' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center' },
  skip: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
  },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  list: { flex: 1, width },
  dots: { flexDirection: 'row', marginBottom: Spacing.xl },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  btn: {
    width: width - Spacing.xl * 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
