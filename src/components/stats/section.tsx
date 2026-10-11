import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** A block on the Stats tab: hairline divider on top, serif heading, lots of air. No box. */
export function Section({ title, right, children, style, ...rest }: ViewProps & { title: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.border }, style]} {...rest}>
      <View style={styles.header}>
        <ThemedText type="serif" style={styles.title}>
          {title}
        </ThemedText>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderTopWidth: 1, paddingTop: 20, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, lineHeight: 26 },
});
