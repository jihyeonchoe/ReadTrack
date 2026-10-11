import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Profile picture placeholder: the first letter of the name in a circle. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const theme = useTheme();
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.text },
      ]}>
      <ThemedText
        style={{
          color: theme.background,
          fontFamily: Fonts.serif,
          fontSize: size * 0.45,
          lineHeight: size * 0.6,
        }}>
        {initial}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
