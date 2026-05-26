import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '../../constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  isPassword?: boolean;
};

export default function FormInput({ label, error, isPassword, ...props }: Props) {
  const [hidden, setHidden] = useState(isPassword ?? false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eye}>
            <Text style={styles.eyeText}>{hidden ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  eye: { paddingHorizontal: Spacing.sm },
  eyeText: { fontSize: 16 },
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
});
