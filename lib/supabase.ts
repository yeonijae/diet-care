import { createClient } from '@supabase/supabase-js';

// Get environment variables with detailed logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase initialization:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlType: typeof supabaseUrl,
  keyType: typeof supabaseAnonKey,
  urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
  keyValue: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
  allEnvKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
});

// Validate environment variables
if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
  throw new Error('VITE_SUPABASE_URL is missing or invalid. Please check Vercel environment variables.');
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
  throw new Error('VITE_SUPABASE_ANON_KEY is missing or invalid. Please check Vercel environment variables.');
}

// Trim any whitespace from environment variables
const cleanUrl = supabaseUrl.trim();
const cleanKey = supabaseAnonKey.trim();

export const supabase = createClient(cleanUrl, cleanKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
