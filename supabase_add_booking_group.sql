-- =====================================================
-- SQL Script: เพิ่ม booking_group_id สำหรับเชื่อมโยงโต๊ะที่จองพร้อมกัน
-- =====================================================
-- รันใน Supabase SQL Editor
-- =====================================================

-- เพิ่ม column booking_group_id
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_group_id uuid DEFAULT NULL;

-- Comment อธิบาย
COMMENT ON COLUMN public.bookings.booking_group_id IS 'UUID เชื่อมโยงโต๊ะที่จองพร้อมกัน (ถ้าจองหลายโต๊ะ จะมี group_id เดียวกัน)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON public.bookings(booking_group_id);

-- ตรวจสอบว่า column ถูกเพิ่มสำเร็จ
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name = 'booking_group_id';
