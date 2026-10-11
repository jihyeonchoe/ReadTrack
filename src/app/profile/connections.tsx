import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/stats/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { follow, loadFollowIds, unfollow, type Profile } from '@/utils/follows';
import { supabase } from '../../../lib/supabase';

type Tab = 'followers' | 'following';

/** Followers / Following lists, with a search box at the top to find and follow readers. */
export default function Connections() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'following' ? 'following' : 'followers');
  const [myId, setMyId] = useState<string | null>(null);
  const [ids, setIds] = useState<{ followers: string[]; following: string[] }>({
    followers: [],
    following: [],
  });
  const [people, setPeople] = useState<Profile[]>([]);
  const [query, setQuery] = useState('');

  const loadIds = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const me = data.user?.id;
    if (!me) return;
    setMyId(me);
    setIds(await loadFollowIds(me));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIds();
    }, [loadIds])
  );

  // Who to show: search results while typing, otherwise the selected list.
  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    async function run() {
      if (!myId) return;
      if (q) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', `%${q}%`)
          .neq('id', myId)
          .limit(20);
        if (!cancelled) setPeople(data ?? []);
        return;
      }
      const list = ids[tab];
      if (list.length === 0) {
        setPeople([]);
        return;
      }
      const { data } = await supabase.from('profiles').select('id, username').in('id', list);
      if (!cancelled) setPeople(data ?? []);
    }
    const timer = setTimeout(run, q ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tab, ids, myId]);

  async function toggle(person: Profile) {
    if (!myId) return;
    const isFollowing = ids.following.includes(person.id);
    const ok = isFollowing ? await unfollow(myId, person.id) : await follow(myId, person.id);
    if (ok) loadIds();
  }

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.column}>
        <TextField
          placeholder="Search readers"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!query.trim() && (
          <View style={styles.tabs}>
            <Segmented
              options={[
                { value: 'followers', label: `Followers ${ids.followers.length}` },
                { value: 'following', label: `Following ${ids.following.length}` },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>
        )}

        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {query.trim()
                ? 'No readers found.'
                : tab === 'followers'
                  ? 'No followers yet.'
                  : 'You’re not following anyone yet. Search above to find readers.'}
            </ThemedText>
          }
          renderItem={({ item }) => {
            const isFollowing = ids.following.includes(item.id);
            return (
              <View style={[styles.row, { borderColor: theme.border }]}>
                <View style={styles.person}>
                  <Avatar name={item.username} />
                  <ThemedText style={styles.name} numberOfLines={1}>
                    {item.username}
                  </ThemedText>
                </View>
                <AppButton
                  title={isFollowing ? 'Following' : 'Follow'}
                  variant={isFollowing ? 'secondary' : 'primary'}
                  onPress={() => toggle(item)}
                />
              </View>
            );
          }}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  tabs: { marginTop: 16 },
  list: { paddingTop: 8, paddingBottom: 64 },
  empty: { marginTop: 32, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  name: { flexShrink: 1 },
});
