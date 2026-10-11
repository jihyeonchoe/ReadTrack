import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, StyleSheet } from 'react-native';

import { type Book } from '@/components/book-card';
import { BookRow } from '@/components/book-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { loadMyBooks, shelfOf, SHELF_TITLES, type Shelf } from '@/utils/books';

/** Full list for one shelf (Currently Reading / Want to Read / Finished). */
export default function ShelfScreen() {
  const params = useLocalSearchParams<{ shelf?: Shelf }>();
  const shelf: Shelf = params.shelf === 'want' || params.shelf === 'finished' ? params.shelf : 'reading';
  const [books, setBooks] = useState<Book[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMyBooks().then(({ data, error }) => {
        if (error) Alert.alert('Error loading books', error.message);
        else setBooks(data.filter((b) => shelfOf(b) === shelf));
      });
    }, [shelf])
  );

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.title}>
            {SHELF_TITLES[shelf]}
          </ThemedText>
        }
        renderItem={({ item }) => (
          <BookRow
            book={item}
            onPress={() => router.push({ pathname: '/books/[id]', params: { id: item.id } })}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 64,
  },
  title: { marginBottom: 16 },
});
