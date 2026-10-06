import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { BookCard, type Book } from '@/components/book-card';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ReadingTimer } from '@/components/reading-timer';
import { useTheme } from '@/hooks/use-theme';
import { saveSession } from '@/utils/sessions';
import { supabase } from '../../../lib/supabase';

/** Status value for books on the Want to Read list. */
const WANT = 'want_to_read';

/** Returns a positive whole number, or null for empty/invalid input. */
function toPositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function Books() {
  const theme = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [totalPages, setTotalPages] = useState('');

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

  const reading = books.filter((b) => b.status !== 'finished' && b.status !== WANT);
  const wantToRead = books.filter((b) => b.status === WANT);
  const finished = books.filter((b) => b.status === 'finished');

  async function loadBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, status, pages_read, total_pages, genre')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error loading books', error.message);
    else setBooks(data);
  }

  function openLog(id: string) {
    router.push({ pathname: '/books/[id]', params: { id } });
  }

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  /** Adds a book either to Currently Reading or to the Want to Read list. */
  async function addBook(list: 'reading' | 'want') {
    if (!title.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('books').insert({
      title: title.trim(),
      total_pages: toPositiveInt(totalPages),
      user_id: userData.user?.id,
      ...(list === 'want' ? { status: WANT } : {}),
    });
    if (error) Alert.alert('Error adding book', error.message);
    else {
      setTitle('');
      setTotalPages('');
      loadBooks();
    }
  }

  async function startReading(id: string) {
    const { error } = await supabase.from('books').update({ status: 'reading' }).eq('id', id);
    if (error) Alert.alert('Error updating book', error.message);
    else loadBooks();
  }

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
      loadBooks();
    }
    return ok;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          My Books
        </ThemedText>

        <View style={styles.addRow}>
          <View style={styles.titleField}>
            <TextField placeholder="Book title" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.pagesField}>
            <TextField
              placeholder="Pages"
              value={totalPages}
              onChangeText={setTotalPages}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={styles.addButtons}>
          <View style={styles.flex}>
            <AppButton
              title="Add to reading"
              variant="secondary"
              onPress={() => addBook('reading')}
              disabled={!title.trim()}
            />
          </View>
          <View style={styles.flex}>
            <AppButton
              title="Save for later"
              variant="secondary"
              onPress={() => addBook('want')}
              disabled={!title.trim()}
            />
          </View>
        </View>

        <SectionHeader title="Currently Reading" count={reading.length} />
        {reading.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            Nothing in progress. Add a book above to start.
          </ThemedText>
        ) : (
          reading.map((book) => (
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

        {wantToRead.length > 0 && (
          <>
            <SectionHeader title="Want to Read" count={wantToRead.length} />
            {wantToRead.map((book) => (
              <View key={book.id} style={[styles.finishedRow, { borderColor: theme.border }]}>
                <Pressable
                  onPress={() => openLog(book.id)}
                  accessibilityRole="button"
                  accessibilityHint="Shows details for this book"
                  style={({ pressed }) => [styles.finishedTitle, styles.flex, pressed && styles.pressed]}>
                  <ThemedText type="serif" style={styles.rowTitle}>
                    {book.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {book.total_pages ? `${book.total_pages} pages  ›` : '›'}
                  </ThemedText>
                </Pressable>
                <AppButton title="Start" variant="text" onPress={() => startReading(book.id)} />
              </View>
            ))}
          </>
        )}

        {finished.length > 0 && (
          <>
            <SectionHeader title="Finished" count={finished.length} />
            {finished.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => openLog(book.id)}
                accessibilityRole="button"
                accessibilityHint="Shows your reading sessions for this book"
                style={({ pressed }) => [
                  styles.finishedRow,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="serif" style={[styles.finishedTitle, styles.rowTitle]}>
                  {book.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {book.total_pages ?? book.pages_read} pages  ›
                </ThemedText>
              </Pressable>
            ))}
          </>
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
        <TextField placeholder="Note (optional)" value={note} onChangeText={setNote} />
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

/** Bold section heading with a count, underlined in black, e.g. "Finished  3". */
function SectionHeader({ title, count }: { title: string; count: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionHeader, { borderColor: theme.border }]} accessibilityRole="header">
      <ThemedText type="serif" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {count}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 64 },
  title: { marginBottom: 24 },
  addRow: { flexDirection: 'row', gap: 8 },
  addButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  flex: { flex: 1 },
  titleField: { flex: 1 },
  pagesField: { width: 88 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 44,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  rowTitle: { fontSize: 17, lineHeight: 24 },
  finishedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  finishedTitle: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
