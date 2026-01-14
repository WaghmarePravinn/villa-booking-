
import { supabase, isSupabaseAvailable } from "./supabase";
import { AppTheme, SiteSettings } from "../types";

const TABLE = "site_settings";
const LOCAL_STORAGE_KEY = "peak_stay_settings_sandbox";

export const DEFAULT_SETTINGS: SiteSettings = {
  activeTheme: AppTheme.DEFAULT,
  promoText: "PEAK STAY EXCLUSIVE: BOOK YOUR LEGACY SANCTUARY TODAY"
};

const getLocalSettings = (): SiteSettings => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

const saveLocalSettings = (settings: SiteSettings) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('storage'));
};

export const subscribeToSettings = (callback: (settings: SiteSettings) => void) => {
  if (!isSupabaseAvailable) {
    callback(getLocalSettings());
    const handleStorage = () => callback(getLocalSettings());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from(TABLE).select('*').eq('id', 1).single();
      if (!error && data) {
        callback({
          activeTheme: data.active_theme as AppTheme,
          promoText: data.promo_text
        });
      } else {
        // If row doesn't exist, we'll use default or try to initialize
        callback(DEFAULT_SETTINGS);
      }
    } catch (e) {
      callback(DEFAULT_SETTINGS);
    }
  };

  fetchSettings();
  const channel = supabase.channel('settings-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => fetchSettings())
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const updateSettings = async (settings: Partial<SiteSettings>) => {
  // Always update local for immediate feedback and sandbox support
  const current = getLocalSettings();
  const updated = { ...current, ...settings };
  saveLocalSettings(updated);

  if (!isSupabaseAvailable) return;

  const payload: any = { id: 1 };
  if (settings.activeTheme) payload.active_theme = settings.activeTheme;
  if (settings.promoText) payload.promo_text = settings.promoText;

  // Use upsert to handle both creation and update of the settings row (ID=1)
  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'id' });
    
  if (error) {
    console.error("Settings Update Failed:", error);
    throw error;
  }
};
