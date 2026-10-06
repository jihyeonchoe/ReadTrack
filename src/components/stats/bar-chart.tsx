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
export function BarChart({
  bars,
  unit = 'min',
  unitOne,
}: {
  bars: Bar[];
  unit?: string;
  /** Singular unit, e.g. "book" — used when the value is 1. */
  unitOne?: string;
}) {
  const theme = useTheme();
  const unitFor = (n: number) => (n === 1 && unitOne ? unitOne : unit);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected ?? bars.findIndex((b) => b.current);
  const shownBar = bars[shown];

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.readout}>
        {shownBar ? `${shownBar.fullLabel ?? shownBar.label} · ${shownBar.value} ${unitFor(shownBar.value)}` : ' '}
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
              accessibilityLabel={`${b.fullLabel ?? b.label}: ${b.value} ${unitFor(b.value)}`}
              style={styles.slot}>
              <View style={[styles.track, { height: HEIGHT }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h,
                      backgroundColor: active ? theme.text : theme.backgroundSelected,
                    },
                  ]}
                />
              </View>
              <View style={[styles.baseline, { backgroundColor: theme.border }]} />
              <ThemedText
                type="small"
                style={{ color: active ? theme.text : theme.textSecondary, fontWeight: active ? '600' : '400' }}>
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
  bar: { width: '56%', maxWidth: 22, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: 1, alignSelf: 'stretch', marginBottom: 4 },
});
