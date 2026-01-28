
import { supabase, isSupabaseAvailable } from "./supabase";
import { GoogleGenAI } from "@google/genai";

export interface DiagnosticResult {
  id: string;
  name: string;
  status: 'pending' | 'healthy' | 'degraded' | 'offline';
  message: string;
  latency?: number;
}

export const runFullDiagnostics = async (): Promise<DiagnosticResult[]> => {
  const startTime = Date.now();
  const results: DiagnosticResult[] = [
    { id: 'supabase_client', name: 'Supabase Initialization', status: 'pending', message: 'Checking client configuration...' },
    { id: 'db_villas', name: 'Database: Villas Table', status: 'pending', message: 'Verifying table access...' },
    { id: 'db_settings', name: 'Database: Site Settings', status: 'pending', message: 'Verifying configuration persistence...' },
    { id: 'storage', name: 'Cloud Storage: Media Bucket', status: 'pending', message: 'Testing asset bucket access...' },
    { id: 'gemini', name: 'Gemini AI: API Gateway', status: 'pending', message: 'Pinging AI model...' },
  ];

  const updateResult = (id: string, update: Partial<DiagnosticResult>) => {
    const idx = results.findIndex(r => r.id === id);
    if (idx !== -1) results[idx] = { ...results[idx], ...update };
  };

  // 1. Client Init
  if (isSupabaseAvailable) {
    updateResult('supabase_client', { status: 'healthy', message: 'Client initialized with valid credentials.' });
  } else {
    updateResult('supabase_client', { status: 'offline', message: 'Client using local sandbox mode (Key/URL missing).' });
  }

  // 2. Database: Villas
  if (isSupabaseAvailable) {
    try {
      const start = Date.now();
      const { error } = await supabase.from('villas').select('id', { count: 'exact', head: true });
      const latency = Date.now() - start;
      if (error) throw error;
      updateResult('db_villas', { status: 'healthy', message: `Connected. Response time: ${latency}ms`, latency });
    } catch (err: any) {
      updateResult('db_villas', { status: 'offline', message: err.message || 'Table not found or RLS restricted.' });
    }
  } else {
    updateResult('db_villas', { status: 'degraded', message: 'Running in LocalStorage mode.' });
  }

  // 3. Database: Settings
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase.from('site_settings').select('id').eq('id', 1).single();
      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" (PGRST116), it means table exists but empty
      updateResult('db_settings', { status: 'healthy', message: 'Configuration table is reachable.' });
    } catch (err: any) {
      updateResult('db_settings', { status: 'offline', message: 'Settings table inaccessible.' });
    }
  }

  // 4. Storage
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase.storage.from('villa-media').list('', { limit: 1 });
      if (error) throw error;
      updateResult('storage', { status: 'healthy', message: 'Asset bucket is online and public.' });
    } catch (err: any) {
      updateResult('storage', { status: 'offline', message: 'Bucket "villa-media" not found or permissions missing.' });
    }
  }

  // 5. Gemini AI
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const start = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
      config: { maxOutputTokens: 5 }
    });
    const latency = Date.now() - start;
    if (response.text) {
      updateResult('gemini', { status: 'healthy', message: `Model responsive. Latency: ${latency}ms`, latency });
    } else {
      throw new Error("Empty response from model.");
    }
  } catch (err: any) {
    updateResult('gemini', { status: 'offline', message: 'AI Key invalid or API quota exceeded.' });
  }

  return results;
};
