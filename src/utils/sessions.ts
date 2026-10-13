import { Alert } from 'react-native';

import { localDateString } from '@/utils/reading';
import { supabase } from '../../lib/supabase';

type BookRef = { id: string; pages_read: number };

/** Saves one reading session and adds its pages to the book. Returns true on success. */
export async function saveSession(
  book: BookRef,
  minutes: number | null,
  pages: number | null,
  note: string | null,
  /** YYYY-MM-DD; defaults to today. Used when logging a past day from the calendar. */
  date: string = localDateString()
): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from('reading_sessions').insert({
    user_id: userData.user?.id,
    book_id: book.id,
    session_date: date,
    minutes,
    pages,
    note,
  });
  if (error) {
    Alert.alert('Error saving session', error.message);
    return false;
  }

  if (pages) {
    const { error: updateError } = await supabase
      .from('books')
      .update({ pages_read: book.pages_read + pages })
      .eq('id', book.id);
    if (updateError) Alert.alert('Error updating pages', updateError.message);
  }
  return true;
}

type SessionForProgress = {
  id: string;
  book_id?: string;
  pages: number | null;
  minutes?: number | null;
  session_date: string;
  created_at: string;
};

export type Progress = { pages: number; minutes: number };

/**
 * For each session, how far the reader had got in that book after it:
 * running totals of pages and minutes, oldest first. Returns a map of session id → totals.
 */
export function progressBySession(sessions: SessionForProgress[]): Record<string, Progress> {
  const sorted = [...sessions].sort((a, b) =>
    a.session_date === b.session_date
      ? a.created_at.localeCompare(b.created_at)
      : a.session_date.localeCompare(b.session_date)
  );
  const totals: Record<string, Progress> = {};
  const result: Record<string, Progress> = {};
  for (const s of sorted) {
    const key = s.book_id ?? 'book';
    const prev = totals[key] ?? { pages: 0, minutes: 0 };
    totals[key] = { pages: prev.pages + (s.pages ?? 0), minutes: prev.minutes + (s.minutes ?? 0) };
    result[s.id] = totals[key];
  }
  return result;
}

/** "20/100 pages", or "20 pages" when the total isn't known. */
export function formatPageProgress(reached: number, total: number | null | undefined): string {
  return total ? `${reached}/${total} pages` : `${reached} pages`;
}

export type EditableSession = {
  id: string;
  book_id: string;
  minutes: number | null;
  pages: number | null;
  note: string | null;
};

/** Adds `delta` pages (can be negative) to a book's running total, never below 0. */
async function adjustBookPages(bookId: string, delta: number) {
  if (!delta) return;
  const { data } = await supabase.from('books').select('pages_read').eq('id', bookId).single();
  if (!data) return;
  await supabase
    .from('books')
    .update({ pages_read: Math.max(0, (data.pages_read ?? 0) + delta) })
    .eq('id', bookId);
}

/** Changes a session's minutes / pages / note and keeps the book's pages-read total in sync. */
export async function updateSession(
  session: EditableSession,
  changes: { minutes: number | null; pages: number | null; note: string | null }
): Promise<boolean> {
  const { error } = await supabase.from('reading_sessions').update(changes).eq('id', session.id);
  if (error) {
    Alert.alert('Error saving changes', error.message);
    return false;
  }
  await adjustBookPages(session.book_id, (changes.pages ?? 0) - (session.pages ?? 0));
  return true;
}

/** Deletes a session and takes its pages off the book's pages-read total. */
export async function deleteSession(session: EditableSession): Promise<boolean> {
  const { error } = await supabase.from('reading_sessions').delete().eq('id', session.id);
  if (error) {
    Alert.alert('Error deleting session', error.message);
    return false;
  }
  await adjustBookPages(session.book_id, -(session.pages ?? 0));
  return true;
}
