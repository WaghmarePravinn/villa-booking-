
import { supabase, isSupabaseAvailable } from "./supabase";
import { Service } from "../types";
import { SERVICES } from "../constants";
import { handleDbError } from "./errorUtils";

const TABLE = "services";

const mapFromDb = (s: any): Service => ({
  id: s.id,
  title: s.title || "Untitled Service",
  description: s.description || "",
  icon: s.icon || "fa-concierge-bell"
});

export const subscribeToServices = (callback: (services: Service[]) => void) => {
  if (!isSupabaseAvailable) {
    callback(SERVICES);
    return () => {};
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true });
      if (!error && data) {
        callback(data.map(mapFromDb));
      } else {
        callback(SERVICES);
      }
    } catch (e) {
      callback(SERVICES);
    }
  };

  fetchServices();
  const channel = supabase.channel('services-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => fetchServices())
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const createService = async (service: Omit<Service, 'id'>): Promise<string> => {
  if (!isSupabaseAvailable) return "local-id";
  const { data, error } = await supabase.from(TABLE).insert([service]).select();
  if (error) throw handleDbError(error, TABLE);
  return data[0].id;
};

export const updateService = async (id: string, service: Partial<Service>): Promise<void> => {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from(TABLE).update(service).eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};

export const deleteService = async (id: string): Promise<void> => {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};
