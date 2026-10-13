import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { OverflowMenu } from '@/components/overflow-menu';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatDay, formatDuration } from '@/utils/reading';
import { loadFollowIds } from '@/utils/follows';
import { localDateString } from '@/utils/reading';
import { startOfWeek } from '@/utils/stats';
import { supabase } from '../../../lib/supabase';

type MySession = {
  id: string;
  book_id: string;
  session_date: string;
  minutes: number | null;
  pages: number | null;
  note: string | null;
  books: { title: string } | null;
};

/** Instagram-style profile: name, three counts, and my recent reading sessions. */
export default function Profile() {
  const theme = useTheme();
  const [myId, setMyId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [finished, setFinished] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [week, setWeek] = useState({ minutes: 0, pages: 0, sessions: 0 });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const me = userData.user?.id;
    if (!me) return;
    setMyId(me);

    const [profileRes, finishedRes, sessionRes, ids] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', me).single(),
      supabase
        .from('books')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', me)
        .eq('status', 'finished'),
      supabase
        .from('reading_sessions')
        .select('id, book_id, session_date, minutes, pages, note, books(title)')
        .eq('user_id', me)
        .order('created_at', { ascending: false })
        .limit(30),
      loadFollowIds(me),
    ]);

    if (profileRes.data) setUsername(profileRes.data.username);
    setFinished(finishedRes.count ?? 0);
    if (sessionRes.error) Alert.alert('Error loading sessions', sessionRes.error.message);
    else setSessions(sessionRes.data as unknown as MySession[]);
    setFollowers(ids.followers.length);
    // This week's totals (Monday to today) for the summary under the counts.
    const weekStart = localDateString(startOfWeek(new Date()));
    const { data: weekRows } = await supabase
      .from('reading_sessions')
      .select('minutes, pages')
      .eq('user_id', me)
      .gte('session_date', weekStart);
    setWeek({
      minutes: (weekRows ?? []).reduce((sum, r) => sum + (r.minutes ?? 0), 0),
      pages: (weekRows ?? []).reduce((sum, r) => sum + (r.pages ?? 0), 0),
      sessions: (weekRows ?? []).length,
    });
    setFollowing(ids.following.length);
  }

  async function saveName() {
    const name = nameInput.trim();
    if (!myId || !name) return;
    const { error } = await supabase.from('profiles').update({ username: name }).eq('id', myId);
    if (error) {
      Alert.alert('Error saving name', error.message);
      return;
    }
    setUsername(name);
    setSettingsOpen(false);
  }

  function openConnections(tab: 'followers' | 'following') {
    router.push({ pathname: '/profile/connections', params: { tab } });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar name={username} size={64} />
          <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
            {username || ' '}
          </ThemedText>
        </View>
        <OverflowMenu
          items={[
            {
              label: 'Settings',
              onPress: () => {
                setNameInput(username);
                setSettingsOpen(true);
              },
            },
            { label: 'Log out', onPress: () => supabase.auth.signOut() },
          ]}
        />
      </View>

      <View style={[styles.counts, { borderColor: theme.border }]}>
        <Count value={finished} label="books read" />
        <Count value={followers} label="followers" onPress={() => openConnections('followers')} />
        <Count value={following} label="following" onPress={() => openConnections('following')} />
      </View>

      <Pressable
        onPress={() => router.push('/profile/stats')}
        accessibilityRole="button"
        accessibilityHint="Opens your full reading stats"
        style={({ pressed }) => [styles.week, { borderColor: theme.border }, pressed && styles.pressed]}>
        <View style={styles.weekTop}>
          <ThemedText type="serif" style={styles.weekTitle}>
            Stats
          </ThemedText>
          <ThemedText type="label" themeColor="textSecondary">
            This week
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.chevron}>
            ›
          </ThemedText>
        </View>
        <View style={styles.weekNumbers}>
          <WeekStat value={formatDuration(week.minutes)} label="reading" />
          <WeekStat value={String(week.sessions)} label="sessions" />
          <WeekStat value={String(week.pages)} label="pages" />
        </View>
      </Pressable>

      <ThemedText type="label" themeColor="textSecondary" style={styles.sectionTitle}>
        Recent reading
      </ThemedText>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary">No reading sessions yet.</ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/profile/book/[id]', params: { id: item.book_id } })
            }
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && styles.pressed]}>
            <View style={styles.rowTop}>
              <ThemedText type="serif" style={styles.bookTitle} numberOfLines={1}>
                {item.books?.title ?? 'A book'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDay(item.session_date)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {[item.minutes && formatDuration(item.minutes), item.pages && `${item.pages} pages`]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            {item.note ? <ThemedText type="small">“{item.note}”</ThemedText> : null}
          </Pressable>
        )}
      />

      <Sheet visible={settingsOpen} title="Settings" onClose={() => setSettingsOpen(false)}>
        <ThemedText type="small" themeColor="textSecondary">
          Name
        </ThemedText>
        <TextField
          placeholder="Your name"
          value={nameInput}
          onChangeText={setNameInput}
          autoCapitalize="none"
        />
        <AppButton title="Save" onPress={saveName} disabled={!nameInput.trim()} />
        <AppButton title="Cancel" variant="secondary" onPress={() => setSettingsOpen(false)} />
      </Sheet>
    </Screen>
  );
}

function WeekStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.weekStat}>
      <ThemedText type="number" style={styles.weekValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Count({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [styles.count, pressed && styles.pressed]}>
      <ThemedText type="number">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, flexShrink: 1 },
  name: { flexShrink: 1, fontSize: 22, lineHeight: 30 },
  counts: {
    flexDirection: 'row',
    marginTop: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  count: { flex: 1, alignItems: 'center', gap: 2 },
  week: { paddingVertical: 20, borderBottomWidth: 1, gap: 14 },
  weekTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekTitle: { fontSize: 22, lineHeight: 28 },
  chevron: { marginLeft: 'auto' },
  weekNumbers: { flexDirection: 'row' },
  weekStat: { flex: 1, gap: 2 },
  weekValue: { fontSize: 20, lineHeight: 26 },
  sectionTitle: { marginTop: 32, marginBottom: 4 },
  list: { paddingBottom: 64 },
  row: { paddingVertical: 16, borderBottomWidth: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  bookTitle: { flexShrink: 1, fontSize: 17, lineHeight: 23 },
  pressed: { opacity: 0.6 },
});
