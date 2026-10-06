import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { type Share } from '@/utils/stats';

/** Labelled horizontal bars (time of day, genres). The largest share is drawn in black. */
export function ShareBars({ shares, empty }: { shares: Share[]; empty: string }) {
  const theme = useTheme();
  const total = shares.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        {empty}
      </ThemedText>
    );
  }
  const max = Math.max(...shares.map((s) => s.value));

  return (
    <View style={styles.list}>
      {shares.map((s) => {
        const pct = Math.round((s.value / total) * 100);
        const top = s.value === max;
        return (
          <View key={s.label} style={styles.row} accessible accessibilityLabel={`${s.label}: ${s.value} minutes, ${pct}%`}>
            <View style={styles.labels}>
              <ThemedText type={top ? 'smallBold' : 'small'}>{s.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {s.value} min · {pct}%
              </ThemedText>
            </View>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${(s.value / max) * 100}%`,
                    backgroundColor: top ? theme.text : theme.textSecondary,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
