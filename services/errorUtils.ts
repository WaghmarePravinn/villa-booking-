
export const handleDbError = (error: any, tableName: string) => {
  if (!error) return null;
  
  const rawMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const msg = rawMsg.toLowerCase();
  
  // If we detect a missing table or policy error, show the setup script
  if (msg.includes("relation") || msg.includes("policy") || msg.includes("access denied") || msg.includes("column") || msg.includes("no rows")) {
    return new Error(`[SUPABASE SETUP REQUIRED]
    
Please run this script in your Supabase SQL Editor to fix the connection:

-- 1. Create essential tables
CREATE TABLE IF NOT EXISTS profiles (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, username text UNIQUE, password text, email text, role text DEFAULT 'USER', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS villas (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, location text, price_per_night numeric DEFAULT 0, bedrooms int, bathrooms int, capacity int, description text, long_description text, image_urls text[] DEFAULT '{}', video_urls text[] DEFAULT '{}', amenities text[] DEFAULT '{}', included_services text[] DEFAULT '{}', is_featured boolean DEFAULT false, rating numeric DEFAULT 5, rating_count int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS testimonials (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, content text, avatar text, rating int DEFAULT 5, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS services (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, description text, icon text DEFAULT 'fa-concierge-bell', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, villa_id uuid, villa_name text, customer_name text, user_id uuid, source text, status text DEFAULT 'new', check_in date, check_out date, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS site_settings (id int PRIMARY KEY, active_theme text, promo_text text);

-- 2. Initialize settings if they don't exist
INSERT INTO site_settings (id, active_theme, promo_text) 
VALUES (1, 'DEFAULT', 'PEAK STAY EXCLUSIVE: BOOK YOUR LEGACY SANCTUARY TODAY') 
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Public Access (Bypass RLS for now)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON villas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON testimonials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- 4. Create Admin User
INSERT INTO profiles (username, password, role) 
VALUES ('peakstayadmin', 'peakstayadmin', 'ADMIN')
ON CONFLICT (username) DO NOTHING;`);
  }

  return new Error(error.message || "A database error occurred. Check browser console.");
};
