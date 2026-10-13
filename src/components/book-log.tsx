import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { type Book } from '@/components/book-card';
import { ProgressBar } from '@/components/progress-bar';
import { SessionEditor } from '@/components/session-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, formatDuration } from '@/utils/reading';
import { formatPageProgress, progressBySession } from '@/utils/sessions';
import { GENRES } from '@/utils/stats';
import { readersLabel, useReadersCount } from '@/hooks/use-readers-count';
import { supabase } from '../../lib/supabase';

type SessionRow = {
  id: string;
  book_id: string;
  session_date: string;
  minutes: number | null;
  pages: number | null;
  note: string | null;
  created_at: string;
};

/**
 * One book's reading log: progress, genre and every session grouped by day.
 * Other readers' books (opened from the feed) are shown read-only.
 */
export function BookLog({ id }: { id: string | undefined }) {
  const theme = useTheme();
  const [myId, setMyId] = useState<string | null>(null);
  const [book, setBook] = useState<
    | (Book & {
        created_at: string;
        author: string | null;
        cover_url: string | null;
        google_id: string | null;
        user_id: string;
      })
    | null
  >(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Session being edited (own books only)
  const [editing, setEditing] = useState<SessionRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id])
  );

  async function load() {
    if (!id) return;
    const { data: userData } = await supabase.auth.getUser();
    setMyId(userData.user?.id ?? null);
    const [bookRes, sessionRes] = await Promise.all([
      supabase
        .from('books')
        .select(
          'id, title, status, pages_read, total_pages, genre, created_at, author, cover_url, google_id, user_id'
        )
        .eq('id', id)
        .single(),
      supabase
        .from('reading_sessions')
        .select('id, book_id, session_date, minutes, pages, note, created_at')
        .eq('book_id', id)
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);
    if (bookRes.error) Alert.alert('Error loading book', bookRes.error.message);
    else setBook(bookRes.data);
    if (sessionRes.error) Alert.alert('Error loading sessions', sessionRes.error.message);
    else setSessions(sessionRes.data ?? []);
    setLoading(false);
  }

  async function startReading() {
    if (!book) return;
    const { error } = await supabase.from('books').update({ status: 'reading' }).eq('id', book.id);
    if (error) Alert.alert('Error updating book', error.message);
    else setBook({ ...book, status: 'reading' });
  }

  async function chooseGenre(g: string) {
    if (!book) return;
    const previous = book.genre;
    const next = g === previous ? null : g; // tap again to clear
    setBook({ ...book, genre: next });
    const { error } = await supabase.from('books').update({ genre: next }).eq('id', book.id);
    if (error) {
      Alert.alert('Error saving genre', error.message);
      setBook({ ...book, genre: previous });
    }
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const totalPages = sessions.reduce((sum, s) => sum + (s.pages ?? 0), 0);
  const reached = progressBySession(sessions);
  const percent =
    book?.total_pages ? Math.min(100, Math.round((book.pages_read / book.total_pages) * 100)) : null;

  // Group sessions by day (already sorted newest first).
  const days: { date: string; items: SessionRow[] }[] = [];
  for (const s of sessions) {
    const last = days[days.length - 1];
    if (last && last.date === s.session_date) last.items.push(s);
    else days.push({ date: s.session_date, items: [s] });
  }

  const wantToRead = book?.status === 'want_to_read';
  const isMine = book !== null && book.user_id === myId;
  const readers = useReadersCount(book?.google_id);

  if (!book) {
    return (
      <ThemedView style={styles.center}>
        {loading && <ActivityIndicator color={theme.text} />}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {book.status === 'finished'
            ? 'FINISHED'
            : book.status === 'want_to_read'
              ? 'WANT TO READ'
              : 'CURRENTLY READING'}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.title}>
          {book.title}
        </ThemedText>
        {book.author ? (
          <ThemedText themeColor="textSecondary" style={styles.author}>
            {book.author}
          </ThemedText>
        ) : null}
        {readers > 0 ? (
          <ThemedText type="small" style={styles.readers}>
            {readersLabel(readers)}
          </ThemedText>
        ) : null}

        {wantToRead && (
          <View style={styles.info}>
            <InfoRow label="Pages" value={book.total_pages ? String(book.total_pages) : 'Not set'} />
            <InfoRow label="Added" value={formatDay(book.created_at.slice(0, 10))} />
            {isMine && (
              <View style={styles.startButton}>
                <AppButton title="Start reading" onPress={startReading} />
              </View>
            )}
          </View>
        )}

        {!wantToRead && percent !== null && (
          <View style={styles.progress}>
            <View style={styles.rowTop}>
              <ThemedText type="smallBold">{percent}%</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatPageProgress(book.pages_read, book.total_pages)}
              </ThemedText>
            </View>
            <ProgressBar percent={percent} label={`${book.title}: ${percent}% read`} />
          </View>
        )}

        {isMine ? (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.genres}
            contentContainerStyle={styles.genreRow}
            accessibilityLabel="Genre">
            {GENRES.map((g) => {
              const on = g === book.genre;
              return (
                <Pressable
                  key={g}
                  onPress={() => chooseGenre(g)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[
                    styles.chip,
                    { borderColor: on ? theme.text : theme.border },
                    on && { backgroundColor: theme.text },
                  ]}>
                  <ThemedText type="small" style={{ color: on ? theme.background : theme.text }}>
                    {g}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : book.genre ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.genreText}>
            {book.genre}
          </ThemedText>
        ) : null}

        {!wantToRead && (
        <>
        <View style={[styles.summary, { borderColor: theme.border }]}>
          <Stat value={formatDuration(totalMinutes)} label="total reading" />
          <Stat value={String(sessions.length)} label={sessions.length === 1 ? 'session' : 'sessions'} />
          <Stat value={String(totalPages)} label="pages" />
        </View>

        {sessions.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No sessions logged for this book yet.
          </ThemedText>
        ) : (
          <View>
            {days.map((day) => {
              const dayMinutes = day.items.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
              const dayPages = day.items.reduce((sum, s) => sum + (s.pages ?? 0), 0);
              return (
                <View key={day.date} style={styles.day}>
                  <View style={styles.rowTop}>
                    <ThemedText type="smallBold">{formatDay(day.date)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDuration(dayMinutes)} · {dayPages} pages
                    </ThemedText>
                  </View>
                  {day.items.map((s) => {
                    return (
                      <Pressable
                        key={s.id}
                        disabled={!isMine}
                        onPress={() => setEditing(s)}
                        accessibilityRole={isMine ? 'button' : undefined}
                        accessibilityHint={isMine ? 'Edit or delete this session' : undefined}
                        style={({ pressed }) => [
                          styles.row,
                          { borderColor: theme.border },
                          pressed && styles.pressed,
                        ]}>
                        <View style={styles.rowTop}>
                          <ThemedText type="small">
                            {[
                              s.minutes && `${s.minutes} min`,
                              s.pages && formatPageProgress(reached[s.id].pages, book.total_pages),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </ThemedText>
                        </View>
                        {s.note ? (
                          <ThemedText type="small" themeColor="textSecondary">
                            “{s.note}”
                          </ThemedText>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
        </>
        )}
      </ScrollView>

      <SessionEditor session={editing} onClose={() => setEditing(null)} onChanged={load} />
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.infoRow, { borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  title: { marginTop: 6 },
  author: { marginTop: 4 },
  readers: { marginTop: 8 },
  genreText: { marginTop: 16 },
  progress: { gap: 8, marginTop: 20 },
  info: { marginTop: 24 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  startButton: { marginTop: 24, marginBottom: 8 },
  genres: { marginTop: 16, flexGrow: 0 },
  genreRow: { gap: 6 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    marginTop: 28,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, lineHeight: 26 },
  empty: { marginVertical: 32, textAlign: 'center' },
  day: { marginTop: 28 },
  row: { paddingVertical: 14, borderBottomWidth: 1, gap: 4 },
  pressed: { opacity: 0.6 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
