import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const EXTRA_ITEMS = [
  { label: 'Settings', icon: '⚙️' },
  { label: 'About', icon: 'ℹ️' },
  { label: 'Help & Support', icon: '💬' },
];

export default function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const handleOptionPress = async (label: string) => {
    if (label === 'Settings') {
      router.navigate('/(app)/(tabs)/profile');
      props.navigation.closeDrawer();
    } else if (label === 'About') {
      setAboutModalVisible(true);
    } else if (label === 'Help & Support') {
      const email = 'ankur.appdev@gmail.com';
      const subject = encodeURIComponent('Spellbook Help & Support');
      const body = encodeURIComponent('Hi Ankur, I need assistance with the Spellbook app:\n\n');
      const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      
      try {
        const supported = await Linking.canOpenURL(emailUrl);
        if (supported) {
          await Linking.openURL(emailUrl);
        } else {
          // Fallback if canOpenURL doesn't report natively
          Linking.openURL(emailUrl);
        }
      } catch (error) {
        console.error('Email error:', error);
      }
    }
  };

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      {/* Upside: Profile info only */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.avatar ? user.avatar : (user?.name?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name ?? 'Developer'}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
        </View>
      </View>

      <View style={styles.headerDivider} />

      {/* Downside: Options and Sign Out */}
      <View style={styles.downsideContainer}>
        {/* Options Section */}
        <Text style={styles.sectionLabel}>OPTIONS</Text>
        <View style={styles.menuGroup}>
          {EXTRA_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => handleOptionPress(item.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.menuDivider} />

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutLabel}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* About Application Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>📖</Text>
            <Text style={styles.modalTitle}>About Spellbook</Text>
            <Text style={styles.modalVersion}>Version 1.0.0 (Beta)</Text>
            
            <View style={styles.modalDivider} />
            
            <Text style={styles.modalDesc}>
              Spellbook is a high-speed, dynamic developer companion and notebook. It is designed to catalog and manage code snippets, reference URLs, and Markdown documentation offline.
            </Text>
            
            <Text style={styles.modalFeatureTitle}>Key Features:</Text>
            <Text style={styles.modalFeatureItem}>• Live color-only syntax highlighting</Text>
            <Text style={styles.modalFeatureItem}>• Dynamic SQLite tag folder explorer</Text>
            <Text style={styles.modalFeatureItem}>• Premium custom Light / Dark themes</Text>
            
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setAboutModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
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
  headerDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  downsideContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuGroup: { gap: 2 },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  navIcon: { fontSize: 18, marginRight: Spacing.md },
  navLabel: { color: Colors.text, fontSize: FontSize.md },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  signOutIcon: { fontSize: 18, marginRight: Spacing.md },
  signOutLabel: { color: Colors.error, fontSize: FontSize.md, fontWeight: '600' },

  // About Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalEmoji: { fontSize: 44, marginBottom: 4 },
  modalTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  modalVersion: { color: Colors.textSecondary, fontSize: FontSize.xs },
  modalDivider: { width: '100%', height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  modalDesc: { color: Colors.textSecondary, fontSize: FontSize.sm - 1, lineHeight: 18, textAlign: 'center' },
  modalFeatureTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', alignSelf: 'flex-start', marginTop: Spacing.xs },
  modalFeatureItem: { color: Colors.textSecondary, fontSize: FontSize.xs, alignSelf: 'flex-start', marginLeft: Spacing.xs },
  modalCloseBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' },
});
