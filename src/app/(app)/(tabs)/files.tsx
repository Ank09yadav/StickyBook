import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
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
import SyntaxHighlighterText from '../../../components/ui/SyntaxHighlighter';

const VIEW_MODES = ['Grid', 'List'] as const;
const POPULAR_EXTENSIONS = ['.ts', '.jsx', '.tsx', '.css', '.py', '.js', '.json', '.sql', '.html', '.rs', '.go', '.sh', '.md', '.txt'];
const TYPES = [
  { label: 'Snippet', value: 'snippet', emoji: '✏️' },
  { label: 'Link', value: 'link', emoji: '🔗' },
  { label: 'Note', value: 'note', emoji: '📝' },
] as const;

export default function Files() {
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  const [items, setItems] = useState<DbItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast States
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Edit/Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<DbItem> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fileExtension, setFileExtension] = useState('.jsx');
  const [isEditingCode, setIsEditingCode] = useState(false);

  // Custom Dropdown ComboBox States for Item Modal
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Folder Creation Modal State
  const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');

  const insets = useSafeAreaInsets();
  const isGrid = viewMode === 'Grid';

  // Load items from SQLite
  const loadData = useCallback(async () => {
    const dbItems = await getDbItems();
    setItems(dbItems);
  }, []);

  // Reload data every time screen comes to focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Group items by category tags dynamically
  const folders = useMemo(() => {
    const group: { [key: string]: { id: string; name: string; emoji: string; count: number } } = {};
    items.forEach((item) => {
      const tag = item.tag || 'React';
      if (!group[tag]) {
        group[tag] = {
          id: tag,
          name: tag,
          emoji: item.emoji || '📁',
          count: 0,
        };
      }
      group[tag].count += 1;
    });
    return Object.values(group);
  }, [items]);

  // Unique categories list for the dropdown
  const existingTags = useMemo(() => {
    const tagsSet = new Set(items.map((i) => i.tag));
    const defaults = ['React', 'TypeScript', 'DevOps', 'Database', 'CSS', 'Python'];
    defaults.forEach((t) => tagsSet.add(t));
    return Array.from(tagsSet);
  }, [items]);

  // Filter items in active folder
  const activeFolderItems = useMemo(() => {
    if (!selectedFolder) return [];
    return items.filter((item) => {
      const matchesFolder = item.tag === selectedFolder;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    });
  }, [items, selectedFolder, searchQuery]);

  // Helper to trigger custom toast
  const showToast = (message: string, type: typeof toastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Helper to copy content to clipboard
  const handleCopy = (content: string, title: string) => {
    Clipboard.setString(content);
    showToast(`Copied "${title}" to clipboard!`, 'success');
  };

  // Auto derive extensions based on selected tag
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

  // Open Edit Modal for an item
  const openEditModal = (item: DbItem) => {
    setEditingItem(item);
    setFileExtension(item.fileExtension || autoDeriveExtension(item.tag));
    setIsEditingCode(false);
    setIsEditMode(true);
    setModalVisible(true);
  };

  // Open Create Modal prefilled with active folder/tag
  const openCreateModal = () => {
    setEditingItem({
      title: '',
      description: '',
      content: '',
      tag: selectedFolder || 'React',
      type: 'snippet',
      emoji: '💡',
    });
    setFileExtension(autoDeriveExtension(selectedFolder || 'React'));
    setIsEditingCode(true);
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
          tag: editingItem.tag || selectedFolder || 'React',
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

  // Create a new folder with placeholder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showToast('Folder name is required!', 'error');
      return;
    }

    try {
      const folderName = newFolderName.trim();
      const placeholderItem: DbItem = {
        id: Date.now().toString(),
        title: `Welcome to ${folderName}!`,
        description: `This is the start of your ${folderName} folder.`,
        content: `Start saving snippets, notes, and links here!`,
        tag: folderName,
        type: 'note',
        emoji: newFolderEmoji || '📁',
        createdAt: 'Just now',
      };
      await addDbItem(placeholderItem);
      showToast(`Folder "${folderName}" created successfully!`, 'success');
      setNewFolderModalVisible(false);
      setNewFolderName('');
      setNewFolderEmoji('📁');
      await loadData();
      // Auto drill-down into new folder
      setSelectedFolder(folderName);
    } catch (error) {
      console.error('Folder creation error:', error);
      showToast('Failed to create folder.', 'error');
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

      {selectedFolder === null ? (
        // Main Folders View
        <>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <Text style={styles.count}>{folders.length} folders</Text>
            <View style={styles.toggleRow}>
              {VIEW_MODES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.toggleBtn, m === viewMode && styles.toggleActive]}
                  onPress={() => setViewMode(m)}
                  activeOpacity={0.8}
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
            data={folders}
            keyExtractor={(f) => f.id}
            numColumns={isGrid ? 2 : 1}
            contentContainerStyle={[styles.list, isGrid && styles.gridList]}
            columnWrapperStyle={isGrid ? styles.row : undefined}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Folders Found</Text>
                <Text style={styles.emptySubtitle}>Create a new folder or snippet on the home screen to begin</Text>
              </View>
            }
            renderItem={({ item }) =>
              isGrid ? (
                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={() => {
                    setSelectedFolder(item.name);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.folderEmoji}>{item.emoji}</Text>
                  <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.folderCount}>{item.count} items</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.listCard}
                  onPress={() => {
                    setSelectedFolder(item.name);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.listEmoji}>{item.emoji}</Text>
                  <View style={styles.listInfo}>
                    <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.folderCount}>{item.count} items</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              )
            }
            ListFooterComponent={
              <TouchableOpacity
                style={styles.newFolderBtn}
                onPress={() => setNewFolderModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.newFolderText}>+ New Folder</Text>
              </TouchableOpacity>
            }
          />
        </>
      ) : (
        // Folder Drill-down Details View
        <View style={styles.folderDetailsContainer}>
          {/* Header */}
          <View style={styles.folderHeader}>
            <TouchableOpacity
              onPress={() => setSelectedFolder(null)}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>← Folders</Text>
            </TouchableOpacity>
            <Text style={styles.folderHeaderTitle} numberOfLines={1}>
              📂 {selectedFolder}
            </Text>
            <Text style={styles.folderHeaderCount}>
              {activeFolderItems.length} items
            </Text>
          </View>

          {/* Search bar inside folder */}
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${selectedFolder}...`}
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={activeFolderItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.detailsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Empty Folder</Text>
                <Text style={styles.emptySubtitle}>There are no items matching your criteria in this folder.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.7}
                  style={styles.itemCardClickable}
                >
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.itemCardEmoji}>{item.emoji}</Text>
                    <View style={styles.itemTitleArea}>
                      <Text style={styles.itemCardTitle}>{item.title}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles.typeBadge]}>
                          <Text style={styles.badgeText}>
                            {item.type === 'snippet' ? '⚛️ snippet' : item.type === 'link' ? '🔗 link' : '📝 note'}
                          </Text>
                        </View>
                        {item.type === 'snippet' && item.fileExtension ? (
                          <View style={[styles.badge, styles.extBadge]}>
                            <Text style={[styles.badgeText, styles.extTextBadge]}>{item.fileExtension}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.itemCardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>

                <View style={styles.itemCardFooter}>
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

          {/* Floating Action Button (FAB) inside active folder */}
          <TouchableOpacity
            style={styles.fab}
            onPress={openCreateModal}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit / Create Item Modal */}
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
          <View style={[styles.modalContent, isEditMode && { height: '90%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Resource' : 'Create Resource'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isEditMode ? (
              // Beautiful Full-Page Viewer/Editor
              <View style={styles.fullPageContainer}>
                {/* Inline Header Details (Notion-style) */}
                <View style={styles.fullPageHeader}>
                  <View style={styles.fullPageTitleRow}>
                    <TextInput
                      style={styles.fullPageEmojiInput}
                      value={editingItem?.emoji}
                      onChangeText={(text) => setEditingItem((prev) => ({ ...prev, emoji: text }))}
                      placeholder="💡"
                      maxLength={4}
                    />
                    <TextInput
                      style={styles.fullPageTitleInput}
                      value={editingItem?.title}
                      onChangeText={(text) => setEditingItem((prev) => ({ ...prev, title: text }))}
                      placeholder="Resource Title"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                  
                  <TextInput
                    style={styles.fullPageDescInput}
                    value={editingItem?.description}
                    onChangeText={(text) => setEditingItem((prev) => ({ ...prev, description: text }))}
                    placeholder="Add a description or note details..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                  />

                  <View style={styles.fullPageMetadataRow}>
                    <TouchableOpacity 
                      style={styles.fullPageBadge} 
                      onPress={() => setTagDropdownOpen(!tagDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.fullPageBadgeText}>📂 {editingItem?.tag || 'React'}</Text>
                    </TouchableOpacity>
                    
                    {editingItem?.type === 'snippet' && (
                      <View style={styles.fullPageBadge}>
                        <Text style={styles.fullPageBadgeText}>💻 {fileExtension}</Text>
                      </View>
                    )}

                    <View style={[styles.fullPageBadge, { backgroundColor: editingItem?.type === 'snippet' ? Colors.primary + '15' : Colors.success + '15' }]}>
                      <Text style={[styles.fullPageBadgeText, { color: editingItem?.type === 'snippet' ? Colors.primary : Colors.success }]}>
                        {editingItem?.type === 'snippet' ? 'Code Snippet' : editingItem?.type === 'note' ? 'Dev Notes' : 'Web Link'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Dynamic Folder Selector Dropdown inside Full-Page view if toggled */}
                  {tagDropdownOpen && (
                    <View style={styles.dropdownPanel}>
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
                </View>

                {/* Complete Full-Height Document Body */}
                <View style={styles.fullPageBodyContainer}>
                  <View style={styles.bodyHeader}>
                    <Text style={styles.bodyHeaderTitle}>
                      {editingItem?.type === 'snippet' ? `💻 file${fileExtension}` : '📝 Content Body'}
                    </Text>
                    <View style={styles.bodyHeaderActions}>
                      {editingItem?.type === 'snippet' && (
                        <TouchableOpacity
                          style={styles.bodyActionBtn}
                          onPress={() => handleCopy(editingItem?.content || '', editingItem?.title || '')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.bodyActionText}>📋 Copy</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.bodyActionBtn, isEditingCode && styles.bodyActionBtnActive]}
                        onPress={() => setIsEditingCode(!isEditingCode)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.bodyActionText, isEditingCode && styles.bodyActionTextActive]}>
                          {isEditingCode ? '👁️ View' : '✏️ Edit'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editingItem?.type === 'snippet' ? (
                    isEditingCode ? (
                      <TextInput
                        style={styles.fullPageCodeEditor}
                        value={editingItem?.content}
                        onChangeText={(text) => setEditingItem((prev) => ({ ...prev, content: text }))}
                        placeholder="Write code here..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    ) : (
                      <View style={styles.fullPageCodeViewer}>
                        <SyntaxHighlighterText code={editingItem?.content || ''} extension={fileExtension} />
                      </View>
                    )
                  ) : (
                    // For notes/links
                    <TextInput
                      style={styles.fullPageNoteEditor}
                      value={editingItem?.content}
                      onChangeText={(text) => setEditingItem((prev) => ({ ...prev, content: text }))}
                      placeholder={editingItem?.type === 'link' ? 'https://example.com' : 'Write details here...'}
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                </View>

                {/* Bottom Sticky Action Bar */}
                <View style={styles.fullPageActions}>
                  {editingItem?.id && (
                    <TouchableOpacity
                      style={[styles.fullPageBtn, styles.fullPageDeleteBtn]}
                      onPress={() => handleDelete(editingItem.id!, editingItem.title || '')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.fullPageDeleteBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.fullPageBtn, styles.fullPageSaveBtn]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fullPageSaveBtnText}>💾 Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Original Create Resource Wizard (Only first time / adding a resource)
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
                  isEditingCode ? (
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
                    <View style={styles.codeViewerContainer}>
                      <View style={styles.codeViewerHeader}>
                        <Text style={styles.codeViewerTitle}>
                          📝 file{fileExtension}
                        </Text>
                        <TouchableOpacity
                          style={styles.codeViewerCopyBtn}
                          onPress={() => handleCopy(editingItem?.content || '', editingItem?.title || '')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.codeViewerCopyText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.codeViewerScroll} showsVerticalScrollIndicator={true}>
                        <SyntaxHighlighterText code={editingItem?.content || ''} extension={fileExtension} />
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.codeViewerEditBtn}
                        onPress={() => setIsEditingCode(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.codeViewerEditText}>✏️ Edit Code</Text>
                      </TouchableOpacity>
                    </View>
                  )
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
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Folder Creation Modal */}
      <Modal
        visible={newFolderModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNewFolderModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.folderModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.folderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Folder</Text>
              <TouchableOpacity onPress={() => setNewFolderModalVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.folderModalForm}>
              <Text style={styles.fieldLabel}>Folder Emoji Icon</Text>
              <View style={styles.emojiPickerRow}>
                {['📁', '⚛️', '🎨', '🖥️', '🧮', '🚀', '🐍', '📘', '📚', '🛠️'].map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[styles.emojiSelectBtn, newFolderEmoji === em && styles.emojiSelectBtnActive]}
                    onPress={() => setNewFolderEmoji(em)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emojiSelectText}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.emojiCustomInput}
                value={newFolderEmoji}
                onChangeText={setNewFolderEmoji}
                placeholder="Or type custom emoji..."
                maxLength={4}
              />

              <Text style={styles.fieldLabel}>Folder Category Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="e.g. NextJS Masterclass, Algorithms"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelFolderBtn]}
                  onPress={() => setNewFolderModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelFolderText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleCreateFolder}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Create Folder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  count: { color: Colors.textSecondary, fontSize: FontSize.sm },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 4 },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { color: Colors.textSecondary, fontSize: 16 },
  toggleTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, paddingBottom: 100 },
  gridList: {},
  row: { justifyContent: 'space-between', marginBottom: Spacing.md },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    elevation: 2,
  },
  folderEmoji: { fontSize: 36, marginBottom: 4 },
  folderName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', textAlign: 'center' },
  folderCount: { color: Colors.textMuted, fontSize: FontSize.xs },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  listEmoji: { fontSize: 28, marginRight: Spacing.md },
  listInfo: { flex: 1 },
  chevron: { color: Colors.textMuted, fontSize: FontSize.lg },
  newFolderBtn: {
    marginVertical: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  newFolderText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.xs },
  emptySubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },

  // Folder Drilldown Container
  folderDetailsContainer: { flex: 1 },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  folderHeaderTitle: { flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  folderHeaderCount: { color: Colors.textMuted, fontSize: FontSize.xs },
  detailsList: { padding: Spacing.md, paddingBottom: 100 },

  // Active folder search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.sm,
  },
  clearBtn: { padding: Spacing.xs },
  clear: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Item Card inside Folder
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  itemCardClickable: { gap: Spacing.sm },
  itemCardHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  itemCardEmoji: { fontSize: 32 },
  itemTitleArea: { flex: 1, gap: 4 },
  itemCardTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs },
  badge: {
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: { backgroundColor: Colors.background },
  extBadge: { backgroundColor: '#BD93F918' },
  badgeText: { color: Colors.textSecondary, fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  extTextBadge: { color: '#BD93F9' },
  itemCardDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 16 },
  itemCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  timeText: { color: Colors.textMuted, fontSize: FontSize.xs - 1 },
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
  actionBtnText: { color: Colors.text, fontSize: 10, fontWeight: '500' },

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

  // Modal Layouts
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
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
  modalTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
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
    fontSize: FontSize.lg,
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
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', marginBottom: -Spacing.xs },
  
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
    paddingVertical: Spacing.sm - 2,
  },
  typeSelectorBtnActive: { backgroundColor: Colors.primary + '18', borderColor: Colors.primary },
  typeSelectorEmoji: { fontSize: 14 },
  typeSelectorLabel: { color: Colors.textSecondary, fontSize: FontSize.xs },
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
  modalTagText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  modalTagTextActive: { color: Colors.white, fontWeight: '600' },

  // Dropdown ComboBox Styles
  dropdownTrigger: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  dropdownTriggerText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
  dropdownChevron: { color: Colors.textSecondary, fontSize: FontSize.xs },
  dropdownPanel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  customTagRow: { flexDirection: 'row', gap: Spacing.sm },
  customTagInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: FontSize.sm,
  },
  addTagBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  dropdownSectionLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -Spacing.xs,
  },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  // Monospace code editor
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
  codeViewerContainer: {
    backgroundColor: '#070A13',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    minHeight: 180,
    marginBottom: Spacing.xs,
  },
  codeViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  codeViewerTitle: {
    color: Colors.textSecondary,
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: '600',
  },
  codeViewerCopyBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  codeViewerCopyText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '500',
  },
  codeViewerScroll: {
    padding: Spacing.md,
    maxHeight: 250,
  },
  codeViewerEditBtn: {
    backgroundColor: Colors.primary + '18',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeViewerEditText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // Modal Actions
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  modalBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' },
  deleteBtn: { flex: 0.4, backgroundColor: Colors.error + '18', borderWidth: 1, borderColor: Colors.error + '44' },
  deleteBtnText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },

  // Folder creation specific styles
  folderModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' },
  folderModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '90%',
    paddingBottom: Spacing.md,
  },
  folderModalForm: { padding: Spacing.md, gap: Spacing.md },
  emojiPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  emojiSelectBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSelectBtnActive: { backgroundColor: Colors.primary + '18', borderColor: Colors.primary },
  emojiSelectText: { fontSize: 20 },
  emojiCustomInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    textAlign: 'center',
    width: 150,
    alignSelf: 'center',
  },
  cancelFolderBtn: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  cancelFolderText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  // Premium Notion-style full-page editor/viewer
  fullPageContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    flex: 1,
  },
  fullPageHeader: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fullPageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fullPageEmojiInput: {
    fontSize: FontSize.lg,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  fullPageTitleInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  fullPageDescInput: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingVertical: Spacing.xs,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  fullPageMetadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  fullPageBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  fullPageBadgeText: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  fullPageBodyContainer: {
    flex: 1,
    backgroundColor: '#070A13',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    minHeight: 300,
  },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bodyHeaderTitle: {
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  bodyHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bodyActionBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  bodyActionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bodyActionText: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: '600',
  },
  bodyActionTextActive: {
    color: Colors.white,
  },
  fullPageCodeViewer: {
    flex: 1,
  },
  fullPageCodeEditor: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    lineHeight: 18,
    color: '#D4D4D4',
    padding: Spacing.md,
    textAlignVertical: 'top',
  },
  fullPageNoteEditor: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.text,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    textAlignVertical: 'top',
  },
  fullPageActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  fullPageBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPageSaveBtn: {
    backgroundColor: Colors.primary,
  },
  fullPageSaveBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  fullPageDeleteBtn: {
    flex: 0.35,
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '35',
  },
  fullPageDeleteBtnText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
