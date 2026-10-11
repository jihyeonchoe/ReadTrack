import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { type Book } from '@/components/book-card';
import { NoteField } from '@/components/note-field';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { loadMyBooks } from '@/utils/books';
import { formatDay, formatDuration, localDateString } from '@/utils/reading';
import { saveSession } from '@/utils/sessions';
import { supabase } from '../../../../lib/supabase';

type DaySession = {
  id: string;
  book_id: string;
  minutes: number | null;
  pages: number | null;
  note: string | null;
  books: { title: string } | null;
};

/** Everything I read on one day (opened from the Stats calendar or weekly bars). */
export default function DayScreen() {
  const theme = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [sessions, setSessions] = useState<DaySession[]>([]);
  const [loaded, setLoaded] = useState(false);

  // "Log reading" sheet
  const [logging, setLogging] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<string | null>(null);
  const [minInput, setMinInput] = useState('');
  const [pageInput, setPageInput] = useState('');
  const [note, setNote] = useState('');
  const canLog = !!date && date <= localDateString(); // no logging in the future

  const load = useCallback(() => {
      (async () => {
        const { data: userData } = await supabase.auth.getUser();
        const me = userData.user?.id;
        if (!me || !date) return;
        const { data, error } = await supabase
          .from('reading_sessions')
          .select('id, book_id, minutes, pages, note, books(title)')
          .eq('user_id', me)
          .eq('session_date', date)
          .order('created_at', { ascending: true });
        if (error) Alert.alert('Error loading day', error.message);
        else setSessions(data as unknown as DaySession[]);
        setLoaded(true);
      })();
  }, [date]);

  useFocusEffect(load);

  async function openLog() {
    const { data } = await loadMyBooks();
    // Books you're reading first, then finished ones; Want to Read is left out.
    const usable = [
      ...data.filter((b) => b.status !== 'finished' && b.status !== 'want_to_read'),
      ...data.filter((b) => b.status === 'finished'),
    ];
    setBooks(usable);
    setBookId(usable[0]?.id ?? null);
    setMinInput('');
    setPageInput('');
    setNote('');
    setLogging(true);
  }

  async function saveLog() {
    const book = books.find((b) => b.id === bookId);
    if (!book || !date) return;
    const toInt = (v: string) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const ok = await saveSession(book, toInt(minInput), toInt(pageInput), note.trim() || null, date);
    if (ok) {
      setLogging(false);
      load();
    }
  }

  const minutes = sessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const pages = sessions.reduce((sum, s) => sum + (s.pages ?? 0), 0);

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">{date ? formatDay(date) : ''}</ThemedText>
        {canLog && (
          <View style={styles.logButton}>
            <AppButton title="+ Log reading" variant="secondary" onPress={openLog} />
          </View>
        )}

        <View style={[styles.summary, { borderColor: theme.border }]}>
          <Stat value={formatDuration(minutes)} label="reading" />
          <Stat value={String(sessions.length)} label={sessions.length === 1 ? 'session' : 'sessions'} />
          <Stat value={String(pages)} label="pages" />
        </View>

        {loaded && sessions.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No reading on this day.
          </ThemedText>
        ) : (
          sessions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push({ pathname: '/profile/book/[id]', params: { id: s.book_id } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && styles.pressed]}>
              <ThemedText type="serif" style={styles.title}>
                {s.books?.title ?? 'A book'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[s.minutes && formatDuration(s.minutes), s.pages && `${s.pages} pages`]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
              {s.note ? <ThemedText type="small">“{s.note}”</ThemedText> : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      <Sheet visible={logging} title={`Log reading · ${date ? formatDay(date) : ''}`} onClose={() => setLogging(false)}>
        {books.length === 0 ? (
          <ThemedText themeColor="textSecondary">Add a book on My Books first.</ThemedText>
        ) : (
          <ScrollView style={styles.picker} contentContainerStyle={styles.pickerContent}>
            {books.map((b) => {
              const on = b.id === bookId;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => setBookId(b.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[
                    styles.option,
                    { borderColor: on ? theme.text : theme.border },
                  ]}>
                  <ThemedText numberOfLines={1} style={on ? styles.optionOn : undefined}>
                    {b.title}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <TextField placeholder="Minutes read" value={minInput} onChangeText={setMinInput} keyboardType="number-pad" />
        <TextField placeholder="Pages read" value={pageInput} onChangeText={setPageInput} keyboardType="number-pad" />
        <NoteField value={note} onChangeText={setNote} />
        <AppButton title="Save" onPress={saveLog} disabled={!bookId} />
        <AppButton title="Cancel" variant="secondary" onPress={() => setLogging(false)} />
      </Sheet>
    </ThemedView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="number" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 64,
  },
  summary: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, lineHeight: 30 },
  empty: { marginTop: 32, textAlign: 'center' },
  row: { paddingVertical: 16, borderBottomWidth: 1, gap: 4 },
  title: { fontSize: 18, lineHeight: 24 },
  pressed: { opacity: 0.6 },
  logButton: { marginTop: 16, alignSelf: 'flex-start' },
  picker: { maxHeight: 180, flexGrow: 0 },
  pickerContent: { gap: 8 },
  option: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  optionOn: { fontWeight: '600' },
});
