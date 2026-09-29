import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Index() {
  const [message, setMessage] = useState('Checking connection...');

  useEffect(() => {
    async function check() {
      const { error } = await supabase.auth.getSession();
      setMessage(error ? 'Error: ' + error.message : 'Connected to Supabase!');
    }
    check();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>{message}</Text>
    </View>
  );
}