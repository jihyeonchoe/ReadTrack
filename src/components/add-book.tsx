import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { searchBooks, type FoundBook } from '@/utils/book-search';

export type NewBook = {
  title: string;
  author: string | null;
  total_pages: number | null;
  cover_url: string | null;
  google_id: string | null;
};

type AddBookProps = {
  onAdd: (book: NewBook, list: 'reading' | 'want') => Promise<boolean>;
};

function toPositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Search Google Books by title or author, pick a result (title, author, pages and cover are
 * filled in), then add it to Reading or Want to Read. You can also add a book without searching.
 */
export function AddBook({ onAdd }: AddBookProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<FoundBook | null>(null);
  const [pagesInput, setPagesInput] = useState('');

  // Search 400ms after the user stops typing.
  useEffect(() => {
    const q = query.trim();
    if (picked || q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setFailed(false);
      try {
        setResults(await searchBooks(q, controller.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setFailed(true);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, picked]);

  function pick(book: FoundBook) {
    setPicked(book);
    setPagesInput(book.pages ? String(book.pages) : '');
  }

  function pickTyped() {
    pick({ id: 'typed', title: query.trim(), author: null, pages: null, cover: null });
  }

  function reset() {
    setPicked(null);
    setQuery('');
    setResults([]);
    setPagesInput('');
  }

  async function add(list: 'reading' | 'want') {
    if (!picked) return;
    const ok = await onAdd(
      {
        title: picked.title,
        author: picked.author,
        total_pages: toPositiveInt(pagesInput),
        cover_url: picked.cover,
        google_id: picked.id === 'typed' ? null : picked.id,
      },
      list
    );
    if (ok) reset();
  }

  if (picked) {
    return (
      <View style={[styles.picked, { borderColor: theme.border }]}>
        <View style={styles.pickedTop}>
          <View style={styles.flex}>
            <ThemedText type="serif">{picked.title}</ThemedText>
            {picked.author ? (
              <ThemedText type="small" themeColor="textSecondary">
                {picked.author}
              </ThemedText>
            ) : null}
          </View>
          <AppButton title="Change" variant="text" onPress={reset} />
        </View>
        <TextField
          placeholder="Total pages"
          value={pagesInput}
          onChangeText={setPagesInput}
          keyboardType="number-pad"
        />
        <View style={styles.buttons}>
          <View style={styles.flex}>
            <AppButton title="Add to reading" onPress={() => add('reading')} />
          </View>
          <View style={styles.flex}>
            <AppButton title="Save for later" variant="secondary" onPress={() => add('want')} />
          </View>
        </View>
      </View>
    );
  }

  const q = query.trim();
  return (
    <View>
      <TextField
        placeholder="Search books by title or author"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
      />

      {q.length >= 2 && (
        <View style={styles.results}>
          {searching && results.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.status}>
              Searching…
            </ThemedText>
          ) : null}
          {failed ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.status}>
              Couldn’t search right now.
            </ThemedText>
          ) : null}

          {results.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => pick(book)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.result,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <ThemedText numberOfLines={2}>{book.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {[book.author, book.pages && `${book.pages} pages`].filter(Boolean).join(' · ')}
              </ThemedText>
            </Pressable>
          ))}

          <AppButton title={`Add “${q}” without search`} variant="text" onPress={pickTyped} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  results: { marginTop: 4 },
  status: { paddingVertical: 12 },
  result: { paddingVertical: 12, borderBottomWidth: 1, gap: 2 },
  pressed: { opacity: 0.6 },
  picked: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  pickedTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  buttons: { flexDirection: 'row', gap: 8 },
});
