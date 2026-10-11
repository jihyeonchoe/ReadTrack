import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { searchBooks, type FoundBook } from '@/utils/book-search';

type CoverPickerProps = {
  visible: boolean;
  initialQuery: string;
  onPick: (book: FoundBook) => void;
  onClose: () => void;
};

/** Sheet that searches Google Books and lets you pick a cover for an existing book. */
export function CoverPicker({ visible, initialQuery, onPick, onClose }: CoverPickerProps) {
  const theme = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<FoundBook[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) setQuery(initialQuery);
  }, [visible, initialQuery]);

  useEffect(() => {
    const q = query.trim();
    if (!visible || q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchBooks(q, controller.signal);
        setResults(found.filter((b) => b.cover)); // only results that have a cover
      } catch {
        // ignore — the empty state below covers it
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, visible]);

  return (
    <Sheet visible={visible} title="Find cover" onClose={onClose}>
      <TextField
        placeholder="Search by title or author"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <ScrollView style={styles.list}>
        {results.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.status}>
            {searching ? 'Searching…' : 'No covers found. Try the author’s name too.'}
          </ThemedText>
        ) : (
          results.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => onPick(b)}
              accessibilityRole="button"
              accessibilityLabel={`Use cover of ${b.title}`}
              style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && styles.pressed]}>
              <Image
                source={b.cover!}
                style={[styles.thumb, { backgroundColor: theme.backgroundElement }]}
                contentFit="cover"
              />
              <View style={styles.text}>
                <ThemedText numberOfLines={2}>{b.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {b.author ?? ''}
                </ThemedText>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
      <AppButton title="Cancel" variant="secondary" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 420 },
  status: { paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pressed: { opacity: 0.6 },
  thumb: { width: 44, height: 66, borderRadius: 3 },
  text: { flex: 1, gap: 2 },
});
