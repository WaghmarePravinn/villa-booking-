
import { supabase, isSupabaseAvailable } from "./supabase";
import { Lead } from "../types";
import { handleDbError } from "./errorUtils";

const TABLE = "leads";

const mapFromDb = (l: any): Lead => ({
  id: l.id,
  villaId: l.villa_id,
  villaName: l.villa_name,
  timestamp: l.created_at || new Date().toISOString(),
  status: l.status || 'new',
  source: l.source || 'Direct Inquiry',
  userId: l.user_id,
  customerName: l.customer_name,
  checkIn: l.check_in,
  checkOut: l.check_out
});

const mapToDb = (l: Partial<Lead>) => {
  const payload: any = {};
  if (l.villaId !== undefined) payload.villa_id = l.villaId;
  if (l.villaName !== undefined) payload.villa_name = l.villaName;
  if (l.source !== undefined) payload.source = l.source;
  if (l.status !== undefined) payload.status = l.status;
  if (l.userId !== undefined) payload.user_id = l.userId;
  if (l.customerName !== undefined) payload.customer_name = l.customerName;
  if (l.checkIn !== undefined) payload.check_in = l.checkIn;
  if (l.checkOut !== undefined) payload.check_out = l.checkOut;
  return payload;
};

export const subscribeToLeads = (callback: (leads: Lead[]) => void, userId?: string) => {
  if (!isSupabaseAvailable) {
    const saved = localStorage.getItem('peak_stay_leads_sandbox');
    const localLeads = saved ? JSON.parse(saved) : [];
    const filtered = userId ? localLeads.filter((l: any) => l.userId === userId) : localLeads;
    callback(filtered);
    return () => {};
  }

  const fetchLeads = async () => {
    // Fixed: Removed .order('created_at')
    let query = supabase.from(TABLE).select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (!error && data) callback(data.map(mapFromDb));
  };

  fetchLeads();
  const channel = supabase.channel('leads-realtime').on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => fetchLeads()).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const saveLead = async (lead: Omit<Lead, 'id' | 'timestamp' | 'status'>): Promise<string> => {
  if (!isSupabaseAvailable) {
    const saved = localStorage.getItem('peak_stay_leads_sandbox');
    const localLeads = saved ? JSON.parse(saved) : [];
    const newLead = { 
      ...lead, 
      id: Math.random().toString(36).substr(2, 9), 
      timestamp: new Date().toISOString(), 
      status: 'new' 
    };
    localStorage.setItem('peak_stay_leads_sandbox', JSON.stringify([newLead, ...localLeads]));
    return newLead.id;
  }
  const payload = mapToDb({ ...lead, status: 'new' });
  const { data, error } = await supabase.from(TABLE).insert([payload]).select();
  if (error) throw handleDbError(error, TABLE);
  return data[0].id;
};

export const updateLeadStatus = async (id: string, status: Lead['status']): Promise<void> => {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};

export const deleteLead = async (id: string): Promise<void> => {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw handleDbError(error, TABLE);
};
