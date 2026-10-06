import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = ViewProps & { centered?: boolean };

/** Full-screen background with safe-area padding and a centered, max-width content column. */
export function Screen({ centered, style, children, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.fill}>
      <View
        style={[
          styles.column,
          { paddingTop: insets.top + Spacing.four },
          centered && styles.centered,
          style,
        ]}
        {...rest}>
        {children}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  centered: { justifyContent: 'center' },
});
