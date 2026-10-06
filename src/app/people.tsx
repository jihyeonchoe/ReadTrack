import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '../../lib/supabase';

type Profile = {
  id: string;
  username: string;
};

export default function People() {
  const theme = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id ?? null;
    setMyId(currentUserId);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username');
    if (profileError) {
      Alert.alert('Error loading people', profileError.message);
      return;
    }
    setProfiles(profileData.filter((p) => p.id !== currentUserId));

    const { data: followData, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);
    if (followError) {
      Alert.alert('Error loading follows', followError.message);
      return;
    }
    setFollowingIds(followData.map((f) => f.following_id));
  }

    async function follow(targetId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;
    if (!currentUserId) {
      Alert.alert('Error', 'Not logged in');
      return;
    }
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: currentUserId, following_id: targetId });
    if (error) Alert.alert('Error following', error.message);
    else loadData();
  }

  async function unfollow(targetId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;
    if (!currentUserId) {
      Alert.alert('Error', 'Not logged in');
      return;
    }
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetId);
    if (error) Alert.alert('Error unfollowing', error.message);
    else loadData();
  }

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.title}>
        Find Readers
      </ThemedText>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isFollowing = followingIds.includes(item.id);
          return (
            <View style={[styles.row, { borderColor: theme.border }]}>
              <ThemedText style={styles.name}>{item.username}</ThemedText>
              {isFollowing ? (
                <AppButton title="Following" variant="secondary" onPress={() => unfollow(item.id)} />
              ) : (
                <AppButton title="Follow" onPress={() => follow(item.id)} />
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  name: { fontSize: 18, flexShrink: 1 },
});
