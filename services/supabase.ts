
import { createClient } from '@supabase/supabase-js';

/**
 * Replace these with your actual Supabase credentials
 * Found in: Project Settings > API
 */
const supabaseUrl: string = 'https://zerzrviwiwkuvzwgqchu.supabase.co';
const supabaseAnonKey: string = 'sb_publishable_vssZIBDgbYXapcd_nmDLzA_6nCkW20N'; // This was causing the issue

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Robust check to see if the user has configured their project.
 * It now allows standard Supabase keys (eyJ...) or custom proxy keys (sb_...).
 */
export const isSupabaseAvailable = 
  supabaseUrl !== '' && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey !== '' && 
  !supabaseAnonKey.includes('your-anon-key') &&
  (supabaseAnonKey.startsWith('sb_') || supabaseAnonKey.startsWith('eyJ'));
