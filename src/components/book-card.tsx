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

/** A book that is currently being read: title, progress, one main action and quiet secondary links. */
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
        accessibilityHint="Opens your reading log for this book"
        style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}>
        <ThemedText type="serif" style={styles.title}>
          {book.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">›</ThemedText>
      </Pressable>

      {percent !== null ? (
        <View style={styles.progress}>
          <ProgressBar percent={percent} label={`${book.title}: ${percent}% read`} />
          <View style={styles.progressText}>
            <ThemedText type="small" themeColor="textSecondary">
              {book.pages_read} of {total} pages
            </ThemedText>
            <ThemedText type="small">{percent}%</ThemedText>
          </View>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {book.pages_read} pages read
        </ThemedText>
      )}

      <View style={styles.main}>
        <AppButton title="Start reading" onPress={onStartTimer} />
      </View>

      <View style={styles.links}>
        <AppButton title="Log manually" variant="text" onPress={onLogSession} />
        {total === null && <AppButton title="Add total pages" variant="text" onPress={onSetTotalPages} />}
        <AppButton title="Finished" variant="text" onPress={onMarkFinished} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 20, gap: 12, marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flexShrink: 1, fontSize: 21, lineHeight: 28 },
  pressed: { opacity: 0.6 },
  progress: { gap: 8 },
  progressText: { flexDirection: 'row', justifyContent: 'space-between' },
  main: { marginTop: 4 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 24, marginTop: -4 },
});
