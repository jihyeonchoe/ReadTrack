import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Native sheet for short forms. On iOS it's a page sheet: it slides up as a card,
 * the screen behind recedes slightly, and you can swipe it down to close —
 * no dark flashing overlay. On Android and web it opens as a full screen.
 */
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ThemedView style={[styles.fill, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          <View style={styles.body}>{children}</View>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 22, lineHeight: 30 },
  body: { gap: 12, marginTop: 20 },
});
