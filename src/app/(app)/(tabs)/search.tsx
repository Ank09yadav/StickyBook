import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

const TAGS = ['All', 'React', 'TypeScript', 'DevOps', 'Database', 'CSS', 'Python'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search snippets, links, files..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tag filters */}
      <FlatList
        horizontal
        data={TAGS}
        keyExtractor={(t) => t}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tags}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tag, item === activeTag && styles.tagActive]}
            onPress={() => setActiveTag(item)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tagText, item === activeTag && styles.tagTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Empty state */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔮</Text>
        <Text style={styles.emptyTitle}>
          {query ? `No results for "${query}"` : 'Start typing to search'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {query ? 'Try a different keyword or tag' : 'Search across all your saved content'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm + 2,
  },
  clear: { color: Colors.textMuted, fontSize: FontSize.sm, paddingLeft: Spacing.sm },
  tags: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.md },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  tagTextActive: { color: Colors.white, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', marginBottom: Spacing.xs },
  emptySubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
