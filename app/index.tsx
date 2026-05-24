import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../utils/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    );
  }

  return <Redirect href={authed ? '/(tabs)/dashboard' : ('/(auth)' as any)} />;
}
