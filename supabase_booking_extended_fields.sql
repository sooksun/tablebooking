-- =====================================================
-- SQL Script: เพิ่ม Extended Fields สำหรับ Bookings Table
-- =====================================================
-- รันใน Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 
-- Fields ที่เพิ่ม:
-- 1. donation - ยอดบริจาคเพิ่มเติม
-- 2. shirt_orders - รายการสั่งเสื้อ (JSONB array)
-- 3. shirt_delivery - วิธีรับเสื้อ (pickup/delivery)
-- 4. shirt_delivery_address - ที่อยู่จัดส่งเสื้อ
-- 5. e_donation_want - ต้องการใบอนุโมทนาบัตร
-- 6. e_donation_name - ชื่อสำหรับใบอนุโมทนาบัตร
-- 7. e_donation_address - ที่อยู่สำหรับใบอนุโมทนาบัตร
-- 8. e_donation_id - เลขประจำตัวผู้เสียภาษี/บัตรประชาชน
-- =====================================================

-- Step 1: เพิ่ม columns สำหรับข้อมูลบริจาคเพิ่มเติม
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS donation integer DEFAULT 0;

-- Step 2: เพิ่ม columns สำหรับข้อมูลเสื้อ
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shirt_orders jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shirt_delivery text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shirt_delivery_address text DEFAULT NULL;

-- Step 3: เพิ่ม columns สำหรับ E-Donation (ใบอนุโมทนาบัตร)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_want boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_name text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_address text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS e_donation_id text DEFAULT NULL;

-- Step 4: เพิ่ม Comments อธิบาย columns
COMMENT ON COLUMN public.bookings.donation IS 'ยอดบริจาคเพิ่มเติม (บาท)';
COMMENT ON COLUMN public.bookings.shirt_orders IS 'รายการสั่งเสื้อ JSON array [{type: "crew"|"polo", size: "S"|"M"|..., quantity: number}]';
COMMENT ON COLUMN public.bookings.shirt_delivery IS 'วิธีรับเสื้อ: pickup = รับเอง/รับหน้างาน, delivery = ส่งตามที่อยู่';
COMMENT ON COLUMN public.bookings.shirt_delivery_address IS 'ที่อยู่จัดส่งเสื้อ (เมื่อเลือก delivery)';
COMMENT ON COLUMN public.bookings.e_donation_want IS 'ต้องการใบอนุโมทนาบัตร (E-Donation) หรือไม่';
COMMENT ON COLUMN public.bookings.e_donation_name IS 'ชื่อสำหรับใบอนุโมทนาบัตร (ชื่อบุคคล/บริษัท/หจก.)';
COMMENT ON COLUMN public.bookings.e_donation_address IS 'ที่อยู่สำหรับใบอนุโมทนาบัตร';
COMMENT ON COLUMN public.bookings.e_donation_id IS 'เลขประจำตัวผู้เสียภาษี หรือ เลขบัตรประชาชน';

-- =====================================================
-- ตรวจสอบว่า columns ถูกเพิ่มสำเร็จ
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name IN (
    'donation', 
    'shirt_orders', 
    'shirt_delivery', 
    'shirt_delivery_address',
    'e_donation_want', 
    'e_donation_name', 
    'e_donation_address', 
    'e_donation_id'
  )
ORDER BY ordinal_position;

-- =====================================================
-- ถ้าต้องการดูข้อมูล booking ที่มีอยู่ (ทดสอบ)
-- =====================================================
-- SELECT 
--   id, 
--   user_name, 
--   phone, 
--   amount,
--   donation,
--   shirt_orders,
--   shirt_delivery,
--   shirt_delivery_address,
--   e_donation_want,
--   e_donation_name,
--   e_donation_address,
--   e_donation_id
-- FROM public.bookings
-- ORDER BY created_at DESC
-- LIMIT 10;
