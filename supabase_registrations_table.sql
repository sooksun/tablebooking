-- ตารางเก็บข้อมูล "ลงทะเบียนแบบไม่จองโต๊ะ" (บริจาค/สั่งเสื้ออย่างเดียว)
-- รันใน Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  phone text NOT NULL,
  donation int NOT NULL DEFAULT 0,
  shirt_orders jsonb NOT NULL DEFAULT '[]',
  shirt_delivery text NOT NULL DEFAULT 'pickup',
  shirt_delivery_address text,
  e_donation_want boolean NOT NULL DEFAULT false,
  e_donation_name text,
  e_donation_address text,
  e_donation_id text,
  total_amount int NOT NULL DEFAULT 0,
  slip_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- เปิด RLS และอนุญาตให้ anon อ่าน/เขียน (หรือกำหนด policy ตามที่ต้องการ)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ทุกคน insert (สำหรับฟอร์มลงทะเบียน)
CREATE POLICY "Allow insert registrations" ON public.registrations
  FOR INSERT WITH CHECK (true);

-- อนุญาตให้ authenticated หรือ service role อ่าน (Admin ใช้ anon + อาจมี service key)
-- ถ้า Admin ใช้ anon key ให้เปิดอ่านได้
CREATE POLICY "Allow read registrations" ON public.registrations
  FOR SELECT USING (true);

COMMENT ON TABLE public.registrations IS 'ลงทะเบียนแบบไม่จองโต๊ะ: บริจาค/สั่งเสื้ออย่างเดียว';
