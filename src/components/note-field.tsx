import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';

export const NOTE_LIMIT = 140;

/** Optional session note, limited to 140 characters, with a live counter. */
export function NoteField({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  const left = NOTE_LIMIT - value.length;
  return (
    <View style={styles.wrap}>
      <TextField
        placeholder="Note (optional)"
        value={value}
        onChangeText={onChangeText}
        maxLength={NOTE_LIMIT}
        multiline
        style={styles.input}
      />
      <ThemedText
        type="small"
        themeColor={left <= 10 ? 'text' : 'textSecondary'}
        style={styles.counter}
        accessibilityLabel={`${left} characters left`}>
        {value.length}/{NOTE_LIMIT}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  input: { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end' },
});
