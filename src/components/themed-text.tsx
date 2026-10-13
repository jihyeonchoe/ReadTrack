import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'serif'
    | 'number'
    | 'label'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'serif' && styles.serif,
        type === 'number' && styles.number,
        type === 'label' && styles.label,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Type system (see CLAUDE.md): one clean system sans (SF Pro on iPhone, close to Inter).
// Hierarchy comes from size and weight only.
const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 600,
    letterSpacing: -0.6,
  },
  /** Page titles: My Books, Stats, Record… */
  subtitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 600,
    letterSpacing: -0.5,
  },
  /** Book titles and section headings (legacy name — no longer a serif). */
  serif: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 600,
    letterSpacing: -0.2,
  },
  /** Big stat numbers. */
  number: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 600,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  /** Small uppercase labels: THIS WEEK, CURRENTLY READING… */
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 600,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
