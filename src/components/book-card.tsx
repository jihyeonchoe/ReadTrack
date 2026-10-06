import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type Book = {
  id: string;
  title: string;
  status: string;
  pages_read: number;
  total_pages: number | null;
  genre: string | null;
};

type BookCardProps = {
  book: Book;
  onOpen: () => void;
  onStartTimer: () => void;
  onLogSession: () => void;
  onSetTotalPages: () => void;
  onMarkFinished: () => void;
};

/** A book that is currently being read: title, progress and actions. */
export function BookCard({
  book,
  onOpen,
  onStartTimer,
  onLogSession,
  onSetTotalPages,
  onMarkFinished,
}: BookCardProps) {
  const theme = useTheme();
  const total = book.total_pages;
  const percent = total ? Math.min(100, Math.round((book.pages_read / total) * 100)) : null;

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityHint="Shows your reading sessions for this book"
        style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}>
        <ThemedText style={styles.title}>{book.title}</ThemedText>
        <ThemedText themeColor="textSecondary">›</ThemedText>
      </Pressable>

      {percent !== null ? (
        <View style={styles.progress}>
          <View style={styles.progressText}>
            <ThemedText type="smallBold">{percent}%</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {book.pages_read} / {total} pages
            </ThemedText>
          </View>
          <ProgressBar percent={percent} label={`${book.title}: ${percent}% read`} />
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {book.pages_read} pages read · add total pages to see your progress
        </ThemedText>
      )}

      <View style={styles.actions}>
        <AppButton title="▶  Start reading" onPress={onStartTimer} />
        <AppButton title="Log manually" variant="secondary" onPress={onLogSession} />
        {total === null && (
          <AppButton title="Set total pages" variant="secondary" onPress={onSetTotalPages} />
        )}
        <AppButton title="Mark as finished" variant="secondary" onPress={onMarkFinished} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 10, marginBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', flexShrink: 1 },
  pressed: { opacity: 0.6 },
  progress: { gap: 6 },
  progressText: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
