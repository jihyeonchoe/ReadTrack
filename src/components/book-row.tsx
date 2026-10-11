import { Pressable, StyleSheet } from 'react-native';

import { type Book } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** One line in a book list: serif title on the left, a short detail and › on the right. */
export function BookRow({ book, onPress }: { book: Book; onPress: () => void }) {
  const theme = useTheme();
  const total = book.total_pages;
  const detail =
    book.status === 'finished' || book.status === 'want_to_read'
      ? total
        ? `${total} pages`
        : ''
      : total
        ? `${Math.min(100, Math.round((book.pages_read / total) * 100))}%`
        : `${book.pages_read} pages`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && styles.pressed]}>
      <ThemedText type="serif" style={styles.title} numberOfLines={2}>
        {book.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {detail}  ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { flexShrink: 1, fontSize: 17, lineHeight: 24 },
  pressed: { opacity: 0.6 },
});
