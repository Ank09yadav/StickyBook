import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

const SETTINGS_GROUPS = [
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', emoji: '✏️' },
      { label: 'Change Password', emoji: '🔐' },
      { label: 'Email Notifications', emoji: '🔔' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Theme', emoji: '🎨' },
      { label: 'Default View', emoji: '⊞' },
      { label: 'Language', emoji: '🌐' },
    ],
  },
  {
    title: 'Data',
    items: [
      { label: 'Export Data', emoji: '📤' },
      { label: 'Import Data', emoji: '📥' },
      { label: 'Clear Cache', emoji: '🗑️' },
    ],
  },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name?.[0] ?? '?').toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Snippets', value: '0' },
          { label: 'Links', value: '0' },
          { label: 'Folders', value: '6' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings groups */}
      {SETTINGS_GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.groupCard}>
            {group.items.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.settingRow,
                  idx < group.items.length - 1 && styles.settingBorder,
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.settingEmoji}>{item.emoji}</Text>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>StickyBook v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xxxl, fontWeight: '700' },
  name: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' },
  email: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4, marginBottom: Spacing.md },
  editBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: '700' },
  statLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  group: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingEmoji: { fontSize: 18, marginRight: Spacing.md },
  settingLabel: { flex: 1, color: Colors.text, fontSize: FontSize.sm },
  chevron: { color: Colors.textMuted, fontSize: FontSize.lg },
  signOutBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.error + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '44',
  },
  signOutText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '600' },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs },
});
