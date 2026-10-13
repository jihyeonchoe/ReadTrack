import { useEffect, useState } from 'react';

import { AppButton } from '@/components/app-button';
import { NoteField } from '@/components/note-field';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { deleteSession, updateSession, type EditableSession } from '@/utils/sessions';

function toPositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type SessionEditorProps = {
  /** The session to edit; `null` hides the sheet. */
  session: EditableSession | null;
  onClose: () => void;
  /** Called after a save or delete so the screen can reload. */
  onChanged: () => void;
};

/** Sheet to edit a session's minutes, pages and note, or delete it (with a second tap to confirm). */
export function SessionEditor({ session, onClose, onChanged }: SessionEditorProps) {
  const [minutes, setMinutes] = useState('');
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    setMinutes(session.minutes ? String(session.minutes) : '');
    setPages(session.pages ? String(session.pages) : '');
    setNote(session.note ?? '');
    setConfirmDelete(false);
  }, [session]);

  async function save() {
    if (!session) return;
    setBusy(true);
    const ok = await updateSession(session, {
      minutes: toPositiveInt(minutes),
      pages: toPositiveInt(pages),
      note: note.trim() || null,
    });
    setBusy(false);
    if (ok) {
      onClose();
      onChanged();
    }
  }

  async function remove() {
    if (!session) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    const ok = await deleteSession(session);
    setBusy(false);
    if (ok) {
      onClose();
      onChanged();
    }
  }

  return (
    <Sheet visible={session !== null} title="Edit session" onClose={onClose}>
      <TextField
        placeholder="Minutes read"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
      />
      <TextField
        placeholder="Pages read"
        value={pages}
        onChangeText={setPages}
        keyboardType="number-pad"
      />
      <NoteField value={note} onChangeText={setNote} />
      <AppButton title="Save" onPress={save} disabled={busy} />
      <AppButton title="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
      {confirmDelete ? (
        <ThemedText type="small" themeColor="textSecondary">
          This can’t be undone. Its pages will be taken off the book’s progress.
        </ThemedText>
      ) : null}
      <AppButton
        title={confirmDelete ? 'Tap again to delete' : 'Delete session'}
        variant="text"
        onPress={remove}
        disabled={busy}
      />
    </Sheet>
  );
}
