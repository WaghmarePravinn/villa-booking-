
import { supabase, isSupabaseAvailable } from "./supabase";
import { Testimonial } from "../types";
import { TESTIMONIALS } from "../constants";
import { handleDbError } from "./errorUtils";

const TABLE = "testimonials";
const LOCAL_STORAGE_KEY = 'peak_stay_testimonials_sandbox';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getLocalTestimonials = (): Testimonial[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return TESTIMONIALS;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return TESTIMONIALS;
  }
};

const saveLocalTestimonials = (data: Testimonial[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('peak_stay_testimonials_updated'));
};

const mapFromDb = (t: any): Testimonial => ({
  id: t.id,
  name: t.name || "Guest",
  content: t.content || "",
  rating: Number(t.rating || 5),
  avatar: t.avatar || `https://i.pravatar.cc/150?u=${t.id}`,
  category: (t.category as Testimonial['category']) || 'Trip',
  timestamp: t.created_at || new Date().toISOString()
});

export const subscribeToTestimonials = (callback: (data: Testimonial[]) => void) => {
  if (!isSupabaseAvailable) {
    callback(getLocalTestimonials());
    const handleUpdate = () => callback(getLocalTestimonials());
    window.addEventListener('peak_stay_testimonials_updated', handleUpdate);
    return () => window.removeEventListener('peak_stay_testimonials_updated', handleUpdate);
  }

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) callback(data.map(mapFromDb));
    } catch (err) {
      console.error("Testimonials Fetch Error:", err);
      callback(TESTIMONIALS);
    }
  };

  fetchTestimonials();

  const channel = supabase
    .channel('public:testimonials')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => fetchTestimonials())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const addTestimonial = async (review: Omit<Testimonial, 'id' | 'timestamp'>): Promise<string> => {
  if (!isSupabaseAvailable) {
    const local = getLocalTestimonials();
    const newTestimonial: Testimonial = {
      ...review,
      id: generateUUID(),
      timestamp: new Date().toISOString()
    };
    saveLocalTestimonials([newTestimonial, ...local]);
    return newTestimonial.id;
  }
  
  const { data, error } = await supabase
    .from(TABLE)
    .insert([review])
    .select();
  
  if (error) throw handleDbError(error, TABLE);
  return data[0].id;
};

export const updateTestimonial = async (id: string, testimonial: Partial<Testimonial>): Promise<void> => {
  if (!isSupabaseAvailable) {
    const local = getLocalTestimonials();
    const index = local.findIndex(t => t.id === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...testimonial };
      saveLocalTestimonials(local);
    }
    return;
  }
  const { error } = await supabase
    .from(TABLE)
    .update(testimonial)
    .eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  if (!isSupabaseAvailable) {
    const local = getLocalTestimonials();
    saveLocalTestimonials(local.filter(t => t.id !== id));
    return;
  }
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};
