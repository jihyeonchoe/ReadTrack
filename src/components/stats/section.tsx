import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Bordered card with a small uppercase heading, used for every block on the Stats tab. */
export function Section({ title, right, children, style, ...rest }: ViewProps & { title: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.border }, style]} {...rest}>
      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.title}>
          {title.toUpperCase()}
        </ThemedText>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { letterSpacing: 1 },
});
