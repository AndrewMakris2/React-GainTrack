import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Polyfill URL for React Native
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://kbbqosbgnsivxmklcnuo.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYnFvc2JnbnNpdnhta2xjbnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjI1NzIsImV4cCI6MjA5NTEzODU3Mn0.8fymmHQQzdvaLg_ntl0oBOKxr-QcqJs7BsFcyXwlRU0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage on native, localStorage on web (default)
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
