import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type GoalCardProps = {
  title: string; // e.g. "2026 reading goal"
  done: number;
  goal: number | null;
  unit: string; // "books" | "min"
  /** 0–1: how much of the period has passed, for the "on track" marker. */
  elapsed: number;
  onEdit: () => void;
};

/**
 * Goal progress, Strava style: big percentage, a thick bar, and a marker
 * showing where you should be by today — plus how far ahead/behind you are.
 */
export function GoalCard({ title, done, goal, unit, elapsed, onEdit }: GoalCardProps) {
  const theme = useTheme();

  if (!goal) {
    return (
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        style={[styles.card, styles.empty, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tap to set a goal ›
        </ThemedText>
      </Pressable>
    );
  }

  const pct = Math.round((done / goal) * 100);
  const expected = goal * elapsed;
  const diff = done - expected;
  const reached = done >= goal;
  const gap = Math.max(1, Math.round(Math.abs(diff)));
  const gapUnit = unit === 'books' && gap === 1 ? 'book' : unit;
  const status = reached
    ? 'Goal reached 🎉'
    : Math.abs(diff) < (unit === 'books' ? 0.5 : 5)
      ? 'Right on track'
      : diff > 0
        ? `${gap} ${gapUnit} ahead of schedule`
        : `${gap} ${gapUnit} behind schedule`;

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.top}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Edit ${title}`} hitSlop={12}>
          <ThemedText type="small" themeColor="textSecondary">
            Edit
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.numbers}>
        <ThemedText style={styles.pct}>{pct}%</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {done} / {goal} {unit}
        </ThemedText>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.min(100, pct) }}
        style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${Math.min(100, pct)}%`, backgroundColor: theme.text }]} />
        {!reached && (
          <View
            style={[styles.marker, { left: `${Math.min(100, elapsed * 100)}%`, backgroundColor: theme.textSecondary }]}
          />
        )}
      </View>

      <ThemedText type="small" themeColor={diff < 0 && !reached ? 'textSecondary' : 'text'}>
        {status}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 220, borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  empty: { justifyContent: 'center', minHeight: 120 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numbers: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pct: { fontSize: 36, lineHeight: 42, fontWeight: '800' },
  track: { height: 12, borderRadius: 6, overflow: 'visible', justifyContent: 'center' },
  fill: { height: '100%', borderRadius: 6 },
  marker: { position: 'absolute', width: 2, height: 20, top: -4, marginLeft: -1, borderRadius: 1 },
});
