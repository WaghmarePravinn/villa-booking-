
export const handleDbError = (error: any, tableName: string) => {
  if (!error) return null;
  
  const rawMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const msg = rawMsg.toLowerCase();
  
  // Generic Setup Help for new Supabase Projects with robust policy handling
  if (msg.includes("relation") || msg.includes("policy") || msg.includes("access denied") || msg.includes("column")) {
    return new Error(`[Supabase Robust Initialization Script] 
    
Copy and run this in your Supabase SQL Editor. 
This script drops existing policies first to avoid "already exists" errors:

-- 1. TABLES SETUP
CREATE TABLE IF NOT EXISTS profiles (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, username text UNIQUE, password text, email text, role text);
CREATE TABLE IF NOT EXISTS villas (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, location text, price_per_night numeric, bedrooms int, bathrooms int, capacity int, description text, long_description text, image_urls text[], video_urls text[], amenities text[], included_services text[], is_featured boolean DEFAULT false, num_rooms int, meals_available boolean DEFAULT false, pet_friendly boolean DEFAULT false, refund_policy text, rating numeric DEFAULT 5, rating_count int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS testimonials (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, content text, rating int, avatar text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, villa_id uuid, villa_name text, customer_name text, user_id uuid, source text, status text DEFAULT 'new', check_in date, check_out date, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS site_settings (id int PRIMARY KEY, active_theme text, promo_text text);

-- 2. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES (CLEAN RECREATION)
DROP POLICY IF EXISTS "p_all" ON profiles; CREATE POLICY "p_all" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "v_all" ON villas; CREATE POLICY "v_all" ON villas FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "t_all" ON testimonials; CREATE POLICY "t_all" ON testimonials FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "l_all" ON leads; CREATE POLICY "l_all" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "s_all" ON site_settings; CREATE POLICY "s_all" ON site_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. INITIAL SEED
INSERT INTO site_settings (id, active_theme, promo_text) VALUES (1, 'REPUBLIC_DAY', 'REPUBLIC DAY SPECIAL: FLAT 26% OFF') ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (username, password, role) VALUES ('peakstayadmin', 'peakstayadmin', 'ADMIN') ON CONFLICT (username) DO NOTHING;`);
  }

  return new Error(error.message || "A database error occurred. Check browser console.");
};
