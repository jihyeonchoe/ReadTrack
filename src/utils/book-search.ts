export type FoundBook = {
  id: string;
  title: string;
  author: string | null;
  pages: number | null;
  cover: string | null;
};

type GoogleVolume = {
  id: string;
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: { thumbnail?: string };
  };
};

// Optional key (EXPO_PUBLIC_GOOGLE_BOOKS_KEY in .env.local). Without it Google's shared free quota
// is often used up and searches fail with 429.
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY;

/** Searches Google Books. Returns up to 6 English books. */
export async function searchBooks(query: string, signal?: AbortSignal): Promise<FoundBook[]> {
  const url =
    'https://www.googleapis.com/books/v1/volumes' +
    `?q=${encodeURIComponent(query)}&maxResults=6&printType=books&langRestrict=en` +
    '&fields=items(id,volumeInfo(title,subtitle,authors,pageCount,imageLinks/thumbnail))' +
    (API_KEY ? `&key=${API_KEY}` : '');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(res.status === 429 ? 'Search limit reached' : `Search failed (${res.status})`);
  const json: { items?: GoogleVolume[] } = await res.json();

  return (json.items ?? [])
    .filter((v) => v.volumeInfo.title)
    .map((v) => ({
      id: v.id,
      title: v.volumeInfo.title!,
      author: v.volumeInfo.authors?.join(', ') ?? null,
      pages: v.volumeInfo.pageCount || null,
      // Google returns http links with a page-curl effect; use https and a flat cover.
      cover:
        v.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://').replace('&edge=curl', '') ??
        null,
    }));
}
