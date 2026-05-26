import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../../constants/theme';

type Props = { title: string };

export default function CustomHeader({ title }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <TouchableOpacity onPress={openDrawer} style={styles.menuBtn} hitSlop={8}>
        <HamburgerIcon />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.menuBtn} />
    </View>
  );
}

function HamburgerIcon() {
  return (
    <View style={styles.hamburger}>
      <View style={styles.line} />
      <View style={[styles.line, { width: 16 }]} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuBtn: { width: 40, alignItems: 'center' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  hamburger: { gap: 4 },
  line: {
    height: 2,
    width: 20,
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
});
