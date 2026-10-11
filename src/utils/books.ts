import { type Book } from '@/components/book-card';
import { supabase } from '../../lib/supabase';

export type Shelf = 'reading' | 'want' | 'finished';

export const SHELF_TITLES: Record<Shelf, string> = {
  reading: 'Currently Reading',
  want: 'Want to Read',
  finished: 'Finished',
};

export function shelfOf(book: Pick<Book, 'status'>): Shelf {
  if (book.status === 'finished') return 'finished';
  if (book.status === 'want_to_read') return 'want';
  return 'reading';
}

/** All of *my* books, newest first. (Other readers' books are visible for the feed.) */
export async function loadMyBooks() {
  const { data: userData } = await supabase.auth.getUser();
  const me = userData.user?.id;
  if (!me) return { data: [] as Book[], error: null };
  const { data, error } = await supabase
    .from('books')
    .select('id, title, status, pages_read, total_pages, genre, google_id')
    .eq('user_id', me)
    .order('created_at', { ascending: false });
  return { data: (data ?? []) as Book[], error };
}
