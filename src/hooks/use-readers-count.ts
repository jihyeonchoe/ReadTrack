import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

/**
 * How many *other* readers are currently reading the same book (matched by Google Books id).
 * Uses the `readers_count` database function, which only returns a number.
 */
export function useReadersCount(googleId: string | null | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!googleId) {
      setCount(0);
      return;
    }
    let cancelled = false;
    supabase.rpc('readers_count', { gid: googleId }).then(({ data, error }) => {
      if (!cancelled && !error) setCount(data ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [googleId]);

  return count;
}

/** "3 others reading" / "1 other reading". */
export function readersLabel(n: number) {
  return `${n} ${n === 1 ? 'other' : 'others'} reading`;
}
