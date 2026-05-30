import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

type ToastProps = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
};



export default function Toast({
  visible,
  message,
  type = 'info',
  actionLabel,
  onAction,
  onDismiss,
  duration = 4000,
}: ToastProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  }, [animatedValue, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      // Auto dismiss timer
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      animatedValue.setValue(0);
    }
  }, [visible, duration, animatedValue, dismiss]);

  if (!visible) return null;

  // Map type to accent color and emoji icon
  const typeConfig = {
    success: { color: Colors.success, emoji: '✅' },
    error: { color: Colors.error, emoji: '❌' },
    warning: { color: Colors.warning, emoji: '⚠️' },
    info: { color: Colors.primary, emoji: 'ℹ️' },
  };

  const config = typeConfig[type];

  // Interpolate animations
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          borderLeftColor: config.color,
        },
      ]}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={() => {
            onAction();
            dismiss();
          }}
          style={[styles.actionBtn, { borderColor: config.color }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: config.color }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 5,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 9999,
  },
  emoji: {
    fontSize: 20,
    marginRight: Spacing.sm + 2,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  message: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
