import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/reading';
import {
  fastestBook,
  longestBook,
  mostBooksInMonth,
  readingPattern,
  booksByMonth,
  booksByYear,
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
import { supabase } from '../../../lib/supabase';

type Goals = { yearly_goal: number | null; weekly_goal_minutes: number | null };
type GoalKey = keyof Goals;

/** Full reading stats, opened from the Profile tab. */
export default function Stats() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('month');
  // 0 = this month/year, -1 = the one before, and so on.
  const [offset, setOffset] = useState(0);
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
      supabase
        .from('books')
        .select('id, title, status, total_pages, finished_at')
        .eq('user_id', me),
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

  function openDay(date: string) {
    router.push({ pathname: '/profile/day/[date]', params: { date } });
  }

  function openGoal(key: GoalKey) {
    setGoalInput(goals[key] ? String(goals[key]) : '');
    setEditing(key);
  }

  // ---- derived numbers ----
  const now = new Date();
  // The month or year being viewed.
  const ref =
    mode === 'month'
      ? new Date(now.getFullYear(), now.getMonth() + offset, 1)
      : new Date(now.getFullYear() + offset, 0, 1);
  const period = getPeriod(mode, ref);
  const finished = finishedDates(books, sessions);
  const current = summarize(sessions, finished, period.start, period.end);
  const previous = summarize(sessions, finished, period.prevStart, period.prevEnd);
  const { current: streak, longest } = streaks(sessions, now);
  const pr = records(sessions);
  const pattern = readingPattern(sessions);
  const bigBook = longestBook(books);
  const quickest = fastestBook(books, sessions);
  const mostInMonth = mostBooksInMonth(finished);
  const booksThisYear = finished.filter((d) => d.startsWith(String(now.getFullYear()))).length;
  const weekStart = localDateString(startOfWeek(now));
  const minutesThisWeek = sessions
    .filter((s) => s.session_date >= weekStart)
    .reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  return (
    <Screen style={{ paddingTop: 8 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.title}>
          Stats
        </ThemedText>

        <GroupTitle title="Overview" />
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

        <View style={[styles.toggle, { borderColor: theme.border }]}>
          <Segmented
            options={[
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setOffset(0);
            }}
          />
          <View style={styles.periodNav}>
            <Pressable
              onPress={() => setOffset((o) => o - 1)}
              accessibilityRole="button"
              accessibilityLabel={`Previous ${mode}`}
              hitSlop={12}
              style={styles.navButton}>
              <ThemedText type="serif" style={styles.navArrow}>
                ‹
              </ThemedText>
            </Pressable>
            <ThemedText type="serif" style={styles.periodLabel}>
              {period.label}
            </ThemedText>
            <Pressable
              onPress={() => setOffset((o) => Math.min(0, o + 1))}
              disabled={offset === 0}
              accessibilityRole="button"
              accessibilityLabel={`Next ${mode}`}
              hitSlop={12}
              style={[styles.navButton, offset === 0 && styles.navDisabled]}>
              <ThemedText type="serif" style={styles.navArrow}>
                ›
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Summary vs previous period */}
        <Section title="Summary" style={styles.noDivider}>
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

        <GroupTitle title="Trends" />
        {mode === 'month' ? (
          <>
            <Section title={ref.toLocaleDateString(undefined, { month: 'long' })}>
              <MonthCalendar
                readDays={minutesByDate(sessions)}
                now={ref}
                onPrev={() => setOffset((o) => o - 1)}
                onNext={offset < 0 ? () => setOffset((o) => o + 1) : undefined}
                onDayPress={openDay}
              />
            </Section>
            {offset === 0 && (
              <Section title="This week · minutes">
                <BarChart bars={weekBars(sessions, now)} onOpen={(b) => b.date && openDay(b.date)} />
              </Section>
            )}
          </>
        ) : (
          <>
            <Section title={`Minutes by month · ${ref.getFullYear()}`}>
              <BarChart bars={monthBars(sessions, ref)} />
            </Section>
            <Section title={`Books finished · ${ref.getFullYear()}`}>
              <BarChart bars={booksByMonth(finished, ref)} unit="books" unitOne="book" />
            </Section>
            <Section title="Books finished by year">
              <BarChart bars={booksByYear(finished, now)} unit="books" unitOne="book" />
            </Section>
          </>
        )}

        <GroupTitle title="Personal Records" />
        <Section title="All time">
          <RecordRow label="Most pages in one day" value={pr.mostPagesInDay ? String(pr.mostPagesInDay) : '–'} />
          <RecordRow
            label="Longest reading session"
            value={pr.longestSession ? formatDuration(pr.longestSession) : '–'}
          />
          <RecordRow label="Longest streak" value={longest ? `${longest} ${longest === 1 ? 'day' : 'days'}` : '–'} />
          <RecordRow label="Most books in a month" value={mostInMonth ? String(mostInMonth) : '–'} />
          <RecordRow
            label="Fastest 300-page book"
            value={quickest ? `${quickest.days} ${quickest.days === 1 ? 'day' : 'days'}` : '–'}
            detail={quickest?.book.title}
          />
          <RecordRow
            label="Longest book"
            value={bigBook ? `${bigBook.total_pages} pages` : '–'}
            detail={bigBook?.title}
          />
        </Section>
        <GroupTitle title="Insights" />
        <Section title="My reading pattern">
          <PatternLine
            label="You read most in the"
            value={pattern.bestTime ? pattern.bestTime.toLowerCase() : '–'}
          />
          <PatternLine label="Your best day is" value={pattern.bestDay ?? '–'} />
          <PatternLine
            label="An average session is"
            value={pattern.averageSession ? formatDuration(pattern.averageSession) : '–'}
          />
        </Section>

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

/** Big heading that starts one of the four stats groups. */
function GroupTitle({ title }: { title: string }) {
  return (
    <ThemedText type="subtitle" style={styles.groupTitle} accessibilityRole="header">
      {title}
    </ThemedText>
  );
}

function PatternLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.patternLine}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="serif" style={styles.patternValue}>
        {value}
      </ThemedText>
    </View>
  );
}

/** One personal record: label on the left, value on the right, optional book title below. */
function RecordRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.recordRow, { borderColor: theme.border }]}>
      <View style={styles.recordText}>
        <ThemedText>{label}</ThemedText>
        {detail ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.recordDetail}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="number" style={styles.recordValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function Tile({ value, label, change, big }: { value: string; label: string; change?: string; big?: boolean }) {
  return (
    <View style={styles.tile}>
      <ThemedText type="number" style={big ? styles.tileBig : styles.tileValue}>
        {value}
      </ThemedText>
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
  content: { paddingBottom: 64 },
  title: { marginBottom: 24 },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  // The divider sits above the Month | Year switch, which starts the period section.
  toggle: { borderTopWidth: 1, paddingTop: 20, marginBottom: 8 },
  noDivider: { borderTopWidth: 0, paddingTop: 12 },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  navDisabled: { opacity: 0.25 },
  navArrow: { fontSize: 28, lineHeight: 32 },
  periodLabel: { fontSize: 20, lineHeight: 26 },
  groupTitle: { fontSize: 26, lineHeight: 32, marginTop: 32, marginBottom: 16 },
  patternLine: { gap: 2 },
  patternValue: { fontSize: 22, lineHeight: 28 },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recordText: { flex: 1 },
  recordDetail: {},
  recordValue: { fontSize: 20, lineHeight: 26 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 },
  tile: { width: '50%', paddingRight: 8, gap: 2 },
  tileValue: { fontSize: 28, lineHeight: 34 },
  tileBig: { fontSize: 44, lineHeight: 50 },
  change: { fontSize: 12, lineHeight: 16 },
});
