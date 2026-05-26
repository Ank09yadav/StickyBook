import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

const QUICK_ACTIONS = [
  { label: 'New Snippet', emoji: '✏️' },
  { label: 'Add Link', emoji: '🔗' },
  { label: 'Upload File', emoji: '📎' },
  { label: 'New Folder', emoji: '📂' },
];

const RECENT_ITEMS = [
  { title: 'useDebounce hook', tag: 'React', emoji: '⚛️', time: '2h ago' },
  { title: 'Docker Compose template', tag: 'DevOps', emoji: '🐳', time: '5h ago' },
  { title: 'SQL cheatsheet', tag: 'Database', emoji: '🗄️', time: 'Yesterday' },
];

export default function Home() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetText}>
          Good morning, <Text style={styles.greetName}>{user?.name ?? 'dev'}</Text> 👋
        </Text>
        <Text style={styles.greetSub}>What are you saving today?</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Snippets', value: '0' },
          { label: 'Links', value: '0' },
          { label: 'Files', value: '0' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.75}>
            <Text style={styles.actionEmoji}>{a.emoji}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent */}
      <Text style={styles.sectionTitle}>Recently Saved</Text>
      {RECENT_ITEMS.map((item) => (
        <TouchableOpacity key={item.title} style={styles.recentCard} activeOpacity={0.75}>
          <Text style={styles.recentEmoji}>{item.emoji}</Text>
          <View style={styles.recentInfo}>
            <Text style={styles.recentTitle}>{item.title}</Text>
            <Text style={styles.recentMeta}>
              <Text style={styles.recentTag}>{item.tag}</Text>{'  ·  '}{item.time}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
  greeting: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  greetText: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' },
  greetName: { color: Colors.primary },
  greetSub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
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
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  actionEmoji: { fontSize: 28 },
  actionLabel: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentEmoji: { fontSize: 24, marginRight: Spacing.md },
  recentInfo: { flex: 1 },
  recentTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
  recentMeta: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  recentTag: { color: Colors.primary },
  chevron: { color: Colors.textMuted, fontSize: FontSize.lg },
});
