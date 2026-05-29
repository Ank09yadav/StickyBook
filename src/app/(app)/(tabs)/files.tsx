import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

const VIEW_MODES = ['Grid', 'List'] as const;

const FOLDERS = [
  { id: '1', name: 'React Hooks', emoji: '⚛️', count: 0 },
  { id: '2', name: 'Backend', emoji: '🖥️', count: 0 },
  { id: '3', name: 'CSS Tricks', emoji: '🎨', count: 0 },
  { id: '4', name: 'Algorithms', emoji: '🧮', count: 0 },
  { id: '5', name: 'Tools', emoji: '🛠️', count: 0 },
  { id: '6', name: 'Reading List', emoji: '📚', count: 0 },
];

export default function Files() {
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  const insets = useSafeAreaInsets();
  const isGrid = viewMode === 'Grid';

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.count}>{FOLDERS.length} folders</Text>
        <View style={styles.toggleRow}>
          {VIEW_MODES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, m === viewMode && styles.toggleActive]}
              onPress={() => setViewMode(m)}
            >
              <Text style={[styles.toggleText, m === viewMode && styles.toggleTextActive]}>
                {m === 'Grid' ? '⊞' : '☰'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={FOLDERS}
        keyExtractor={(f) => f.id}
        numColumns={isGrid ? 2 : 1}
        contentContainerStyle={[styles.list, isGrid && styles.gridList]}
        columnWrapperStyle={isGrid ? styles.row : undefined}
        renderItem={({ item }) =>
          isGrid ? (
            <TouchableOpacity style={styles.gridCard} activeOpacity={0.75}>
              <Text style={styles.folderEmoji}>{item.emoji}</Text>
              <Text style={styles.folderName}>{item.name}</Text>
              <Text style={styles.folderCount}>{item.count} items</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.listCard} activeOpacity={0.75}>
              <Text style={styles.listEmoji}>{item.emoji}</Text>
              <View style={styles.listInfo}>
                <Text style={styles.folderName}>{item.name}</Text>
                <Text style={styles.folderCount}>{item.count} items</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.newFolderBtn} activeOpacity={0.8}>
            <Text style={styles.newFolderText}>+ New Folder</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  count: { color: Colors.textSecondary, fontSize: FontSize.sm },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 4 },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { color: Colors.textSecondary, fontSize: 16 },
  toggleTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  gridList: {},
  row: { justifyContent: 'space-between', marginBottom: Spacing.sm },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  folderEmoji: { fontSize: 32 },
  folderName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500', textAlign: 'center' },
  folderCount: { color: Colors.textMuted, fontSize: FontSize.xs },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listEmoji: { fontSize: 24, marginRight: Spacing.md },
  listInfo: { flex: 1 },
  chevron: { color: Colors.textMuted, fontSize: FontSize.lg },
  newFolderBtn: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  newFolderText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
