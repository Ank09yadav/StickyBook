import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const NAV_ITEMS = [
  { label: 'Home', icon: '🏠', route: '/(app)/(tabs)/home' },
  { label: 'Search', icon: '🔍', route: '/(app)/(tabs)/search' },
  { label: 'Files', icon: '📁', route: '/(app)/(tabs)/files' },
  { label: 'Profile', icon: '👤', route: '/(app)/(tabs)/profile' },
] as const;

const EXTRA_ITEMS = [
  { label: 'Settings', icon: '⚙️' },
  { label: 'About', icon: 'ℹ️' },
  { label: 'Help & Support', icon: '💬' },
];

export default function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const handleNavigate = (route: string) => {
    router.navigate(route as any);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name ?? 'Developer'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Main nav */}
      <Text style={styles.sectionLabel}>NAVIGATION</Text>
      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.navItem}
          onPress={() => handleNavigate(item.route)}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text style={styles.navLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.divider} />

      {/* Extra options */}
      <Text style={styles.sectionLabel}>OPTIONS</Text>
      {EXTRA_ITEMS.map((item) => (
        <TouchableOpacity key={item.label} style={styles.navItem} activeOpacity={0.7}>
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text style={styles.navLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.divider} />

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.signOutIcon}>🚪</Text>
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  userEmail: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 2,
  },
  navIcon: { fontSize: 18, marginRight: Spacing.md },
  navLabel: { color: Colors.text, fontSize: FontSize.md },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  signOutIcon: { fontSize: 18, marginRight: Spacing.md },
  signOutLabel: { color: Colors.error, fontSize: FontSize.md, fontWeight: '500' },
});
