
export const handleDbError = (error: any, tableName: string) => {
  if (!error) return null;
  
  const rawMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const msg = rawMsg.toLowerCase();
  
  if (msg.includes("relation") || msg.includes("policy") || msg.includes("access denied") || msg.includes("column")) {
    return new Error(`[Supabase Robust Master Migration] 
    
Copy and run this in your Supabase SQL Editor. 
This script ensures ALL tables and columns exist correctly:

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (id uuid DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'USER';

-- 2. VILLAS
CREATE TABLE IF NOT EXISTS villas (id uuid DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE villas ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS price_per_night numeric DEFAULT 0;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE villas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. TESTIMONIALS
CREATE TABLE IF NOT EXISTS testimonials (id uuid DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating int DEFAULT 5;

-- 4. SERVICES (New)
CREATE TABLE IF NOT EXISTS services (id uuid DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE services ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon text DEFAULT 'fa-concierge-bell';
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 5. LEADS
CREATE TABLE IF NOT EXISTS leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS villa_name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 6. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (id int PRIMARY KEY);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS promo_text text;

-- ENABLE RLS ON ALL
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- UNIVERSAL POLICIES (Safe Cleanup)
DROP POLICY IF EXISTS "p_all" ON profiles; CREATE POLICY "p_all" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "v_all" ON villas; CREATE POLICY "v_all" ON villas FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "t_all" ON testimonials; CREATE POLICY "t_all" ON testimonials FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "s_all" ON services; CREATE POLICY "s_all" ON services FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "l_all" ON leads; CREATE POLICY "l_all" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "st_all" ON site_settings; CREATE POLICY "st_all" ON site_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- RESET ADMIN
DELETE FROM profiles WHERE username = 'peakstayadmin';
INSERT INTO profiles (username, password, role) VALUES ('peakstayadmin', 'peakstayadmin', 'ADMIN');`);
  }

  return new Error(error.message || "A database error occurred. Check browser console.");
};
