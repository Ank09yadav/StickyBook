import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import Toast from '../../../components/ui/Toast';
import { getDbItems, addDbItem, DbItem } from '../../../services/db';

const POPULAR_EXTENSIONS = ['.ts', '.jsx', '.tsx', '.css', '.py', '.js', '.json', '.sql', '.html', '.rs', '.go', '.sh', '.md', '.txt'];

export default function Home() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<DbItem[]>([]);

  // Toast States
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Modals States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'snippet' | 'link' | 'folder' | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTag, setFormTag] = useState('React');

  // Custom Dropdown ComboBox States
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // File Extension & Snippet States
  const [fileExtension, setFileExtension] = useState('.jsx');

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

  const getExtensionEmoji = (ext: string | undefined): string => {
    if (!ext) return '💻';
    const cleanExt = ext.toLowerCase().trim();
    switch (cleanExt) {
      case '.py':
        return '🐍';
      case '.js':
        return '🟨';
      case '.ts':
        return '🟦';
      case '.jsx':
      case '.tsx':
        return '⚛️';
      case '.html':
        return '🌐';
      case '.css':
        return '🎨';
      case '.json':
        return '📦';
      case '.sql':
        return '🗄️';
      case '.sh':
      case '.bash':
        return '🐚';
      case '.rs':
        return '🦀';
      case '.go':
        return '🐹';
      case '.md':
        return '📝';
      case '.txt':
        return '📄';
      default:
        return '💻';
    }
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

  // Toast Trigger Helper
  const showToast = (message: string, type: typeof toastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Computes Stats dynamically based on SQLite data
  const snippetCount = items.filter((i) => i.type === 'snippet').length;
  const linkCount = items.filter((i) => i.type === 'link').length;
  const fileCount = items.filter((i) => i.type === 'note' && i.emoji === '📎').length;

  // Handle Quick Action press
  const handleQuickAction = async (action: string) => {
    if (action === 'New Snippet') {
      setModalType('snippet');
      setFormTitle('');
      setFormDesc('');
      setFormContent('');
      setFormTag('React');
      setModalVisible(true);
    } else if (action === 'Add Link') {
      setModalType('link');
      setFormTitle('');
      setFormDesc('');
      setFormContent('');
      setFormTag('React');
      setModalVisible(true);
    } else if (action === 'New Folder') {
      setModalType('folder');
      setFormTitle('');
      setModalVisible(true);
    } else if (action === 'Upload File') {
      await handleFileUpload();
    }
  };

  // Upload Local File using expo-document-picker
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        showToast('File upload cancelled.', 'info');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileSizeKB = asset.size ? (asset.size / 1024).toFixed(1) : 'Unknown';
        
        const fileItem: DbItem = {
          id: Date.now().toString(),
          title: asset.name,
          description: `Cached path: ${asset.uri.substring(0, 30)}...\nSize: ${fileSizeKB} KB`,
          content: asset.uri, // Storing cached path in content
          tag: 'DevOps', // Default folder tag
          type: 'note',
          emoji: '📎',
          createdAt: 'Just now',
          fileExtension: asset.name.includes('.') ? '.' + asset.name.split('.').pop() : '.txt',
        };

        await addDbItem(fileItem);
        await loadData();
        showToast(`Uploaded "${asset.name}" successfully!`, 'success');
      }
    } catch (error) {
      console.error('File selection error:', error);
      showToast('Failed to select file. Please try again.', 'error');
    }
  };

  // Save new Snippet, Link or Folder
  const handleSaveItem = async () => {
    if (!formTitle.trim()) {
      showToast('Title is required!', 'error');
      return;
    }

    if (modalType === 'snippet') {
      if (!formContent.trim()) {
        showToast('Snippet code is required!', 'error');
        return;
      }

      const item: DbItem = {
        id: Date.now().toString(),
        title: formTitle,
        description: formDesc || 'Custom code snippet.',
        content: formContent,
        tag: formTag,
        type: 'snippet',
        emoji: getExtensionEmoji(fileExtension),
        createdAt: 'Just now',
        fileExtension: fileExtension,
      };

      await addDbItem(item);
      showToast(`Snippet "${formTitle}" saved!`, 'success');
    } else if (modalType === 'link') {
      if (!formContent.trim()) {
        showToast('Link URL is required!', 'error');
        return;
      }

      const item: DbItem = {
        id: Date.now().toString(),
        title: formTitle,
        description: formDesc || 'Saved link reference.',
        content: formContent,
        tag: formTag,
        type: 'link',
        emoji: '🔗',
        createdAt: 'Just now',
      };

      await addDbItem(item);
    } else if (modalType === 'folder') {
      showToast(`Folder "${formTitle}" created successfully!`, 'success');
    }

    setModalVisible(false);
    setModalType(null);
    await loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', emoji: '☀️' };
    } else if (hour >= 17 && hour < 22) {
      return { text: 'Good evening', emoji: '🌆' };
    } else {
      return { text: 'Bed time', emoji: '✨' };
    }
  };

  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetText}>
            {greeting.text}, <Text style={styles.greetName}>{user?.name ?? 'dev'}</Text> {greeting.emoji}
          </Text>
          <Text style={styles.greetSub}>What are you saving today?</Text>
        </View>

        {/* Dynamic Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Snippets', value: snippetCount.toString() },
            { label: 'Links', value: linkCount.toString() },
            { label: 'Files', value: fileCount.toString() },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'New Snippet', emoji: '✏️' },
            { label: 'Add Link', emoji: '🔗' },
            { label: 'Upload File', emoji: '📎' },
            { label: 'New Folder', emoji: '📂' },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionBtn}
              onPress={() => handleQuickAction(a.label)}
              activeOpacity={0.75}
            >
              <Text style={styles.actionEmoji}>{a.emoji}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Recently Saved */}
        <Text style={styles.sectionTitle}>Recently Saved</Text>
        
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗒️</Text>
            <Text style={styles.emptyTitle}>Your StickyBook is empty</Text>
            <Text style={styles.emptySubtitle}>
              Create a snippet, add a link, or upload a local file using the Quick Actions above!
            </Text>
          </View>
        ) : (
          items.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.recentCard}>
              <Text style={styles.recentEmoji}>{item.emoji}</Text>
              <View style={styles.recentInfo}>
                <Text style={styles.recentTitle}>{item.title}</Text>
                <Text style={styles.recentMeta}>
                  <Text style={styles.recentTag}>{item.tag}</Text>
                  {item.fileExtension ? (
                    <Text style={styles.recentExt}> ({item.fileExtension})</Text>
                  ) : null}
                  {'  ·  '}
                  {item.createdAt}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Creation Modal for Snippets, Links & Folders */}
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
                {modalType === 'snippet'
                  ? 'New Snippet'
                  : modalType === 'link'
                  ? 'Add Web Link'
                  : 'Create Folder'}
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
              {/* Title Field */}
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder={
                  modalType === 'snippet'
                    ? 'e.g. useDebounce hook'
                    : modalType === 'link'
                    ? 'e.g. Google Fonts'
                    : 'Folder Name'
                }
                placeholderTextColor={Colors.textMuted}
              />

              {modalType !== 'folder' && (
                <>
                  {/* Description Field */}
                  <Text style={styles.fieldLabel}>Description (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formDesc}
                    onChangeText={setFormDesc}
                    placeholder="Short description..."
                    placeholderTextColor={Colors.textMuted}
                  />

                  {/* Folder Selection - Custom Dropdown ComboBox */}
                  <Text style={styles.fieldLabel}>Folder Name</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setTagDropdownOpen(!tagDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownTriggerText}>📂 {formTag}</Text>
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
                              setFormTag(newTag);
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
                              formTag === tag && styles.modalTagItemActive,
                            ]}
                            onPress={() => {
                              setFormTag(tag);
                              setFileExtension(autoDeriveExtension(tag));
                              setTagDropdownOpen(false);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.modalTagText,
                                formTag === tag && styles.modalTagTextActive,
                              ]}
                            >
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* File Type Extension selector */}
                  {modalType === 'snippet' && (
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

                  {/* Snippet / Link Content Field */}
                  <Text style={styles.fieldLabel}>
                    {modalType === 'link' ? 'Web URL Link' : 'Code Content Body'}
                  </Text>
                  
                  {modalType === 'snippet' ? (
                    <TextInput
                      style={styles.codeEditor}
                      value={formContent}
                      onChangeText={setFormContent}
                      placeholder="Paste or write code here..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  ) : (
                    <TextInput
                      style={styles.modalInput}
                      value={formContent}
                      onChangeText={setFormContent}
                      placeholder={
                        modalType === 'link'
                          ? 'https://example.com'
                          : 'Paste or write notes content here...'
                      }
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSaveItem}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    {modalType === 'folder' ? 'Create Folder' : 'Save Resource'}
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
  container: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, paddingHorizontal: Spacing.md },
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
    marginTop: Spacing.sm,
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
  
  // Recent Card layout
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

  // Empty State Layout
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  emptyIcon: { fontSize: 44, marginBottom: Spacing.sm },
  emptyTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

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

  // Premium Code Editor styles
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
