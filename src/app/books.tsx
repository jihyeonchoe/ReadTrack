import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, Modal, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Book = {
  id: string;
  title: string;
  status: string;
  pages_read: number;
};

export default function Books() {
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
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 28, marginBottom: 16 }}>My Books</Text>

      <TextInput
        placeholder="Book title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 12, marginBottom: 8 }}
      />
      <Button title="Add book" onPress={addBook} />

      <FlatList
        style={{ marginTop: 24 }}
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: '#ddd',
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.title}</Text>
            <Text style={{ color: '#666' }}>
              Status: {item.status} · Pages read: {item.pages_read}
            </Text>
            <Button title="Log a session" onPress={() => openSessionModal(item.id)} />
            {item.status !== 'finished' && (
              <Button title="Mark as finished" onPress={() => markFinished(item.id)} />
            )}
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 8 }}>
            <Text style={{ fontSize: 20, marginBottom: 16 }}>Log a reading session</Text>

            <TextInput
              placeholder="Minutes read"
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              style={{ borderWidth: 1, padding: 12, marginBottom: 8 }}
            />
            <TextInput
              placeholder="Pages read"
              value={pages}
              onChangeText={setPages}
              keyboardType="number-pad"
              style={{ borderWidth: 1, padding: 12, marginBottom: 8 }}
            />
            <TextInput
              placeholder="Note (optional)"
              value={note}
              onChangeText={setNote}
              style={{ borderWidth: 1, padding: 12, marginBottom: 16 }}
            />

            <Button title="Save session" onPress={saveSession} />
            <View style={{ height: 8 }} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
}