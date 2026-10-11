import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/**
 * Stack used inside a tab: the tab's main screen (no header) with detail screens
 * pushed on top (thin native header with a back arrow, no title).
 */
export function TabStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        title: '',
        headerTintColor: theme.text,
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
