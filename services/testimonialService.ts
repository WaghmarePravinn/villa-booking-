
import { supabase, isSupabaseAvailable } from "./supabase";
import { Testimonial } from "../types";
import { TESTIMONIALS } from "../constants";
import { handleDbError } from "./errorUtils";

const TABLE = "testimonials";

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
    callback(TESTIMONIALS);
    return () => {};
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
  if (!isSupabaseAvailable) return "local-rev";
  
  const { data, error } = await supabase
    .from(TABLE)
    .insert([review])
    .select();
  
  if (error) throw handleDbError(error, TABLE);
  return data[0].id;
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};
