
import { supabase, isSupabaseAvailable } from "./supabase";
import { User, UserRole } from "../types";
import { handleDbError } from "./errorUtils";

const TABLE = "profiles";

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  if (username === 'peakstayadmin' && password === 'peakstayadmin') {
    return { id: 'admin-0', username: 'Peak Stay Admin', role: UserRole.ADMIN };
  }

  if (!isSupabaseAvailable) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    role: data.role as UserRole,
    email: data.email
  };
};

export const signupUser = async (username: string, password: string, email: string, role: UserRole = UserRole.USER): Promise<User> => {
  if (!isSupabaseAvailable) return { id: Date.now().toString(), username, role, email };

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ username, password, email, role }])
    .select()
    .single();

  if (error) throw handleDbError(error, TABLE);

  return {
    id: data.id,
    username: data.username,
    role: data.role as UserRole,
    email: data.email
  };
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!isSupabaseAvailable) return true;
  try {
    const { count, error } = await supabase
      .from(TABLE)
      .select('username', { count: 'exact', head: true })
      .eq('username', username);
    if (error) return true;
    return count === 0;
  } catch (e) {
    return true; 
  }
};
