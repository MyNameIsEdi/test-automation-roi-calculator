import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are valid (not placeholder text)
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://');
const isConfigured = isValidUrl && supabaseAnonKey && supabaseAnonKey.length > 10;

if (!isConfigured) {
  console.warn("Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

export const supabase = createClient(
  isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey && supabaseAnonKey.length > 10 ? supabaseAnonKey : 'placeholder-key'
);