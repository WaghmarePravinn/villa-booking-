
import { supabase, isSupabaseAvailable } from "./supabase";
import { AppTheme, SiteSettings } from "../types";

const TABLE = "site_settings";
const LOCAL_STORAGE_KEY = "peak_stay_settings_sandbox";

export const DEFAULT_SETTINGS: SiteSettings = {
  activeTheme: AppTheme.DEFAULT,
  promoText: "PEAK STAY EXCLUSIVE: BOOK YOUR LEGACY SANCTUARY TODAY",
  whatsappNumber: "+919157928471",
  contactEmail: "peakstaydestination@gmail.com",
  contactPhone: "+919157928471"
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
          promoText: data.promo_text,
          whatsappNumber: data.whatsapp_number || DEFAULT_SETTINGS.whatsappNumber,
          contactEmail: data.contact_email || DEFAULT_SETTINGS.contactEmail,
          contactPhone: data.contact_phone || DEFAULT_SETTINGS.contactPhone
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
  
  saveLocalSettings(updated);

  if (!isSupabaseAvailable) {
    return;
  }

  const payload: any = { id: 1 };
  if (settings.activeTheme) payload.active_theme = settings.activeTheme;
  if (settings.promoText) payload.promo_text = settings.promoText;
  if (settings.whatsappNumber) payload.whatsapp_number = settings.whatsappNumber;
  if (settings.contactEmail) payload.contact_email = settings.contactEmail;
  if (settings.contactPhone) payload.contact_phone = settings.contactPhone;

  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'id' });
    
  if (error) {
    console.error("Supabase Settings Sync Failed:", error);
    throw error;
  }
};
