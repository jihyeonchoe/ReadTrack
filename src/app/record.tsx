import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { type Book } from '@/components/book-card';
import { ReadingTimer } from '@/components/reading-timer';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatPageProgress, saveSession } from '@/utils/sessions';
import { supabase } from '../../lib/supabase';

/** Record tab: pick a book you're reading, start the timer, add pages when you finish. */
export default function Record() {
  const theme = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const selected = books.find((b) => b.id === selectedId) ?? null;

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  async function loadBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, status, pages_read, total_pages, genre')
      .not('status', 'in', '(finished,want_to_read)')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Error loading books', error.message);
      return;
    }
    setBooks(data);
    // Keep the current choice if it still exists, otherwise pick the most recent book.
    setSelectedId((current) =>
      data.some((b: Book) => b.id === current) ? current : (data[0]?.id ?? null)
    );
  }

  async function save(minutes: number, pages: number | null, note: string | null) {
    if (!selected) return false;
    const ok = await saveSession(selected, minutes, pages, note);
    if (ok) {
      setRecording(false);
      router.navigate('/'); // show the new session in the Home feed
    }
    return ok;
  }

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.title}>
        Record
      </ThemedText>

      {books.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            No books in progress. Add a book on My Books to start recording.
          </ThemedText>
          <AppButton title="Go to My Books" variant="secondary" onPress={() => router.navigate('/books')} />
        </View>
      ) : (
        <>
          <ThemedText themeColor="textSecondary" style={styles.label}>
            What are you reading?
          </ThemedText>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {books.map((book) => {
              const isSelected = book.id === selectedId;
              return (
                <Pressable
                  key={book.id}
                  onPress={() => setSelectedId(book.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  style={[
                    styles.option,
                    { borderColor: isSelected ? theme.text : theme.border },
                  ]}>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: isSelected ? theme.text : theme.textSecondary },
                    ]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: theme.text }]} />}
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText type="serif" style={styles.bookTitle}>
                      {book.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatPageProgress(book.pages_read, book.total_pages)}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title="▶  Start"
              onPress={() => setRecording(true)}
              disabled={!selected}
            />
          </View>
        </>
      )}

      <ReadingTimer
        bookTitle={recording && selected ? selected.title : null}
        onSave={save}
        onDiscard={() => setRecording(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 24 },
  center: { textAlign: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', gap: 16 },
  label: { marginBottom: 16 },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, gap: 2 },
  bookTitle: { fontSize: 18, lineHeight: 24 },
  footer: { paddingTop: 12, paddingBottom: 24 },
});
