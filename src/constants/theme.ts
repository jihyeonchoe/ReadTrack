/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Neutral gray palette: Jet Black #0B0B0B · White Smoke #F5F5F5 ·
// Granite Gray #6B6762 · Ash Gray #BCBAB4 · Light Gray #D9D9D9
export const Colors = {
  light: {
    text: '#0B0B0B', // Jet Black
    background: '#F5F5F5', // White Smoke
    backgroundElement: '#ECECEC',
    backgroundSelected: '#D9D9D9', // Light Gray
    textSecondary: '#6B6762', // Granite Gray
    border: '#D9D9D9', // Light Gray
  },
  dark: {
    text: '#F5F5F5',
    background: '#0B0B0B',
    backgroundElement: '#161616',
    backgroundSelected: '#262626',
    textSecondary: '#BCBAB4', // Ash Gray
    border: '#2A2A2A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
