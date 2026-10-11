import { useLocalSearchParams } from 'expo-router';

import { BookLog } from '@/components/book-log';

export default function BookLogRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookLog id={id} />;
}
