import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation function to prevent runtime crashes during module initialization
const validateConfig = (url?: string, key?: string) => {
  if (!url || !url.startsWith('http')) {
    console.error('Invalid or missing VITE_SUPABASE_URL in .env.local');
    return false;
  }
  if (!key) {
    console.error('Missing VITE_SUPABASE_ANON_KEY in .env.local');
    return false;
  }
  return true;
};

// Only initialize if config is valid, otherwise export a proxy or null
export const supabase = validateConfig(supabaseUrl, supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Cast as any to avoid breaking types, but null check in hooks is better

export const getSupabaseClient = (clerkToken?: string) => {
  if (!validateConfig(supabaseUrl, supabaseAnonKey)) {
    throw new Error('Supabase configuration is invalid. Check your .env.local file.');
  }

  if (clerkToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    });
  }
  return supabase;
};
