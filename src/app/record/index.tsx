import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { BookCard, type Book } from '@/components/book-card';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { NoteField } from '@/components/note-field';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ReadingTimer } from '@/components/reading-timer';
import { useTheme } from '@/hooks/use-theme';
import { saveSession } from '@/utils/sessions';
import { supabase } from '../../../lib/supabase';



/** Returns a positive whole number, or null for empty/invalid input. */
function toPositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Record tab: books in progress as cards — start the timer, log manually, or finish. */
export default function Record() {
  const theme = useTheme();
  const [books, setBooks] = useState<Book[]>([]);

  // Log-session modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');

  // Set-total-pages modal
  const [totalBookId, setTotalBookId] = useState<string | null>(null);
  const [totalInput, setTotalInput] = useState('');

  // Book being recorded with the timer
  const [timerBook, setTimerBook] = useState<Book | null>(null);


  async function loadBooks() {
    const { data: userData } = await supabase.auth.getUser();
    const me = userData.user?.id;
    if (!me) return;
    const [bookRes, recentRes] = await Promise.all([
      supabase
        .from('books')
        .select('id, title, status, pages_read, total_pages, genre, google_id')
        .eq('user_id', me)
        .not('status', 'in', '(finished,want_to_read)')
        .order('created_at', { ascending: false }),
      supabase
        .from('reading_sessions')
        .select('book_id')
        .eq('user_id', me)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (bookRes.error) {
      Alert.alert('Error loading books', bookRes.error.message);
      return;
    }
    // Most recently read first; books never read keep their newest-added order.
    const order = [...new Set((recentRes.data ?? []).map((r) => r.book_id as string))];
    const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
    setBooks([...(bookRes.data as Book[])].sort((a, b) => rank(a.id) - rank(b.id)));
  }

  function openLog(id: string) {
    router.push({ pathname: '/record/book/[id]', params: { id } });
  }

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  async function markFinished(id: string) {
    const { error } = await supabase.from('books').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', id);
    if (error) Alert.alert('Error updating book', error.message);
    else loadBooks();
  }

  async function saveTotalPages() {
    const total = toPositiveInt(totalInput);
    if (!totalBookId || !total) return;
    const { error } = await supabase
      .from('books')
      .update({ total_pages: total })
      .eq('id', totalBookId);
    if (error) {
      Alert.alert('Error saving total pages', error.message);
      return;
    }
    setTotalBookId(null);
    loadBooks();
  }

  function openSessionModal(bookId: string) {
    setActiveBookId(bookId);
    setMinutes('');
    setPages('');
    setNote('');
    setModalVisible(true);
  }

  async function saveManualSession() {
    const book = books.find((b) => b.id === activeBookId);
    if (!book) return;
    const ok = await saveSession(
      book,
      toPositiveInt(minutes),
      toPositiveInt(pages),
      note.trim() || null
    );
    if (ok) {
      setModalVisible(false);
      loadBooks();
    }
  }

  async function saveTimerSession(
    timerMinutes: number,
    timerPages: number | null,
    timerNote: string | null
  ) {
    if (!timerBook) return false;
    const ok = await saveSession(timerBook, timerMinutes, timerPages, timerNote);
    if (ok) {
      setTimerBook(null);
      router.navigate('/'); // show the new session in the Home feed
    }
    return ok;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          Record
        </ThemedText>

        {books.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              No books in progress. Search for a book on My Books to start.
            </ThemedText>
            <AppButton
              title="Go to My Books"
              variant="secondary"
              onPress={() => router.navigate('/books')}
            />
          </View>
        ) : (
          books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => openLog(book.id)}
              onStartTimer={() => setTimerBook(book)}
              onLogSession={() => openSessionModal(book.id)}
              onSetTotalPages={() => {
                setTotalInput('');
                setTotalBookId(book.id);
              }}
              onMarkFinished={() => markFinished(book.id)}
            />
          ))
        )}
      </ScrollView>

      <ReadingTimer
        bookTitle={timerBook?.title ?? null}
        onSave={saveTimerSession}
        onDiscard={() => setTimerBook(null)}
      />

      <Sheet
        visible={modalVisible}
        title="Log a reading session"
        onClose={() => setModalVisible(false)}>
        <TextField
          placeholder="Minutes read"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
        />
        <TextField
          placeholder="Pages read"
          value={pages}
          onChangeText={setPages}
          keyboardType="number-pad"
        />
        <NoteField value={note} onChangeText={setNote} />
        <AppButton title="Save session" onPress={saveManualSession} />
        <AppButton title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
      </Sheet>

      <Sheet
        visible={totalBookId !== null}
        title="How many pages is this book?"
        onClose={() => setTotalBookId(null)}>
        <TextField
          placeholder="Total pages"
          value={totalInput}
          onChangeText={setTotalInput}
          keyboardType="number-pad"
          autoFocus
        />
        <AppButton
          title="Save"
          onPress={saveTotalPages}
          disabled={toPositiveInt(totalInput) === null}
        />
        <AppButton title="Cancel" variant="secondary" onPress={() => setTotalBookId(null)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 64 },
  empty: { gap: 16, marginTop: 48 },
  center: { textAlign: 'center' },
  title: { marginBottom: 24 },
  flex: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 44,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  rowTitle: { fontSize: 17, lineHeight: 24 },
  finishedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  finishedTitle: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
