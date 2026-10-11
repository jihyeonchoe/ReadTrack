import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { readersLabel, useReadersCount } from '@/hooks/use-readers-count';
import { useTheme } from '@/hooks/use-theme';

export type Book = {
  id: string;
  title: string;
  status: string;
  pages_read: number;
  total_pages: number | null;
  genre: string | null;
  google_id?: string | null;
};

type BookCardProps = {
  book: Book;
  onOpen: () => void;
  onStartTimer: () => void;
  onLogSession: () => void;
  onSetTotalPages: () => void;
  onMarkFinished: () => void;
};

/**
 * Compact card for a book in progress (Record tab): title and progress on the left,
 * a small round ▶ on the right, quiet links underneath. About four fit on one screen.
 */
export function BookCard({
  book,
  onOpen,
  onStartTimer,
  onLogSession,
  onSetTotalPages,
  onMarkFinished,
}: BookCardProps) {
  const theme = useTheme();
  const readers = useReadersCount(book.google_id);
  const total = book.total_pages;
  const percent = total ? Math.min(100, Math.round((book.pages_read / total) * 100)) : null;

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.top}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityHint="Opens your reading log for this book"
          style={({ pressed }) => [styles.info, pressed && styles.pressed]}>
          <ThemedText type="serif" style={styles.title} numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {percent !== null ? `${percent}% · ${book.pages_read}/${total} pages` : `${book.pages_read} pages read`}
            {readers > 0 ? ` · ${readersLabel(readers)}` : ''}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={onStartTimer}
          accessibilityRole="button"
          accessibilityLabel={`Start reading ${book.title}`}
          hitSlop={8}
          style={({ pressed }) => [
            styles.start,
            { borderColor: theme.text },
            pressed && styles.startPressed,
          ]}>
          <ThemedText style={styles.startIcon}>▶</ThemedText>
        </Pressable>
      </View>

      {percent !== null && <ProgressBar percent={percent} label={`${book.title}: ${percent}% read`} />}

      <View style={styles.links}>
        <AppButton title="Log manually" variant="text" onPress={onLogSession} />
        {total === null && <AppButton title="Add total pages" variant="text" onPress={onSetTotalPages} />}
        <AppButton title="Finished" variant="text" onPress={onMarkFinished} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2, gap: 10, marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 18, lineHeight: 24 },
  pressed: { opacity: 0.6 },
  start: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPressed: { opacity: 0.6, transform: [{ scale: 0.95 }] },
  startIcon: { fontSize: 15, lineHeight: 18, marginLeft: 2 },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 },
});
