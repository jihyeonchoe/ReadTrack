import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, Text, TextInput, View } from 'react-native';
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
            <Text style={{ color: '#666' }}>Status: {item.status}</Text>
            {item.status !== 'finished' && (
              <Button title="Mark as finished" onPress={() => markFinished(item.id)} />
            )}
          </View>
        )}
      />
    </View>
  );
}