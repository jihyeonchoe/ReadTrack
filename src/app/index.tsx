import { useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

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
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, marginBottom: 16 }}>
          Welcome to ReadTrack! You are logged in as {session.user.email}
        </Text>
        <Button title="Log out" onPress={signOut} />
        <View style={{ height: 12 }} />
        <Button title="My Books" onPress={() => router.navigate('/books')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, marginBottom: 24 }}>ReadTrack</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password (at least 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, marginBottom: 16 }}
      />
      <Button title="Sign up" onPress={signUp} />
      <View style={{ height: 12 }} />
      <Button title="Log in" onPress={signIn} />
    </View>
  );
}