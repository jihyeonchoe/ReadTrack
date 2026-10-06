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
      style={[
        styles.input,
        { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
