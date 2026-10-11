import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { NoteField } from '@/components/note-field';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatClock } from '@/utils/reading';

type Phase = 'running' | 'paused' | 'finished';

type ReadingTimerProps = {
  /** Book being recorded. `null` hides the recorder. */
  bookTitle: string | null;
  onSave: (minutes: number, pages: number | null, note: string | null) => Promise<boolean>;
  onDiscard: () => void;
};

function toPositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Strava-style recorder: big running clock with Pause / Resume / Finish,
 * then a short summary where the reader adds pages and a note.
 * Elapsed time is computed from timestamps, so it stays correct if the app is backgrounded.
 */
export function ReadingTimer({ bookTitle, onSave, onDiscard }: ReadingTimerProps) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('running');
  const [elapsed, setElapsed] = useState(0); // seconds
  const accumulated = useRef(0); // ms from previous running stretches
  const startedAt = useRef<number | null>(null); // ms timestamp of current stretch
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const visible = bookTitle !== null;

  function currentMs() {
    return accumulated.current + (startedAt.current ? Date.now() - startedAt.current : 0);
  }

  // Reset and auto-start each time the recorder opens.
  useEffect(() => {
    if (!visible) return;
    accumulated.current = 0;
    startedAt.current = Date.now();
    setElapsed(0);
    setPages('');
    setNote('');
    setPhase('running');
  }, [visible]);

  // Tick once a second while running.
  useEffect(() => {
    if (!visible || phase !== 'running') return;
    const id = setInterval(() => setElapsed(currentMs() / 1000), 1000);
    return () => clearInterval(id);
  }, [visible, phase]);

  function pause() {
    accumulated.current = currentMs();
    startedAt.current = null;
    setElapsed(accumulated.current / 1000);
    setPhase('paused');
  }

  function resume() {
    startedAt.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (phase === 'running') pause();
    setPhase('finished');
  }

  const minutes = Math.max(1, Math.round(elapsed / 60));
  const pagesNum = toPositiveInt(pages);

  async function save() {
    setSaving(true);
    const ok = await onSave(minutes, pagesNum, note.trim() || null);
    setSaving(false);
    if (!ok) setPhase('finished');
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={finish}>
      <ThemedView
        style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {phase === 'finished' ? 'SESSION SUMMARY' : phase === 'paused' ? 'PAUSED' : 'READING'}
          </ThemedText>
          <ThemedText type="serif" style={[styles.book, styles.center]} numberOfLines={2}>
            {bookTitle}
          </ThemedText>

          <View style={styles.clockWrap}>
            <ThemedText
              style={styles.clock}
              accessibilityRole="timer"
              accessibilityLabel={`Elapsed time ${formatClock(elapsed)}`}>
              {formatClock(elapsed)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {phase === 'finished' ? `${minutes} min will be saved` : 'elapsed'}
            </ThemedText>
          </View>

          {phase === 'finished' ? (
            <View style={styles.stack}>
              <TextField
                placeholder="Pages read"
                value={pages}
                onChangeText={setPages}
                keyboardType="number-pad"
                autoFocus
              />
              <NoteField value={note} onChangeText={setNote} />
              <AppButton title={saving ? 'Saving…' : 'Save session'} onPress={save} disabled={saving} />
              <AppButton title="Back to timer" variant="secondary" onPress={resume} />
              <AppButton title="Discard" variant="secondary" onPress={onDiscard} />
            </View>
          ) : (
            <View style={styles.stack}>
              {phase === 'running' ? (
                <AppButton title="Pause" variant="secondary" onPress={pause} />
              ) : (
                <AppButton title="Resume" variant="secondary" onPress={resume} />
              )}
              <AppButton title="Finish" onPress={finish} />
            </View>
          )}
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  column: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  center: { textAlign: 'center' },
  book: { marginTop: 8 },
  clockWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  clock: {
    fontSize: 80,
    lineHeight: 92,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  stack: { gap: 12 },
});
