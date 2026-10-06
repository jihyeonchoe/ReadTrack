import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

/** Black filled (primary) or outlined (secondary) button. */
export function AppButton({ title, onPress, variant = 'primary', disabled }: AppButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: theme.text, borderColor: theme.text }
          : { backgroundColor: 'transparent', borderColor: theme.border },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, { color: primary ? theme.background : theme.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '600' },
  dimmed: { opacity: 0.5 },
});
