import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Text input styled for the app theme. The placeholder doubles as the accessibility label. */
export function TextField({ style, placeholder, ...rest }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      placeholderTextColor={theme.textSecondary}
      style={[styles.input, { color: theme.text, borderColor: theme.border }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
