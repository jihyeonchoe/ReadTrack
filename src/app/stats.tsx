import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '../../lib/supabase';

type Session = {
  session_date: string;
  minutes: number | null;
  pages: number | null;
};

export default function Stats() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestPages, setBestPages] = useState(0);
  const [bestMinutes, setBestMinutes] = useState(0);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('session_date, minutes, pages')
      .order('session_date', { ascending: false });

    if (error || !data) return;
    setSessions(data);
    calculateStreak(data);
    calculatePRs(data);
  }

  function calculateStreak(data: Session[]) {
    const uniqueDates = Array.from(new Set(data.map((s) => s.session_date))).sort(
      (a, b) => (a < b ? 1 : -1)
    );

    if (uniqueDates.length === 0) {
      setStreak(0);
      return;
    }

    let count = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const dateStr of uniqueDates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (cursor.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (diffDays === 1) {
        count++;
        cursor = sessionDate;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(count);
  }

  function calculatePRs(data: Session[]) {
    // Group by date, sum pages/minutes per day, then find the best day
    const byDate: Record<string, { pages: number; minutes: number }> = {};

    for (const s of data) {
      if (!byDate[s.session_date]) byDate[s.session_date] = { pages: 0, minutes: 0 };
      byDate[s.session_date].pages += s.pages || 0;
      byDate[s.session_date].minutes += s.minutes || 0;
    }

    let maxPages = 0;
    let maxMinutes = 0;
    for (const date in byDate) {
      if (byDate[date].pages > maxPages) maxPages = byDate[date].pages;
      if (byDate[date].minutes > maxMinutes) maxMinutes = byDate[date].minutes;
    }

    setBestPages(maxPages);
    setBestMinutes(maxMinutes);
  }

  return (
    <Screen>
      <ScrollView>
        <ThemedText type="subtitle" style={styles.title}>
          My Stats
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Current Streak
          </ThemedText>
          <ThemedText style={styles.big}>{streak} 🔥</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {streak === 1 ? 'day' : 'days'} in a row
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Personal Records
          </ThemedText>
          <ThemedText style={styles.record}>Best day (pages): {bestPages}</ThemedText>
          <ThemedText style={styles.record}>Best day (minutes): {bestMinutes}</ThemedText>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          Total sessions logged: {sessions.length}
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 24 },
  section: { marginBottom: 32 },
  big: { fontSize: 48, lineHeight: 56, fontWeight: '700' },
  record: { fontSize: 20, lineHeight: 28, marginTop: 4 },
});
