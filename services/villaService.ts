
import { supabase, isSupabaseAvailable } from "./supabase";
import { Villa } from "../types";
import { INITIAL_VILLAS } from "../constants";
import { handleDbError } from "./errorUtils";

const TABLE = "villas";
const LOCAL_STORAGE_KEY = "peak_stay_villas_sandbox";
const UPDATE_EVENT = 'peak_stay_villas_updated';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const isValidUUID = (id: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(id);
};

const getLocalVillas = (): Villa[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return INITIAL_VILLAS;
  
  try {
    const parsed = JSON.parse(saved);
    return parsed.map((v: any) => ({
      ...v,
      id: isValidUUID(v.id) ? v.id : generateUUID()
    }));
  } catch (e) {
    return INITIAL_VILLAS;
  }
};

const saveLocalVillas = (villas: Villa[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(villas));
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: villas }));
};

const mapFromDb = (v: any): Villa => ({
  id: v.id,
  name: v.name || "Unnamed Property",
  location: v.location || "Unknown Location",
  pricePerNight: Number(v.price_per_night ?? v.pricePerNight ?? 0),
  bedrooms: Number(v.bedrooms ?? 0),
  bathrooms: Number(v.bathrooms ?? 0),
  capacity: Number(v.capacity ?? 0),
  description: v.description || "",
  longDescription: v.long_description || v.longDescription || "",
  imageUrls: Array.isArray(v.image_urls) ? v.image_urls : (v.image_url ? [v.image_url] : []),
  videoUrls: Array.isArray(v.video_urls) ? v.video_urls : (v.video_url ? [v.video_url] : []),
  amenities: Array.isArray(v.amenities) ? v.amenities : [],
  includedServices: Array.isArray(v.included_services) ? v.included_services : [],
  isFeatured: Boolean(v.is_featured ?? v.isFeatured ?? false),
  rating: Number(v.rating ?? 5),
  ratingCount: Number(v.rating_count ?? v.ratingCount ?? 0),
  numRooms: Number(v.num_rooms ?? v.numRooms ?? v.bedrooms ?? 0),
  mealsAvailable: Boolean(v.meals_available ?? v.mealsAvailable ?? false),
  petFriendly: Boolean(v.pet_friendly ?? v.petFriendly ?? false),
  refundPolicy: v.refund_policy || v.refundPolicy || ""
});

const mapToDb = (v: Partial<Villa>) => {
  const payload: any = {};
  if (v.name !== undefined) payload.name = v.name;
  if (v.location !== undefined) payload.location = v.location;
  if (v.pricePerNight !== undefined) payload.price_per_night = Number(v.pricePerNight);
  if (v.bedrooms !== undefined) payload.bedrooms = Number(v.bedrooms);
  if (v.bathrooms !== undefined) payload.bathrooms = Number(v.bathrooms);
  if (v.capacity !== undefined) payload.capacity = Number(v.capacity);
  if (v.description !== undefined) payload.description = v.description;
  if (v.longDescription !== undefined) payload.long_description = v.longDescription;
  if (v.imageUrls !== undefined) payload.image_urls = v.imageUrls;
  if (v.videoUrls !== undefined) payload.video_urls = v.videoUrls;
  if (v.amenities !== undefined) payload.amenities = v.amenities;
  if (v.includedServices !== undefined) payload.included_services = v.includedServices;
  if (v.isFeatured !== undefined) payload.is_featured = Boolean(v.isFeatured);
  if (v.numRooms !== undefined) payload.num_rooms = Number(v.numRooms);
  if (v.mealsAvailable !== undefined) payload.meals_available = Boolean(v.mealsAvailable);
  if (v.petFriendly !== undefined) payload.pet_friendly = Boolean(v.petFriendly);
  if (v.refundPolicy !== undefined) payload.refund_policy = v.refundPolicy;
  if (v.rating !== undefined) payload.rating = Number(v.rating);
  if (v.ratingCount !== undefined) payload.rating_count = Number(v.ratingCount);
  return payload;
};

export const subscribeToVillas = (callback: (villas: Villa[]) => void) => {
  if (!isSupabaseAvailable) {
    callback(getLocalVillas());
    
    const handleUpdate = (e: any) => callback(e.detail || getLocalVillas());
    const handleStorage = () => callback(getLocalVillas());
    
    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }

  const fetchVillas = async () => {
    try {
      const { data, error } = await supabase.from(TABLE).select('*');
      if (!error && data) {
        callback(data.map(mapFromDb));
      }
    } catch (e: any) {
      console.error("Critical Fetch Failure:", e.message || e);
    }
  };

  fetchVillas();
  const channel = supabase.channel('catalog-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      fetchVillas();
    })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const createVilla = async (villa: Omit<Villa, 'id'>): Promise<string> => {
  if (!isSupabaseAvailable) {
    const villas = getLocalVillas();
    const newVilla = { ...villa, id: generateUUID() } as Villa;
    saveLocalVillas([newVilla, ...villas]);
    return newVilla.id;
  }
  const payload = mapToDb(villa);
  const { data, error } = await supabase.from(TABLE).insert([payload]).select();
  if (error) throw handleDbError(error, TABLE);
  if (!data || data.length === 0) throw new Error("Insert failed: No data returned from Supabase.");
  return data[0].id;
};

export const updateVillaById = async (id: string, villa: Partial<Villa>): Promise<void> => {
  if (!isSupabaseAvailable) {
    const villas = getLocalVillas();
    const index = villas.findIndex(v => v.id === id);
    if (index !== -1) {
      villas[index] = { ...villas[index], ...villa };
      saveLocalVillas(villas);
    }
    return;
  }
  
  if (!isValidUUID(id)) {
    throw new Error(`The ID "${id}" is not a valid UUID.`);
  }

  const payload = mapToDb(villa);
  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};

export const deleteVillaById = async (id: string): Promise<void> => {
  if (!isSupabaseAvailable) {
    const localVillas = getLocalVillas();
    saveLocalVillas(localVillas.filter(v => v.id !== id));
    return;
  }
  
  if (!isValidUUID(id)) return;

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};

export const uploadMedia = async (file: File, folder: 'images' | 'videos', onProgress?: (percent: number) => void): Promise<string> => {
  if (!isSupabaseAvailable) {
    if (onProgress) onProgress(100);
    return URL.createObjectURL(file);
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${generateUUID()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  
  try {
    const { error } = await supabase.storage.from('villa-media').upload(filePath, file);
    if (error) {
       console.warn("Supabase Upload Failed, falling back to local ObjectURL", error);
       if (onProgress) onProgress(100);
       return URL.createObjectURL(file);
    }
    
    if (onProgress) onProgress(100);
    const { data: { publicUrl } } = supabase.storage.from('villa-media').getPublicUrl(filePath);
    return publicUrl;
  } catch (err) {
    console.error("Storage Error:", err);
    if (onProgress) onProgress(100);
    return URL.createObjectURL(file);
  }
};
