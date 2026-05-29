import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormInput from '../../components/ui/FormInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { sendPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();

  async function handleReset() {
    if (!email.trim()) return setEmailError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setEmailError('Enter a valid email');
    setEmailError('');
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.icon}>{sent ? '✅' : '🔐'}</Text>
        <Text style={styles.title}>{sent ? 'Check your inbox' : 'Reset Password'}</Text>
        <Text style={styles.subtitle}>
          {sent
            ? `We sent a reset link to ${email}. Follow the instructions to regain access.`
            : "Enter your email and we'll send you a link to reset your password."}
        </Text>

        {!sent && (
          <View style={styles.card}>
            <FormInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />
            <PrimaryButton label="Send Reset Link" loading={loading} onPress={handleReset} />
          </View>
        )}

        {sent && (
          <PrimaryButton
            label="Back to Sign In"
            onPress={() => router.replace('/(auth)/sign-in')}
            style={{ width: '100%', marginTop: Spacing.lg }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  back: { alignSelf: 'flex-start', marginBottom: Spacing.xl },
  backText: { color: Colors.primary, fontSize: FontSize.sm },
  icon: { fontSize: 64, marginBottom: Spacing.md },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
