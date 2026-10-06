import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/utils/reading';

/** Current month grid (Monday first). Days you read are filled black; today is outlined. */
export function MonthCalendar({ readDays, now = new Date() }: { readDays: Record<string, number>; now?: Date }) {
  const theme = useTheme();
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // blanks before the 1st
  const today = localDateString(now);

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
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
          const isToday = date === today;
          return (
            <View
              key={i}
              style={styles.cell}
              accessible
              accessibilityLabel={`${day}: ${read ? `read ${readDays[date]} minutes` : 'no reading'}`}>
              <View
                style={[
                  styles.dot,
                  read && { backgroundColor: theme.text },
                  isToday && { borderWidth: 2, borderColor: theme.text },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: read ? theme.background : theme.textSecondary, fontWeight: read ? '700' : '500' }}>
                  {day}
                </ThemedText>
              </View>
            </View>
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
  dot: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
