-- เพิ่ม fields ขยายสำหรับ bookings table
-- รันใน Supabase SQL Editor

-- เพิ่ม columns สำหรับข้อมูลเพิ่มเติม
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS donation integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shirt_orders jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shirt_delivery text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shirt_delivery_address text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_want boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_name text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_address text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_id text DEFAULT NULL;

-- Comments
COMMENT ON COLUMN public.bookings.donation IS 'ยอดบริจาคเพิ่มเติม (บาท)';
COMMENT ON COLUMN public.bookings.shirt_orders IS 'รายการสั่งเสื้อ JSON array [{type, size, quantity}]';
COMMENT ON COLUMN public.bookings.shirt_delivery IS 'วิธีรับเสื้อ: pickup = รับเอง, delivery = ส่งตามที่อยู่';
COMMENT ON COLUMN public.bookings.shirt_delivery_address IS 'ที่อยู่จัดส่งเสื้อ';
COMMENT ON COLUMN public.bookings.e_donation_want IS 'ต้องการใบอนุโมทนาบัตร';
COMMENT ON COLUMN public.bookings.e_donation_name IS 'ชื่อสำหรับใบอนุโมทนาบัตร';
COMMENT ON COLUMN public.bookings.e_donation_address IS 'ที่อยู่สำหรับใบอนุโมทนาบัตร';
COMMENT ON COLUMN public.bookings.e_donation_id IS 'เลขบัตรประชาชนสำหรับใบอนุโมทนาบัตร';
