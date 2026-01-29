-- เพิ่มคอลัมน์ checked_in_at, food_received_at สำหรับลงทะเบียนเข้างาน / ยืนยันรับอาหาร
-- รันใน Supabase SQL Editor

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS food_received_at timestamptz;

COMMENT ON COLUMN public.bookings.checked_in_at IS 'เวลาเข้างาน (null = ยังไม่ลงทะเบียน)';
COMMENT ON COLUMN public.bookings.food_received_at IS 'เวลายืนยันรับอาหาร (null = ยังไม่รับ)';
