import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { BarChart } from '@/components/stats/bar-chart';
import { GoalCard } from '@/components/stats/goal-card';
import { MonthCalendar } from '@/components/stats/month-calendar';
import { Section } from '@/components/stats/section';
import { Segmented } from '@/components/stats/segmented';
import { ShareBars } from '@/components/stats/share-bars';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { formatDuration } from '@/utils/reading';
import {
  finishedDates,
  genreShares,
  getPeriod,
  minutesByDate,
  monthBars,
  records,
  startOfWeek,
  streaks,
  summarize,
  timeOfDay,
  weekBars,
  weekElapsed,
  yearElapsed,
  type Mode,
  type StatBook,
  type StatSession,
  type Summary,
} from '@/utils/stats';
import { localDateString } from '@/utils/reading';
import { supabase } from '../../lib/supabase';

type Goals = { yearly_goal: number | null; weekly_goal_minutes: number | null };
type GoalKey = keyof Goals;

export default function Stats() {
  const [mode, setMode] = useState<Mode>('month');
  const [sessions, setSessions] = useState<StatSession[]>([]);
  const [books, setBooks] = useState<StatBook[]>([]);
  const [goals, setGoals] = useState<Goals>({ yearly_goal: null, weekly_goal_minutes: null });
  const [userId, setUserId] = useState<string | null>(null);

  const [editing, setEditing] = useState<GoalKey | null>(null);
  const [goalInput, setGoalInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const me = userData.user?.id;
    if (!me) return;
    setUserId(me);

    // Only *my* data — other readers' sessions are visible for the feed.
    const [sessionRes, bookRes, profileRes] = await Promise.all([
      supabase
        .from('reading_sessions')
        .select('id, book_id, session_date, minutes, pages, created_at, books(genre)')
        .eq('user_id', me),
      supabase.from('books').select('id, status, finished_at').eq('user_id', me),
      supabase.from('profiles').select('yearly_goal, weekly_goal_minutes').eq('id', me).single(),
    ]);

    if (sessionRes.error) Alert.alert('Error loading sessions', sessionRes.error.message);
    else setSessions(sessionRes.data as unknown as StatSession[]);
    if (bookRes.error) Alert.alert('Error loading books', bookRes.error.message);
    else setBooks(bookRes.data);
    if (profileRes.error) Alert.alert('Error loading goals', profileRes.error.message);
    else setGoals(profileRes.data);
  }

  async function saveGoal() {
    if (!editing || !userId) return;
    const n = parseInt(goalInput, 10);
    const value = Number.isFinite(n) && n > 0 ? n : null; // empty = remove goal
    const { error } = await supabase.from('profiles').update({ [editing]: value }).eq('id', userId);
    if (error) {
      Alert.alert('Error saving goal', error.message);
      return;
    }
    setGoals((g) => ({ ...g, [editing]: value }));
    setEditing(null);
  }

  function openGoal(key: GoalKey) {
    setGoalInput(goals[key] ? String(goals[key]) : '');
    setEditing(key);
  }

  // ---- derived numbers ----
  const now = new Date();
  const period = getPeriod(mode, now);
  const finished = finishedDates(books, sessions);
  const current = summarize(sessions, finished, period.start, period.end);
  const previous = summarize(sessions, finished, period.prevStart, period.prevEnd);
  const { current: streak, longest } = streaks(sessions, now);
  const pr = records(sessions);
  const booksThisYear = finished.filter((d) => d.startsWith(String(now.getFullYear()))).length;
  const weekStart = localDateString(startOfWeek(now));
  const minutesThisWeek = sessions
    .filter((s) => s.session_date >= weekStart)
    .reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.title}>
          Stats
        </ThemedText>

        {/* Goals */}
        <View style={styles.goals}>
          <GoalCard
            title={`${now.getFullYear()} goal`}
            done={booksThisYear}
            goal={goals.yearly_goal}
            unit="books"
            elapsed={yearElapsed(now)}
            onEdit={() => openGoal('yearly_goal')}
          />
          <GoalCard
            title="This week"
            done={minutesThisWeek}
            goal={goals.weekly_goal_minutes}
            unit="min"
            elapsed={weekElapsed(now)}
            onEdit={() => openGoal('weekly_goal_minutes')}
          />
        </View>

        {/* Streak */}
        <Section title="Streak">
          <View style={styles.tiles}>
            <Tile value={`${streak} 🔥`} label={streak === 1 ? 'day in a row' : 'days in a row'} big />
            <Tile value={String(longest)} label="longest streak" />
          </View>
        </Section>

        <View style={styles.toggle}>
          <Segmented
            options={[
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>

        {/* Summary vs previous period */}
        <Section title={period.label}>
          <View style={styles.tiles}>
            {(
              [
                ['minutes', 'minutes'],
                ['pages', 'pages'],
                ['sessions', 'sessions'],
                ['days', 'days read'],
                ['books', 'books finished'],
              ] as [keyof Summary, string][]
            ).map(([key, label]) => (
              <Tile
                key={key}
                value={String(current[key])}
                label={label}
                change={changeText(current[key], previous[key], period.prevLabel)}
              />
            ))}
          </View>
        </Section>

        {mode === 'month' ? (
          <>
            <Section title="Calendar">
              <MonthCalendar readDays={minutesByDate(sessions)} now={now} />
            </Section>
            <Section title="This week · minutes">
              <BarChart bars={weekBars(sessions, now)} />
            </Section>
          </>
        ) : (
          <Section title="Minutes by month">
            <BarChart bars={monthBars(sessions, now)} />
          </Section>
        )}

        <Section title="When you read">
          <ShareBars
            shares={timeOfDay(sessions, period.start, period.end)}
            empty="Record timed sessions to see when you read most."
          />
        </Section>

        <Section title="Genres">
          <ShareBars
            shares={genreShares(sessions, period.start, period.end)}
            empty="No reading time yet. Set a book's genre from its reading log."
          />
        </Section>

        <Section title="Personal records">
          <View style={styles.tiles}>
            <Tile value={pr.longestSession ? formatDuration(pr.longestSession) : '–'} label="longest session" />
            <Tile value={pr.mostMinutesInDay ? formatDuration(pr.mostMinutesInDay) : '–'} label="most time in a day" />
            <Tile value={pr.mostPagesInDay ? String(pr.mostPagesInDay) : '–'} label="most pages in a day" />
          </View>
        </Section>
      </ScrollView>

      <Sheet
        visible={editing !== null}
        title={
          editing === 'yearly_goal'
            ? `How many books in ${now.getFullYear()}?`
            : 'Minutes to read each week?'
        }
        onClose={() => setEditing(null)}>
        <TextField
          placeholder={editing === 'yearly_goal' ? 'e.g. 12' : 'e.g. 150'}
          value={goalInput}
          onChangeText={setGoalInput}
          keyboardType="number-pad"
          autoFocus
        />
        <ThemedText type="small" themeColor="textSecondary">
          Leave empty to remove the goal.
        </ThemedText>
        <AppButton title="Save goal" onPress={saveGoal} />
        <AppButton title="Cancel" variant="secondary" onPress={() => setEditing(null)} />
      </Sheet>
    </Screen>
  );
}

/** "+40 vs last month", "−3 vs last month", or "same as last month". */
function changeText(now: number, before: number, prevLabel: string) {
  const d = now - before;
  if (d === 0) return `same as ${prevLabel}`;
  return `${d > 0 ? '+' : '−'}${Math.abs(d)} vs ${prevLabel}`;
}

function Tile({ value, label, change, big }: { value: string; label: string; change?: string; big?: boolean }) {
  return (
    <View style={styles.tile}>
      <ThemedText style={big ? styles.tileBig : styles.tileValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {change ? (
        <ThemedText type="small" style={styles.change}>
          {change}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  title: { marginBottom: 16 },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  toggle: { marginVertical: 12 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  tile: { width: '50%', paddingRight: 8 },
  tileValue: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  tileBig: { fontSize: 36, lineHeight: 42, fontWeight: '800' },
  change: { fontSize: 12, lineHeight: 16 },
});
