
import { supabase, isSupabaseAvailable } from "./supabase";
import { AppTheme, SiteSettings } from "../types";

const TABLE = "site_settings";

export const DEFAULT_SETTINGS: SiteSettings = {
  activeTheme: AppTheme.NEW_YEAR,
  promoText: "CELEBRATING 2025: USE CODE NY25 FOR EXCLUSIVE DISCOUNTS"
};

export const subscribeToSettings = (callback: (settings: SiteSettings) => void) => {
  if (!isSupabaseAvailable) {
    callback(DEFAULT_SETTINGS);
    return () => {};
  }

  const fetchSettings = async () => {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', 1).single();
    if (!error && data) {
      callback({
        activeTheme: data.active_theme as AppTheme,
        promoText: data.promo_text
      });
    } else {
      callback(DEFAULT_SETTINGS);
    }
  };

  fetchSettings();
  const channel = supabase.channel('settings-realtime').on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => fetchSettings()).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const updateSettings = async (settings: Partial<SiteSettings>) => {
  if (!isSupabaseAvailable) return;
  const payload: any = {};
  if (settings.activeTheme) payload.active_theme = settings.activeTheme;
  if (settings.promoText) payload.promo_text = settings.promoText;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', 1);
  if (error && error.code === 'PGRST116') {
    await supabase.from(TABLE).insert([{ id: 1, ...payload }]);
  }
};
