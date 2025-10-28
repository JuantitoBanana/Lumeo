import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// TODO: Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://mrwfadeaaummjvaxntsp.supabase.co'; // Example: https://mrwfadeaaummjvaxntsp.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yd2ZhZGVhYXVtbWp2YXhudHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTYzMjEsImV4cCI6MjA3NjAzMjMyMX0.sUgZBJ75NWROBivtPoBaiU_0qMIHiearWU5AEm6v-Mw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
