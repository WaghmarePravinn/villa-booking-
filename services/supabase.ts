
import { createClient } from '@supabase/supabase-js';

/**
 * PROJECT: peak-stay-db
 */
const supabaseUrl: string = 'https://zerzrviwiwkuvzwgqchu.supabase.co';
const supabaseAnonKey: string = 'sb_publishable_vssZIBDgbYXapcd_nmDLzA_6nCkW20N';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Validates if the current configuration is pointing to a live project.
 */
export const isSupabaseAvailable = 
  supabaseUrl !== '' && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey.startsWith('sb_'); // Validating the new Supabase key format
