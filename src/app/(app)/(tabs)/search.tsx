import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import Toast from '../../../components/ui/Toast';
import { getDbItems, addDbItem, updateDbItem, deleteDbItem, DbItem } from '../../../services/db';

const TAGS = ['All', 'React', 'TypeScript', 'DevOps', 'Database', 'CSS', 'Python'];
const TYPES = [
  { label: 'Snippet', value: 'snippet', emoji: '✏️' },
  { label: 'Link', value: 'link', emoji: '🔗' },
  { label: 'Note', value: 'note', emoji: '📝' },
] as const;
const POPULAR_EXTENSIONS = ['.ts', '.jsx', '.tsx', '.css', '.py', '.js', '.json', '.sql', '.html', '.rs', '.go', '.sh', '.md', '.txt'];

export default function Search() {
  const [items, setItems] = useState<DbItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  
  // Custom Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Edit/Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<DbItem> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Custom Dropdown ComboBox States
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // File Extension state for Snippets
  const [fileExtension, setFileExtension] = useState('.jsx');

  const insets = useSafeAreaInsets();

  const autoDeriveExtension = (tag: string): string => {
    const lower = tag.toLowerCase();
    if (lower === 'css') return '.css';
    if (lower === 'typescript' || lower === 'ts') return '.ts';
    if (lower === 'react' || lower === 'jsx' || lower === 'tsx') return '.jsx';
    if (lower === 'python' || lower === 'py') return '.py';
    if (lower === 'javascript' || lower === 'js') return '.js';
    if (lower === 'database' || lower === 'sql') return '.sql';
    if (lower === 'html') return '.html';
    return '.txt';
  };

  // Load items from SQLite DB
  const loadData = useCallback(async () => {
    const dbItems = await getDbItems();
    setItems(dbItems);
  }, []);

  // Dynamically extract unique categories present in SQLite DB, plus defaults
  const existingTags = useMemo(() => {
    const tagsSet = new Set(items.map((i) => i.tag));
    const defaults = ['React', 'TypeScript', 'DevOps', 'Database', 'CSS', 'Python'];
    defaults.forEach((t) => tagsSet.add(t));
    return Array.from(tagsSet);
  }, [items]);

  // Reload data every time this tab screen comes into active focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filtered Items based on Query and Active Tag
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tag.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase());
      
      const matchesTag = activeTag === 'All' || item.tag === activeTag;

      return matchesQuery && matchesTag;
    });
  }, [items, query, activeTag]);

  // Trigger Toast Helper
  const showToast = (message: string, type: typeof toastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Copy Content to Clipboard
  const handleCopy = (content: string, title: string) => {
    Clipboard.setString(content);
    showToast(`Copied "${title}" content to clipboard!`, 'success');
  };

  // Open Edit Modal
  const openEditModal = (item: DbItem) => {
    setEditingItem(item);
    setFileExtension(item.fileExtension || autoDeriveExtension(item.tag));
    setIsEditMode(true);
    setModalVisible(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItem({
      title: '',
      description: '',
      content: '',
      tag: 'React',
      type: 'snippet',
      emoji: '💡',
    });
    setFileExtension('.jsx');
    setIsEditMode(false);
    setModalVisible(true);
  };

  // Save changes (both Create and Edit)
  const handleSave = async () => {
    if (!editingItem?.title?.trim()) {
      showToast('Title is required!', 'error');
      return;
    }
    if (!editingItem?.content?.trim()) {
      showToast('Content/Snippet body is required!', 'error');
      return;
    }

    try {
      const finalExtension = editingItem.type === 'snippet' ? fileExtension : '';
      if (isEditMode && editingItem.id) {
        // Edit mode
        await updateDbItem({
          ...(editingItem as DbItem),
          fileExtension: finalExtension,
        });
        showToast(`Successfully updated "${editingItem.title}"!`, 'success');
      } else {
        // Create mode
        const newItem: DbItem = {
          id: Date.now().toString(),
          title: editingItem.title || 'Untitled',
          description: editingItem.description || 'No description provided.',
          content: editingItem.content || '',
          tag: editingItem.tag || 'React',
          type: editingItem.type || 'snippet',
          emoji: editingItem.emoji || '💡',
          createdAt: 'Just now',
          fileExtension: finalExtension,
        };
        await addDbItem(newItem);
        showToast(`Successfully created "${newItem.title}"!`, 'success');
      }
      setModalVisible(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error('Save error:', error);
      showToast('Failed to save. Please try again.', 'error');
    }
  };

  // Delete Item
  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteDbItem(id);
      showToast(`Deleted "${title}"!`, 'warning');
      setModalVisible(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete item.', 'error');
    }
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Search Header Wrapper */}
      <View style={styles.headerContainer}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search snippets, links, notes..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tag Filters Header */}
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
      </View>

      {/* Search Results List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            
            <Text style={styles.emptyTitle}>
              {query ? `No results for "${query}"` : 'Start typing to search'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {query ? 'Try a different keyword or tag filter' : 'Search across all your saved content'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              activeOpacity={0.7}
              style={styles.cardClickable}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <View style={styles.titleArea}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, styles.typeBadge]}>
                      <Text style={styles.badgeText}>
                        {item.type === 'snippet' ? '⚛️ snippet' : item.type === 'link' ? '🔗 link' : '📝 note'}
                      </Text>
                    </View>
                    <View style={[styles.badge, styles.tagBadge]}>
                      <Text style={[styles.badgeText, styles.tagTextBadge]}>{item.tag}</Text>
                    </View>
                    {item.type === 'snippet' && item.fileExtension ? (
                      <View style={[styles.badge, styles.extBadge]}>
                        <Text style={[styles.badgeText, styles.extTextBadge]}>{item.fileExtension}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <Text style={styles.timeText}>{item.createdAt}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleCopy(item.content, item.title)}
                  style={styles.actionBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>📋 Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={[styles.actionBtn, styles.editActionBtn]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateModal}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Resource' : 'Create Resource'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Emoji & Title */}
              <View style={styles.rowField}>
                <TextInput
                  style={styles.emojiInput}
                  value={editingItem?.emoji}
                  onChangeText={(text) => setEditingItem((prev) => ({ ...prev, emoji: text }))}
                  placeholder="💡"
                  maxLength={4}
                />
                <TextInput
                  style={[styles.modalInput, styles.titleInput]}
                  value={editingItem?.title}
                  onChangeText={(text) => setEditingItem((prev) => ({ ...prev, title: text }))}
                  placeholder="Title (e.g. useDebounce)"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.modalInput}
                value={editingItem?.description}
                onChangeText={(text) => setEditingItem((prev) => ({ ...prev, description: text }))}
                placeholder="What is this snippet or resource used for?"
                placeholderTextColor={Colors.textMuted}
                multiline
              />

              {/* Resource Type Selector */}
              <Text style={styles.fieldLabel}>Resource Type</Text>
              <View style={styles.typeSelectorRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeSelectorBtn,
                      editingItem?.type === t.value && styles.typeSelectorBtnActive,
                    ]}
                    onPress={() => setEditingItem((prev) => ({ ...prev, type: t.value }))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.typeSelectorEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.typeSelectorLabel,
                        editingItem?.type === t.value && styles.typeSelectorLabelActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Folder Selection - Custom Dropdown ComboBox */}
              <Text style={styles.fieldLabel}>Folder Name</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setTagDropdownOpen(!tagDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>📂 {editingItem?.tag || 'React'}</Text>
                <Text style={styles.dropdownChevron}>{tagDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {tagDropdownOpen && (
                <View style={styles.dropdownPanel}>
                  {/* Inline Custom Input */}
                  <View style={styles.customTagRow}>
                    <TextInput
                      style={styles.customTagInput}
                      value={customTagInput}
                      onChangeText={setCustomTagInput}
                      placeholder="Type folder name..."
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="words"
                    />
                    <TouchableOpacity
                      style={styles.addTagBtn}
                      onPress={() => {
                        if (customTagInput.trim()) {
                          const newTag = customTagInput.trim();
                          setEditingItem((prev) => ({ ...prev, tag: newTag }));
                          setFileExtension(autoDeriveExtension(newTag));
                          setCustomTagInput('');
                          setTagDropdownOpen(false);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addTagBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Existing Folders Selection Grid */}
                  <Text style={styles.dropdownSectionLabel}>Existing Folders:</Text>
                  <View style={styles.tagsGrid}>
                    {existingTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.modalTagItem,
                          editingItem?.tag === tag && styles.modalTagItemActive,
                        ]}
                        onPress={() => {
                          setEditingItem((prev) => ({ ...prev, tag }));
                          setFileExtension(autoDeriveExtension(tag));
                          setTagDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalTagText,
                            editingItem?.tag === tag && styles.modalTagTextActive,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Snippet File Extension selector */}
              {editingItem?.type === 'snippet' && (
                <>
                  <Text style={styles.fieldLabel}>File Extension</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modalTagsScroll}
                  >
                    {POPULAR_EXTENSIONS.map((ext) => (
                      <TouchableOpacity
                        key={ext}
                        style={[
                          styles.modalTagItem,
                          fileExtension === ext && styles.modalTagItemActive,
                        ]}
                        onPress={() => setFileExtension(ext)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalTagText,
                            fileExtension === ext && styles.modalTagTextActive,
                          ]}
                        >
                          {ext}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Code/Note Content Editor */}
              <Text style={styles.fieldLabel}>
                {editingItem?.type === 'link'
                  ? 'URL Link'
                  : editingItem?.type === 'note'
                  ? 'Notes Content'
                  : 'Code Snippet Body'}
              </Text>

              {editingItem?.type === 'snippet' ? (
                <TextInput
                  style={styles.codeEditor}
                  value={editingItem?.content}
                  onChangeText={(text) => setEditingItem((prev) => ({ ...prev, content: text }))}
                  placeholder="Paste or write code here..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : (
                <TextInput
                  style={styles.modalInput}
                  value={editingItem?.content}
                  onChangeText={(text) => setEditingItem((prev) => ({ ...prev, content: text }))}
                  placeholder={
                    editingItem?.type === 'link'
                      ? 'https://example.com'
                      : 'Paste or write notes content here...'
                  }
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {isEditMode && editingItem?.id && (
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(editingItem.id!, editingItem.title || '')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    {isEditMode ? 'Save Changes' : 'Create Item'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  headerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
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
  clearBtn: { padding: Spacing.xs },
  clear: { color: Colors.textMuted, fontSize: FontSize.sm },
  tags: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.md },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  tagTextActive: { color: Colors.white, fontWeight: '600' },
  listContainer: { padding: Spacing.md, paddingBottom: 100 },
  
  // Card styles
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardClickable: { gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  cardEmoji: { fontSize: 36 },
  titleArea: { flex: 1, gap: 4 },
  cardTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs },
  badge: {
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: { backgroundColor: Colors.background },
  tagBadge: { backgroundColor: Colors.primary + '18' },
  badgeText: { color: Colors.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  tagTextBadge: { color: Colors.primary },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  timeText: { color: Colors.textMuted, fontSize: FontSize.xs },
  actionRow: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  editActionBtn: { borderColor: Colors.primary + '44' },
  actionBtnText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '500' },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 100,
  },
  fabText: { color: Colors.white, fontSize: 32, fontWeight: '300', marginTop: -3 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', marginBottom: Spacing.xs },
  emptySubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.lg },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  closeBtn: { padding: Spacing.xs },
  closeBtnText: { color: Colors.textSecondary, fontSize: FontSize.md },
  modalScroll: { padding: Spacing.md, gap: Spacing.md },
  rowField: { flexDirection: 'row', gap: Spacing.sm },
  emojiInput: {
    width: 60,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    fontSize: FontSize.xl,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  titleInput: { flex: 1 },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: -Spacing.xs },
  
  // Type selector
  typeSelectorRow: { flexDirection: 'row', gap: Spacing.sm },
  typeSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
  },
  typeSelectorBtnActive: { backgroundColor: Colors.primary + '18', borderColor: Colors.primary },
  typeSelectorEmoji: { fontSize: 16 },
  typeSelectorLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  typeSelectorLabelActive: { color: Colors.primary, fontWeight: '600' },
  
  // Tag selector
  modalTagsScroll: { gap: Spacing.sm, paddingVertical: 4 },
  modalTagItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTagItemActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalTagText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  modalTagTextActive: { color: Colors.white, fontWeight: '600' },
  

  
  // Modal Actions
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  modalBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  deleteBtn: { flex: 0.4, backgroundColor: Colors.error + '18', borderWidth: 1, borderColor: Colors.error + '44' },
  deleteBtnText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '600' },

  // Dropdown ComboBox Styles
  dropdownTrigger: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  dropdownTriggerText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  dropdownChevron: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  dropdownPanel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    fontSize: FontSize.sm,
  },
  addTagBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  dropdownSectionLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -Spacing.xs,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recentExt: {
    color: Colors.textSecondary,
    fontFamily: 'Courier',
    fontSize: 11,
  },
  extBadge: {
    backgroundColor: '#BD93F918',
  },
  extTextBadge: {
    color: '#BD93F9',
  },
  codeEditor: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 200,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#070A13',
    color: '#D4D4D4',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
});
