
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
  // Create and dispatch a custom event that includes the settings
  const event = new CustomEvent('peak_stay_settings_updated', { detail: settings });
  window.dispatchEvent(event);
};

export const subscribeToSettings = (callback: (settings: SiteSettings) => void) => {
  if (!isSupabaseAvailable) {
    callback(getLocalSettings());
    const handleUpdate = (e: any) => callback(e.detail);
    window.addEventListener('peak_stay_settings_updated', handleUpdate);
    return () => window.removeEventListener('peak_stay_settings_updated', handleUpdate);
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
  const current = getLocalSettings();
  const updated = { ...current, ...settings };
  
  // Update local immediately for UI responsiveness
  saveLocalSettings(updated);

  if (!isSupabaseAvailable) {
    console.warn("Supabase not available, settings saved to local storage only.");
    return;
  }

  const payload: any = { id: 1 };
  if (settings.activeTheme) payload.active_theme = settings.activeTheme;
  if (settings.promoText) payload.promo_text = settings.promoText;

  // Use upsert to handle both creation and update of the settings row (ID=1)
  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'id' });
    
  if (error) {
    console.error("Supabase Settings Sync Failed:", error);
    throw error;
  }
};
