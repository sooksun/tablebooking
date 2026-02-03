-- =====================================================
-- SQL Script: ลบและสร้าง Tables ใหม่ 117 ตัว (A-01 ถึง I-13)
-- =====================================================
-- รันใน Supabase SQL Editor
-- ⚠️ คำเตือน: Script นี้จะลบ tables และ bookings ทั้งหมด!
-- =====================================================

-- Step 1: ลบ bookings ทั้งหมดก่อน (เพราะมี foreign key)
DELETE FROM public.bookings;

-- Step 2: ลบ registrations ทั้งหมด
DELETE FROM public.registrations;

-- Step 3: ลบ tables ทั้งหมด
DELETE FROM public.tables;

-- Step 4: สร้าง tables ใหม่ 117 ตัว (9 แถว x 13 คอลัมน์)
-- A-01 ถึง A-13, B-01 ถึง B-13, ... , I-01 ถึง I-13
INSERT INTO public.tables (id, label, status, current_queue_count)
SELECT 
  row_number() OVER () as id,
  chr(65 + ((row_number() OVER () - 1) / 13)::int) || '-' || 
  lpad(((row_number() OVER () - 1) % 13 + 1)::text, 2, '0') as label,
  'AVAILABLE' as status,
  0 as current_queue_count
FROM generate_series(1, 117);

-- Step 5: รีเซ็ต sequence (ถ้ามี)
-- SELECT setval('public.tables_id_seq', 117, true);

-- =====================================================
-- ตรวจสอบผลลัพธ์
-- =====================================================
SELECT 'Total tables created:' as info, COUNT(*) as count FROM public.tables;

-- แสดง 10 ตัวแรก
SELECT id, label, status FROM public.tables ORDER BY id LIMIT 10;

-- แสดง 10 ตัวสุดท้าย
SELECT id, label, status FROM public.tables ORDER BY id DESC LIMIT 10;
