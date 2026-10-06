import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
};

/**
 * primary: filled pill. secondary: hairline-outlined pill.
 * text: no box at all — for quiet, low-priority actions.
 */
export function AppButton({ title, onPress, variant = 'primary', disabled }: AppButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const text = variant === 'text';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        text ? styles.textBase : styles.base,
        primary && { backgroundColor: theme.text, borderColor: theme.text },
        variant === 'secondary' && { backgroundColor: 'transparent', borderColor: theme.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text
        style={[
          styles.label,
          { color: primary ? theme.background : text ? theme.textSecondary : theme.text },
          text && styles.textLabel,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
  textLabel: { fontSize: 14, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.35 },
});
