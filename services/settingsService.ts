
import { supabase, isSupabaseAvailable } from "./supabase";
import { AppTheme, SiteSettings, OfferPopup } from "../types";
import { handleDbError } from "./errorUtils";

const TABLE = "site_settings";
const LOCAL_STORAGE_KEY = "peak_stay_settings_sandbox";

export const DEFAULT_OFFER: OfferPopup = {
  enabled: false,
  title: "Special Summer Sale!",
  description: "Get flat 20% off on all luxury villas in Lonavala for bookings this month.",
  imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=600",
  buttonText: "Book Now",
  buttonLink: "villas"
};

export const DEFAULT_SETTINGS: SiteSettings = {
  activeTheme: AppTheme.DEFAULT,
  promoText: "PEAK STAY EXCLUSIVE: BOOK YOUR LEGACY SANCTUARY TODAY",
  whatsappNumber: "+919157928471",
  contactEmail: "peakstaydestination@gmail.com",
  contactPhone: "+919157928471",
  siteLogo: "",
  primaryColor: "#0ea5e9",
  offerPopup: DEFAULT_OFFER
};

const getLocalSettings = (): SiteSettings => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_SETTINGS, ...parsed };
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
          activeTheme: (data.active_theme as AppTheme) || DEFAULT_SETTINGS.activeTheme,
          promoText: data.promo_text || DEFAULT_SETTINGS.promoText,
          whatsappNumber: data.whatsapp_number || DEFAULT_SETTINGS.whatsappNumber,
          contactEmail: data.contact_email || DEFAULT_SETTINGS.contactEmail,
          contactPhone: data.contact_phone || DEFAULT_SETTINGS.contactPhone,
          siteLogo: data.site_logo || DEFAULT_SETTINGS.siteLogo,
          primaryColor: data.primary_color || DEFAULT_SETTINGS.primaryColor,
          offerPopup: data.offer_popup ? (typeof data.offer_popup === 'string' ? JSON.parse(data.offer_popup) : data.offer_popup) : DEFAULT_SETTINGS.offerPopup
        });
      } else {
        // If row 1 doesn't exist, we provide defaults but don't error out
        callback(getLocalSettings());
      }
    } catch (e) {
      callback(getLocalSettings());
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
  
  // Always update local first for immediate UI feedback
  saveLocalSettings(updated);

  if (!isSupabaseAvailable) return;

  // Prepare full payload for Supabase to ensure consistency
  const payload: any = {
    id: 1,
    active_theme: updated.activeTheme,
    promo_text: updated.promoText,
    whatsapp_number: updated.whatsappNumber,
    contact_email: updated.contactEmail,
    contact_phone: updated.contactPhone,
    site_logo: updated.siteLogo,
    primary_color: updated.primaryColor,
    offer_popup: updated.offerPopup
  };

  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'id' });
      
    if (error) {
      console.error("Supabase Settings Upsert Failed:", error);
      throw handleDbError(error, TABLE);
    }
  } catch (err: any) {
    console.error("Critical Settings Sync Failure:", err);
    throw err;
  }
};
