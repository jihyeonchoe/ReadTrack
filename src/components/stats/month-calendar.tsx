import { useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/utils/reading';

// Reading-intensity shades, lightest to darkest — grays only, never black.
const HEAT = {
  light: ['#EDEDEA', '#DCDCD8', '#C4C4BF', '#A8A8A3'],
  dark: ['#242424', '#303030', '#3D3D3D', '#4D4D4D'],
};

/** 0 = no reading, 1 = under 15 min, 2 = 15–30, 3 = 30–60, 4 = an hour or more. */
function heatLevel(minutes: number | undefined): number {
  if (minutes === undefined) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

/**
 * Month grid (Monday first) for the month containing `now`. The more you read on a day,
 * the darker it is (like a contribution graph). Today is outlined.
 */
export function MonthCalendar({
  readDays,
  now = new Date(),
  onPrev,
  onNext,
  onDayPress,
}: {
  readDays: Record<string, number>;
  now?: Date;
  /** Swipe right → previous month. */
  onPrev?: () => void;
  /** Swipe left → next month. */
  onNext?: () => void;
  /** Tap a day (YYYY-MM-DD). */
  onDayPress?: (date: string) => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const shade = (level: number) => HEAT[scheme][level - 1];
  // Keep the latest callbacks for the gesture handler (it is created once).
  const handlers = useRef({ onPrev, onNext });
  handlers.current = { onPrev, onNext };
  const swipe = useRef(
    PanResponder.create({
      // Only claim clearly horizontal drags, so vertical scrolling still works.
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx > 50) handlers.current.onPrev?.();
        else if (g.dx < -50) handlers.current.onNext?.();
      },
    })
  ).current;
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // blanks before the 1st
  const today = localDateString(new Date());

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View {...swipe.panHandlers}>
      <View style={styles.week}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.head}>
            {d}
          </ThemedText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const date = localDateString(new Date(y, m, day));
          const read = date in readDays;
          const level = heatLevel(readDays[date]);
          const isToday = date === today;
          return (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
              onPress={() => onDayPress?.(date)}
              disabled={!onDayPress}
              accessibilityRole="button"
              accessibilityLabel={`${day}: ${read ? `read ${readDays[date]} minutes` : 'no reading'}`}>
              <View
                style={[
                  styles.day,
                  read && { backgroundColor: shade(level) },
                  isToday && { borderWidth: 1, borderColor: theme.text },
                ]}>
                <ThemedText
                  type="small"
                  style={{
                    color: read ? theme.text : theme.textSecondary,
                    fontWeight: read ? '600' : '400',
                  }}>
                  {day}
                </ThemedText>
                <View
                  style={[
                    styles.mark,
                    read && { backgroundColor: theme.text },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', marginBottom: 4 },
  head: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 2 },
  mark: { width: 4, height: 4, borderRadius: 2 },
  pressed: { opacity: 0.5 },
});
