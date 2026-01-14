
export const handleDbError = (error: any, tableName: string) => {
  if (!error) return null;
  
  const rawMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const msg = rawMsg.toLowerCase();
  
  if (msg.includes("relation") || msg.includes("policy") || msg.includes("access denied") || msg.includes("column") || msg.includes("no rows")) {
    return new Error(`[Supabase Ultimate Access Script] 
    
Copy and run this in your Supabase SQL Editor. 
This script ensures ALL tables exist and RLS Policies allow data flow:

-- 1. TABLE CREATION
CREATE TABLE IF NOT EXISTS profiles (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, username text UNIQUE, password text, email text, role text DEFAULT 'USER');
CREATE TABLE IF NOT EXISTS villas (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, location text, price_per_night numeric DEFAULT 0, bedrooms int, bathrooms int, capacity int, description text, long_description text, image_urls text[] DEFAULT '{}', video_urls text[] DEFAULT '{}', amenities text[] DEFAULT '{}', included_services text[] DEFAULT '{}', is_featured boolean DEFAULT false, rating numeric DEFAULT 5, rating_count int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS testimonials (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, content text, avatar text, rating int DEFAULT 5, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS services (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, description text, icon text DEFAULT 'fa-concierge-bell', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, villa_id uuid, villa_name text, customer_name text, user_id uuid, source text, status text DEFAULT 'new', check_in date, check_out date, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS site_settings (id int PRIMARY KEY, active_theme text, promo_text text);

-- 2. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 3. CREATE UNIVERSAL ANON POLICIES
DROP POLICY IF EXISTS "anon_all_profiles" ON profiles; CREATE POLICY "anon_all_profiles" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_villas" ON villas; CREATE POLICY "anon_all_villas" ON villas FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_testimonials" ON testimonials; CREATE POLICY "anon_all_testimonials" ON testimonials FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_services" ON services; CREATE POLICY "anon_all_services" ON services FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_leads" ON leads; CREATE POLICY "anon_all_leads" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_settings" ON site_settings; CREATE POLICY "anon_all_settings" ON site_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. INITIAL SEED
INSERT INTO site_settings (id, active_theme, promo_text) VALUES (1, 'REPUBLIC_DAY', 'REPUBLIC DAY SPECIAL: FLAT 26% OFF ON ALL STAYS') ON CONFLICT (id) DO NOTHING;

-- 5. RESET ADMIN
DELETE FROM profiles WHERE username = 'peakstayadmin';
INSERT INTO profiles (username, password, role) VALUES ('peakstayadmin', 'peakstayadmin', 'ADMIN');`);
  }

  return new Error(error.message || "A database error occurred. Check browser console.");
};
