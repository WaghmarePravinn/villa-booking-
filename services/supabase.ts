
import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = 'https://zerzrviwiwkuvzwgqchu.supabase.co';
const supabaseAnonKey: string = 'sb_publishable_vssZIBDgbYXapcd_nmDLzA_6nCkW20N';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseAvailable = 
  supabaseUrl !== '' && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey !== '' && 
  !supabaseAnonKey.includes('your-anon-key') &&
  (supabaseAnonKey.startsWith('sb_') || supabaseAnonKey.startsWith('eyJ'));
