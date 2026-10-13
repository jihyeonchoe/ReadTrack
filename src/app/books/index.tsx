import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AddBook, type NewBook } from '@/components/add-book';
import { type Book } from '@/components/book-card';
import { BookRow } from '@/components/book-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { loadMyBooks, shelfOf, SHELF_TITLES, type Shelf } from '@/utils/books';
import { supabase } from '../../../lib/supabase';

const PREVIEW = 3;
const SHELVES: Shelf[] = ['reading', 'want', 'finished'];

/** My Books: search to add, then three shelves showing the 3 most recent books each. */
export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);

  async function load() {
    const { data, error } = await loadMyBooks();
    if (error) Alert.alert('Error loading books', error.message);
    else setBooks(data);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function addBook(book: NewBook, list: 'reading' | 'want') {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('books').insert({
      ...book,
      user_id: userData.user?.id,
      ...(list === 'want' ? { status: 'want_to_read' } : {}),
    });
    if (error) {
      Alert.alert('Error adding book', error.message);
      return false;
    }
    load();
    return true;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          My Books
        </ThemedText>

        <AddBook onAdd={addBook} />

        {SHELVES.map((shelf) => {
          const list = books.filter((b) => shelfOf(b) === shelf);
          return (
            <View key={shelf}>
              <ShelfHeader
                title={SHELF_TITLES[shelf]}
                count={list.length}
                onSeeAll={
                  list.length > PREVIEW
                    ? () => router.push({ pathname: '/books/shelf', params: { shelf } })
                    : undefined
                }
              />
              {list.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                  No books yet.
                </ThemedText>
              ) : (
                list
                  .slice(0, PREVIEW)
                  .map((book) => (
                    <BookRow
                      key={book.id}
                      book={book}
                      onPress={() => router.push({ pathname: '/books/[id]', params: { id: book.id } })}
                    />
                  ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

/** Serif shelf title with its count, and "See all" on the right when there are more books. */
function ShelfHeader({ title, count, onSeeAll }: { title: string; count: number; onSeeAll?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderColor: theme.text }]} accessibilityRole="header">
      <View style={styles.headerLeft}>
        <ThemedText type="label">{title}</ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          {count}
        </ThemedText>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} accessibilityRole="button" hitSlop={12}>
          <ThemedText type="label" themeColor="textSecondary">
            See all
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 64 },
  title: { marginBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: { paddingVertical: 16 },
});
