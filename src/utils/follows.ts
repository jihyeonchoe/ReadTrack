import { Alert } from 'react-native';

import { supabase } from '../../lib/supabase';

export type Profile = { id: string; username: string };

export async function follow(myId: string, targetId: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: myId, following_id: targetId });
  if (error) Alert.alert('Error following', error.message);
  return !error;
}

export async function unfollow(myId: string, targetId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', myId)
    .eq('following_id', targetId);
  if (error) Alert.alert('Error unfollowing', error.message);
  return !error;
}

/** Ids of people I follow, and ids of people following me. */
export async function loadFollowIds(myId: string) {
  const [following, followers] = await Promise.all([
    supabase.from('follows').select('following_id').eq('follower_id', myId),
    supabase.from('follows').select('follower_id').eq('following_id', myId),
  ]);
  return {
    following: (following.data ?? []).map((f) => f.following_id as string),
    followers: (followers.data ?? []).map((f) => f.follower_id as string),
  };
}
