import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, formatDuration } from '@/utils/reading';
import { progressBySession, type Progress } from '@/utils/sessions';
import { supabase } from '../../lib/supabase';

type FeedItem = {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  minutes: number | null;
  pages: number | null;
  note: string | null;
  session_date: string;
  books: { title: string; total_pages: number | null } | null;
  profiles: { username: string } | null;
};

/**
 * Home screen: books you and the readers you follow have been reading — one card per book,
 * showing totals so far. Tap a card to see every session.
 */
export function ActivityFeed() {
  const theme = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  // session id → pages/minutes reached in that book after the session
  const [reached, setReached] = useState<Record<string, Progress>>({});
  // book id → total number of sessions logged for it
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  async function loadFeed() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const { data: followData, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);
    if (followError) {
      Alert.alert('Error loading follows', followError.message);
      setLoading(false);
      return;
    }

    const userIds = [currentUserId, ...followData.map((f) => f.following_id)];

    const { data, error } = await supabase
      .from('reading_sessions')
      .select(
        'id, user_id, book_id, created_at, minutes, pages, note, session_date, books(title, total_pages), profiles(username)'
      )
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      Alert.alert('Error loading feed', error.message);
    } else {
      const feed = data as unknown as FeedItem[];
      setItems(feed);
      // Load every session of these books to work out running totals at each one.
      const bookIds = [...new Set(feed.map((f) => f.book_id))];
      if (bookIds.length > 0) {
        const { data: all } = await supabase
          .from('reading_sessions')
          .select('id, book_id, pages, minutes, session_date, created_at')
          .in('book_id', bookIds);
        setReached(progressBySession(all ?? []));
        const counts: Record<string, number> = {};
        for (const s of all ?? []) counts[s.book_id] = (counts[s.book_id] ?? 0) + 1;
        setSessionCounts(counts);
      }
    }
    setLoading(false);
  }

  // One card per book: keep each book's most recent session (items are newest first).
  const groups: FeedItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.book_id)) continue;
    seen.add(item.book_id);
    groups.push(item);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">ReadTrack</ThemedText>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadFeed}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? null : (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No activity yet. Start a reading session on My Books, or follow readers on the People
              tab.
            </ThemedText>
          )
        }
        renderItem={({ item }) => {
          const r = reached[item.id];
          const name = item.profiles?.username ?? 'Someone';
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.book_id } })}
              accessibilityRole="button"
              accessibilityHint="Opens this book"
              style={({ pressed }) => [
                styles.card,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={styles.cardTop}>
                <Avatar name={name} />
                <View style={styles.who}>
                  <ThemedText type="smallBold">{name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDay(item.session_date)}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="serif" style={styles.bookTitle}>
                {item.books?.title ?? 'A book'}
              </ThemedText>

              <View style={styles.metrics}>
                <Metric
                  label="Total reading"
                  value={r?.minutes ? formatDuration(r.minutes) : '–'}
                />
                <Metric
                  label="Pages"
                  value={
                    r?.pages
                      ? item.books?.total_pages
                        ? `${r.pages}/${item.books.total_pages}`
                        : String(r.pages)
                      : '–'
                  }
                />
                <Metric label="Sessions" value={String(sessionCounts[item.book_id] ?? 1)} />
              </View>

              {item.note ? (
                <ThemedText type="small" themeColor="textSecondary">
                  “{item.note}”
                </ThemedText>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="number" style={styles.metricValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listContent: { paddingBottom: 48, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
  pressed: { opacity: 0.6 },
  card: { borderBottomWidth: 1, paddingVertical: 24, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  who: { flex: 1 },
  bookTitle: { fontSize: 22, lineHeight: 29 },
  metrics: { flexDirection: 'row', gap: 28, marginTop: 10 },
  metric: { gap: 2 },
  metricValue: { fontSize: 26, lineHeight: 32 },
  metricLabel: { fontSize: 12, lineHeight: 16 },
});
