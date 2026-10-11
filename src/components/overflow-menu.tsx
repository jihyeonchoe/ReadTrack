import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

type Item = { label: string; onPress: () => void };

/** "⋯" button that opens a small dropdown in the top-right corner. No dimmed background. */
export function OverflowMenu({ items }: { items: Item[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={12}
        style={styles.trigger}>
        <ThemedText style={styles.dots}>⋯</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Tap anywhere outside the menu to close it. */}
        <Pressable style={styles.fill} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          <ThemedView
            style={[
              styles.menu,
              { top: insets.top + 56, borderColor: theme.border, shadowColor: theme.text },
            ]}>
            {items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && { borderTopWidth: 1, borderColor: theme.border },
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <ThemedText>{item.label}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  dots: { fontSize: 24, lineHeight: 28 },
  fill: { flex: 1 },
  menu: {
    position: 'absolute',
    right: 20,
    minWidth: 180,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  item: { paddingVertical: 14, paddingHorizontal: 18 },
});
