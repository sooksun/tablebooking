-- =====================================================
-- SQL Script: ตรวจสอบ Database Schema
-- =====================================================
-- รันใน Supabase SQL Editor เพื่อตรวจสอบว่า columns มีอยู่หรือไม่
-- =====================================================

-- ตรวจสอบ columns ทั้งหมดใน bookings table
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- =====================================================
-- ถ้า columns เหล่านี้ไม่มี ให้รัน supabase_booking_extended_fields.sql
-- =====================================================
-- columns ที่ต้องมี:
-- - donation (integer)
-- - shirt_orders (jsonb)
-- - shirt_delivery (text)
-- - shirt_delivery_address (text)
-- - e_donation_want (boolean)
-- - e_donation_name (text)
-- - e_donation_address (text)
-- - e_donation_id (text)
-- =====================================================
