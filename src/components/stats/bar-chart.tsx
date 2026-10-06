import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { type Bar } from '@/utils/stats';

const HEIGHT = 120;

/**
 * Vertical bar chart (single series, minutes). Tap a bar to see its value;
 * by default the current day/month is shown. Values are also exposed to screen readers.
 */
export function BarChart({ bars, unit = 'min' }: { bars: Bar[]; unit?: string }) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected ?? bars.findIndex((b) => b.current);
  const shownBar = bars[shown];

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.readout}>
        {shownBar ? `${shownBar.label} · ${shownBar.value} ${unit}` : ' '}
      </ThemedText>
      <View style={styles.plot}>
        {bars.map((b, i) => {
          const h = b.value > 0 ? Math.max(4, (b.value / max) * HEIGHT) : 0;
          const active = i === shown;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              accessibilityRole="button"
              accessibilityLabel={`${b.label}: ${b.value} ${unit}`}
              style={styles.slot}>
              <View style={[styles.track, { height: HEIGHT }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h,
                      backgroundColor: active ? theme.text : theme.textSecondary,
                    },
                  ]}
                />
              </View>
              <View style={[styles.baseline, { backgroundColor: theme.border }]} />
              <ThemedText
                type="small"
                style={{ color: active ? theme.text : theme.textSecondary, fontWeight: active ? '700' : '500' }}>
                {b.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { marginBottom: 8 },
  plot: { flexDirection: 'row', gap: 2 },
  slot: { flex: 1, alignItems: 'center' },
  track: { width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: 1, alignSelf: 'stretch', marginBottom: 4 },
});
