
export const handleDbError = (error: any, tableName: string) => {
  if (!error) return null;
  
  const rawMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const msg = rawMsg.toLowerCase();
  
  if (tableName === 'storage' && (msg.includes("bucket") || msg.includes("not found") || msg.includes("forbidden") || msg.includes("policy"))) {
    return new Error(`[SUPABASE STORAGE SETUP REQUIRED]
    
The "villa-media" bucket is missing or restricted. 
Please run this in your Supabase SQL Editor:

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('villa-media', 'villa-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable Public Access & Uploads (RLS)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'villa-media');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'villa-media');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'villa-media');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'villa-media');`);
  }

  if (msg.includes("relation") || msg.includes("policy") || msg.includes("access denied") || msg.includes("column") || msg.includes("no rows") || msg.includes("site_settings")) {
    return new Error(`[SUPABASE SCHEMA FIX REQUIRED]
    
Your database schema is out of sync or the "${tableName}" table is missing. 
Please run this script in your Supabase SQL Editor:

-- 1. Core Tables Definition
CREATE TABLE IF NOT EXISTS public.villas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text NULL,
  price_per_night numeric NULL DEFAULT 0,
  bedrooms integer NULL DEFAULT 0,
  bathrooms integer NULL DEFAULT 0,
  capacity integer NULL DEFAULT 0,
  description text NULL,
  long_description text NULL,
  image_url text NULL,
  amenities text[] NULL DEFAULT '{}',
  included_services text[] NULL DEFAULT '{}',
  is_featured boolean NULL DEFAULT false,
  rating numeric NULL DEFAULT 5,
  rating_count integer NULL DEFAULT 0,
  meals_available boolean NULL DEFAULT true,
  pet_friendly boolean NULL DEFAULT true,
  refund_policy text NULL,
  owner_id uuid NULL,
  image_urls text[] NULL DEFAULT '{}',
  video_urls text[] NULL DEFAULT '{}',
  num_rooms integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, username text UNIQUE, password text, email text, role text DEFAULT 'USER', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS testimonials (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, content text, avatar text, category text DEFAULT 'Trip', rating int DEFAULT 5, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS services (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, description text, icon text DEFAULT 'fa-concierge-bell', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, villa_id uuid, villa_name text, customer_name text, user_id uuid, source text DEFAULT 'Direct Inquiry', status text DEFAULT 'new', check_in date, check_out date, created_at timestamptz DEFAULT now());

-- 2. Correct site_settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY, 
  active_theme text DEFAULT 'DEFAULT', 
  promo_text text, 
  whatsapp_number text, 
  contact_email text, 
  contact_phone text, 
  site_logo text, 
  primary_color text, 
  offer_popup jsonb
);

-- Seed site_settings if empty
INSERT INTO site_settings (id, promo_text) VALUES (1, 'WELCOME TO PEAK STAY') ON CONFLICT DO NOTHING;

-- 3. Enable RLS and Open Access (Development)
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
CREATE POLICY "public_access" ON site_settings FOR ALL USING (true) WITH CHECK (true);`);
  }

  return new Error(error.message || `A database error occurred in ${tableName}.`);
};
