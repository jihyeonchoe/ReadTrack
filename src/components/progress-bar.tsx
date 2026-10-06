import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Thin black-on-gray bar. `percent` is 0–100. */
export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: theme.text }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
