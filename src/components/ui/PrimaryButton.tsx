import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '../../constants/theme';

type Props = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export default function PrimaryButton({ label, loading, variant = 'primary', style, ...props }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.btn, isPrimary ? styles.primary : styles.ghost, style]}
      activeOpacity={0.8}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.white : Colors.primary} />
      ) : (
        <Text style={[styles.label, !isPrimary && styles.ghostLabel]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.primary },
  ghost: { borderWidth: 1, borderColor: Colors.border },
  label: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  ghostLabel: { color: Colors.text },
});
