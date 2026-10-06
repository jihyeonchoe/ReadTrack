import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '../../lib/supabase';

type FeedItem = {
  id: string;
  minutes: number | null;
  pages: number | null;
  note: string | null;
  session_date: string;
  books: { title: string } | null;
  profiles: { username: string } | null;
};

export default function Feed() {
  const theme = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
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

    const followingIds = followData.map((f) => f.following_id);

    if (followingIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reading_sessions')
      .select('id, minutes, pages, note, session_date, books(title), profiles(username)')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50);

        if (error) {
      Alert.alert('Error loading feed', error.message);
      setLoading(false);
      return;
    }

    setItems(data as unknown as FeedItem[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <Screen centered>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Loading feed...
        </ThemedText>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen centered>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          No activity yet. Follow some readers on the People tab to see their sessions here!
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.title}>
        Feed
      </ThemedText>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText type="smallBold">{item.profiles?.username ?? 'Someone'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Read {item.books?.title ?? 'a book'} on {item.session_date}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.minutes ? `${item.minutes} min` : ''}
              {item.minutes && item.pages ? ' · ' : ''}
              {item.pages ? `${item.pages} pages` : ''}
            </ThemedText>
            {item.note ? <ThemedText style={styles.note}>"{item.note}"</ThemedText> : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16 },
  center: { textAlign: 'center' },
  row: { paddingVertical: 12, borderBottomWidth: 1, gap: 2 },
  note: { marginTop: 4 },
});
