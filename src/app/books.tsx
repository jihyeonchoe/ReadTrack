import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '../../lib/supabase';

type Book = {
  id: string;
  title: string;
  status: string;
  pages_read: number;
};

export default function Books() {
  const theme = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');

  async function loadBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, status, pages_read')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error loading books', error.message);
    else setBooks(data);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  async function addBook() {
    if (!title.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('books')
      .insert({ title, user_id: userData.user?.id });
    if (error) Alert.alert('Error adding book', error.message);
    else {
      setTitle('');
      loadBooks();
    }
  }

  async function markFinished(id: string) {
    const { error } = await supabase
      .from('books')
      .update({ status: 'finished' })
      .eq('id', id);
    if (error) Alert.alert('Error updating book', error.message);
    else loadBooks();
  }

  function openSessionModal(bookId: string) {
    setActiveBookId(bookId);
    setMinutes('');
    setPages('');
    setNote('');
    setModalVisible(true);
  }

  async function saveSession() {
    if (!activeBookId) return;
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('reading_sessions').insert({
      user_id: userData.user?.id,
      book_id: activeBookId,
      minutes: minutes ? parseInt(minutes, 10) : null,
      pages: pages ? parseInt(pages, 10) : null,
      note: note || null,
    });

    if (error) {
      Alert.alert('Error saving session', error.message);
      return;
    }

    if (pages) {
      const book = books.find((b) => b.id === activeBookId);
      if (book) {
        await supabase
          .from('books')
          .update({ pages_read: book.pages_read + parseInt(pages, 10) })
          .eq('id', activeBookId);
      }
    }

    setModalVisible(false);
    loadBooks();
  }

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.title}>
        My Books
      </ThemedText>

      <View style={styles.addRow}>
        <View style={styles.flex}>
          <TextField placeholder="Book title" value={title} onChangeText={setTitle} />
        </View>
        <AppButton title="Add" onPress={addBook} />
      </View>

      <FlatList
        style={styles.list}
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText style={styles.bookTitle}>{item.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.status === 'finished' ? 'Finished' : 'Reading'} · {item.pages_read} pages read
            </ThemedText>
            <View style={styles.actions}>
              <AppButton title="Log a session" onPress={() => openSessionModal(item.id)} />
              {item.status !== 'finished' && (
                <AppButton
                  title="Mark as finished"
                  variant="secondary"
                  onPress={() => markFinished(item.id)}
                />
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <ThemedView style={styles.sheet}>
            <ThemedText type="smallBold" style={styles.sheetTitle}>
              Log a reading session
            </ThemedText>

            <View style={styles.fields}>
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
            </View>

            <View style={styles.fields}>
              <AppButton title="Save session" onPress={saveSession} />
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16 },
  flex: { flex: 1 },
  addRow: { flexDirection: 'row', gap: 8 },
  list: { marginTop: 16 },
  row: { paddingVertical: 16, borderBottomWidth: 1, gap: 4 },
  bookTitle: { fontSize: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  sheet: { padding: 24, borderRadius: 12, width: '100%', maxWidth: 480, alignSelf: 'center' },
  sheetTitle: { fontSize: 20, lineHeight: 28 },
  fields: { gap: 12, marginTop: 16 },
});
