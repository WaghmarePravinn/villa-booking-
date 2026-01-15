
export const handleDbError = (error: any, tableName: string) => {
  if (!error) return null;
  
  const rawMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const msg = rawMsg.toLowerCase();
  
  // Storage specific errors
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

  // Database specific errors (RLS / Missing Tables / Missing Columns)
  if (msg.includes("relation") || msg.includes("policy") || msg.includes("access denied") || msg.includes("column") || msg.includes("no rows")) {
    return new Error(`[SUPABASE SCHEMA FIX REQUIRED]
    
Your database schema is out of sync. Please run this script in your Supabase SQL Editor:

-- 1. Ensure tables exist
CREATE TABLE IF NOT EXISTS profiles (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, username text UNIQUE, password text, email text, role text DEFAULT 'USER', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS villas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
    name text NOT NULL, 
    location text NOT NULL, 
    price_per_night numeric DEFAULT 0, 
    bedrooms int DEFAULT 0, 
    bathrooms int DEFAULT 0, 
    capacity int DEFAULT 0, 
    description text, 
    long_description text, 
    image_urls text[] DEFAULT '{}', 
    video_urls text[] DEFAULT '{}', 
    amenities text[] DEFAULT '{}', 
    included_services text[] DEFAULT '{}', 
    is_featured boolean DEFAULT false, 
    rating numeric DEFAULT 5, 
    rating_count int DEFAULT 0, 
    num_rooms int DEFAULT 0,
    meals_available boolean DEFAULT false,
    pet_friendly boolean DEFAULT false,
    refund_policy text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text, content text, avatar text, category text DEFAULT 'Trip', rating int DEFAULT 5, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS services (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, description text, icon text DEFAULT 'fa-concierge-bell', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, villa_id uuid, villa_name text, customer_name text, user_id uuid, source text DEFAULT 'Direct Inquiry', status text DEFAULT 'new', check_in date, check_out date, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS site_settings (id int PRIMARY KEY, active_theme text DEFAULT 'DEFAULT', promo_text text, whatsapp_number text, contact_email text, contact_phone text);

-- 2. Add missing columns to existing site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_phone text;

-- 3. Initialize/Update settings
INSERT INTO site_settings (id, active_theme, promo_text, whatsapp_number, contact_email, contact_phone) 
VALUES (1, 'DEFAULT', 'PEAK STAY EXCLUSIVE: BOOK YOUR LEGACY SANCTUARY TODAY', '+919157928471', 'peakstaydestination@gmail.com', '+919157928471') 
ON CONFLICT (id) DO UPDATE SET 
  whatsapp_number = EXCLUDED.whatsapp_number,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone;

-- 4. Enable RLS and Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_access" ON profiles; CREATE POLICY "public_access" ON profiles FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_access" ON villas; CREATE POLICY "public_access" ON villas FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_access" ON testimonials; CREATE POLICY "public_access" ON testimonials FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_access" ON services; CREATE POLICY "public_access" ON services FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_access" ON leads; CREATE POLICY "public_access" ON leads FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_access" ON site_settings; CREATE POLICY "public_access" ON site_settings FOR ALL USING (true) WITH CHECK (true);`);
  }

  return new Error(error.message || "A database error occurred. Check browser console.");
};
