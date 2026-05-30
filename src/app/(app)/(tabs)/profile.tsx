import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import Toast from '../../../components/ui/Toast';

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
  const { user, signOut, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  // Toast States
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  const [newAvatar, setNewAvatar] = useState(user?.avatar ?? '👨‍💻');

  const showToast = (message: string, type: typeof toastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const openEditModal = () => {
    setNewName(user?.name ?? '');
    setNewAvatar(user?.avatar ?? '👨‍💻');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      showToast('Name is required!', 'error');
      return;
    }

    try {
      await updateProfile(newName.trim(), newAvatar);
      showToast('Profile updated successfully!', 'success');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('Failed to update profile.', 'error');
    }
  };

  const handleSettingPress = (label: string) => {
    if (label === 'Edit Profile') {
      openEditModal();
    } else {
      showToast(`"${label}" support coming soon!`, 'info');
    }
  };

  return (
    <View style={styles.wrapper}>
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
        {/* Avatar & Profile Information */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.avatar ? user.avatar : (user?.name?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.penBadge} onPress={openEditModal} activeOpacity={0.8}>
              <Text style={styles.penIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
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
                  onPress={() => handleSettingPress(item.label)}
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

        <Text style={styles.version}>Spellbook v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Avatar Selector */}
              <Text style={styles.fieldLabel}>Profile Emoji Icon (DP)</Text>
              <View style={styles.emojiPickerRow}>
                {['👨‍💻', '👩‍💻', '🚀', '👾', '💡', '🎨', '🖥️', '🧮', '🦊', '🦁'].map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[styles.emojiSelectBtn, newAvatar === em && styles.emojiSelectBtnActive]}
                    onPress={() => setNewAvatar(em)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emojiSelectText}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.emojiCustomInput}
                value={newAvatar}
                onChangeText={setNewAvatar}
                placeholder="Or type custom emoji..."
                maxLength={4}
              />

              {/* Profile Name */}
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your Display Name"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />

              {/* Email (Read-Only) */}
              <Text style={styles.fieldLabel}>Email Address (Read-only)</Text>
              <TextInput
                style={[styles.modalInput, styles.disabledInput]}
                value={user?.email}
                editable={false}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSaveProfile}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Save Changes</Text>
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
  wrapper: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, backgroundColor: Colors.background },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  penBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  penIcon: {
    fontSize: 12,
    color: Colors.white,
  },
  name: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' },
  email: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
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
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, paddingBottom: Spacing.lg },

  // Edit Modal Layouts
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
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', marginBottom: -Spacing.xs },
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
  disabledInput: {
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
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
  cancelBtn: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  // Emoji picker specific styles
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
});
