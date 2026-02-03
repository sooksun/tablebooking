-- =====================================================
-- SQL Script: Reset Database (ลบข้อมูลทั้งหมด)
-- =====================================================
-- รันใน Supabase SQL Editor
-- ⚠️ คำเตือน: Script นี้จะลบข้อมูลทั้งหมด!
-- =====================================================

-- Step 1: ลบข้อมูลใน bookings ทั้งหมด
DELETE FROM public.bookings;

-- Step 2: ลบข้อมูลใน registrations ทั้งหมด (ถ้ามี)
DELETE FROM public.registrations;

-- Step 3: รีเซ็ต tables ให้เป็นสถานะว่าง
UPDATE public.tables SET 
  status = 'AVAILABLE',
  current_queue_count = 0;

-- Step 4: ลบไฟล์ใน storage bucket 'slips' (ต้องทำผ่าน Supabase Dashboard > Storage)
-- หรือรัน SQL นี้ (ถ้ามี policy อนุญาต):
-- DELETE FROM storage.objects WHERE bucket_id = 'slips';

-- =====================================================
-- ตรวจสอบผลลัพธ์
-- =====================================================
SELECT 'Bookings count:' as info, COUNT(*) as count FROM public.bookings
UNION ALL
SELECT 'Registrations count:', COUNT(*) FROM public.registrations
UNION ALL
SELECT 'Available tables:', COUNT(*) FROM public.tables WHERE status = 'AVAILABLE';

-- =====================================================
-- ถ้าต้องการลบ tables แล้วสร้างใหม่ 117 ตัว (A-01 ถึง I-13)
-- =====================================================
-- DELETE FROM public.tables;
-- 
-- INSERT INTO public.tables (id, label, status, current_queue_count)
-- SELECT 
--   row_number() OVER () as id,
--   chr(65 + ((row_number() OVER () - 1) / 13)) || '-' || 
--   lpad(((row_number() OVER () - 1) % 13 + 1)::text, 2, '0') as label,
--   'AVAILABLE' as status,
--   0 as current_queue_count
-- FROM generate_series(1, 117);
