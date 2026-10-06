import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, formatDuration } from '@/utils/reading';
import { formatPageProgress, progressBySession, type Progress } from '@/utils/sessions';
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

/** Home screen: recent reading sessions from you and the readers you follow. */
export function ActivityFeed({ onSignOut }: { onSignOut: () => void }) {
  const theme = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  // session id → pages/minutes reached in that book after the session
  const [reached, setReached] = useState<Record<string, Progress>>({});
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
    setMyId(currentUserId);

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
      }
    }
    setLoading(false);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">ReadTrack</ThemedText>
        <Pressable onPress={onSignOut} accessibilityRole="button" hitSlop={12}>
          <ThemedText type="small" themeColor="textSecondary">
            Log out
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={items}
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
          const name = item.user_id === myId ? 'You' : (item.profiles?.username ?? 'Someone');
          return (
            <View style={[styles.card, { borderColor: theme.border }]}>
              <View style={styles.cardTop}>
                <ThemedText type="smallBold">{name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDay(item.session_date)}
                </ThemedText>
              </View>
              <ThemedText style={styles.bookTitle}>{item.books?.title ?? 'A book'}</ThemedText>

              <View style={styles.metrics}>
                <Metric label="Time" value={item.minutes ? `${item.minutes} min` : '–'} />
                <Metric
                  label="Pages"
                  value={
                    item.pages && r
                      ? formatPageProgress(r.pages, item.books?.total_pages)
                      : item.pages
                        ? `${item.pages} pages`
                        : '–'
                  }
                />
                <Metric label="Total reading" value={r?.minutes ? formatDuration(r.minutes) : '–'} />
              </View>

              {item.note ? (
                <ThemedText type="small" themeColor="textSecondary">
                  “{item.note}”
                </ThemedText>
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.metricValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listContent: { paddingBottom: 48, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 6, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  bookTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: 24, marginVertical: 4 },
  metric: { gap: 0 },
  metricValue: { fontSize: 16, lineHeight: 22 },
});
