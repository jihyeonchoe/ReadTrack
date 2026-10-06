import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/hooks/use-session';
import { supabase } from '../../lib/supabase';

export default function Index() {
  const { session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  async function signUp() {
    if (!username.trim()) {
      Alert.alert('Please enter a username');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Sign up problem', error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username: username.trim() });
      if (profileError) {
        Alert.alert('Profile creation problem', profileError.message);
      }
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Log in problem', error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (session) {
    return (
      <Screen centered>
        <ThemedText type="subtitle">Welcome back</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtle}>
          Logged in as {session.user.email}
        </ThemedText>
        <View style={styles.stack}>
          <AppButton title="My Books" onPress={() => router.navigate('/books')} />
          <AppButton title="Log out" variant="secondary" onPress={signOut} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen centered>
      <ThemedText type="subtitle" style={styles.brand}>
        ReadTrack
      </ThemedText>
      <View style={styles.stack}>
        <TextField
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextField
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField
          placeholder="Password (at least 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <View style={styles.stack}>
        <AppButton title="Log in" onPress={signIn} />
        <AppButton title="Sign up" variant="secondary" onPress={signUp} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { marginBottom: 24 },
  subtle: { marginTop: 4 },
  stack: { gap: 12, marginTop: 24 },
});
