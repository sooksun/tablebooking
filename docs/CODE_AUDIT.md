# รายงานตรวจสอบความถูกต้องของระบบจองโต๊ะ (System Audit)

**วันที่ตรวจสอบ:** มกราคม 2026  
**สถานะ Build:** ✅ ผ่าน (`npm run build` สำเร็จ)

---

## 1. สรุปผลการตรวจสอบ

| หัวข้อ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| Production Build | ✅ | Compile และ TypeScript ผ่าน |
| Data Flow & Logic | ✅ | สอดคล้องกัน |
| Database Schema | ✅ | Types ตรงกับ Supabase |
| การจองโต๊ะ | ✅ | ครบวงจร |
| ลงทะเบียนไม่จองโต๊ะ | ✅ | รวม slip, E Donation, เสื้อ |
| Check-in & รับอาหาร | ✅ | กฎเข้างานก่อนรับอาหาร |
| Admin | ✅ | อนุมัติ/ปฏิเสธ/Memo |
| ดูตั๋ว (Ticket) | ✅ | QR, พิมพ์ PDF |
| Docker | ✅ | พร้อม deploy port 9900 |
| สีใน Legend | ✅ | แก้ไขเพิ่ม "รออนุมัติ" (เหลือง) |

---

## 2. Data Flow

### 2.1 แหล่งข้อมูล

| แหล่ง | ใช้ที่ | รายละเอียด |
|-------|--------|-------------|
| **Supabase** | ทุกหน้า | `tables`, `bookings`, `registrations`, storage `slips` |
| **Env** | Build-time | `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_ADMIN_*` |

### 2.2 API → React Query → UI

| Function | Query Key | ใช้ใน |
|----------|-----------|--------|
| `fetchTables()` | `['tables']` | หน้าแรก, Check-in, BookingModal |
| `fetchBookingsByPhone()` | `['ticket-by-phone', phone]` | /ticket |
| `fetchPendingBookings()` | `['bookings','pending']` | Admin |
| `fetchAllBookings()` | `['bookings','all']` | Admin |
| `fetchRegistrations()` | `['registrations']` | Admin |

หลัง mutation ทุกครั้งมีการ `invalidateQueries` ให้ cache อัปเดต

### 2.3 การจองหลายโต๊ะ

- โต๊ะแรก: ยอด = `BASE_PRICE + donation + shirt + deliveryFee`
- โต๊ะถัดไป: ยอด = `BASE_PRICE` ต่อโต๊ะ
- สลิป 1 ใบ ใช้ร่วมทุก booking
- แต่ละโต๊ะถูก insert เป็น booking แยก และ table ถูกอัปเดตเป็น PENDING

---

## 3. Logic ที่สำคัญ

### 3.1 กฎ "จ่ายอาหารได้เมื่อเข้างานแล้ว"

- **UI:** `canConfirmFood = APPROVED && !!checked_in_at && !food_received_at`
- **API (`confirmFoodReceived`):** ตรวจ `checked_in_at` ก่อนอัปเดต `food_received_at`
- กันการยืนยันรับอาหารโดยไม่ผ่าน check-in ทั้งจาก UI และ API

### 3.2 Slip Upload

| กรณี | แสดงส่วนอัปโหลด | บังคับอัปโหลด |
|------|------------------|---------------|
| จองโต๊ะ | ✅ | ✅ |
| ไม่จองโต๊ะ + ยอด > 0 | ✅ | ✅ |
| ไม่จองโต๊ะ + ยอด = 0 | ✅ | ไม่บังคับ |

### 3.3 Authentication

| หน้า | วิธี | ค่าเริ่มต้น |
|------|------|-------------|
| Check-in | Hardcoded | admin / admin |
| Admin | Env vars | `NEXT_PUBLIC_ADMIN_USERNAME` / `NEXT_PUBLIC_ADMIN_PASSWORD` |

**หมายเหตุ:** ถ้าไม่ตั้งค่า Admin env จะ login ไม่ได้ (ต้องมีค่าใน .env)

---

## 4. Grid & Layout

- **TableGrid / CheckInTableGrid:** 9 แถว × 13 คอลัมน์ = 117 โต๊ะ
- **Labels:** A-01 ถึง I-13 (ตรงกับ `reset_tables_9x13.sql`)
- **fetchTables:** order by `id` ascending → slice ตาม row

---

## 5. SQL Scripts ที่ต้องรัน

| ไฟล์ | วัตถุประสงค์ |
|------|--------------|
| `supabase_checkin_column.sql` | เพิ่ม `checked_in_at`, `food_received_at` ใน bookings |
| `supabase_registrations_table.sql` | สร้างตาราง `registrations` |
| `reset_tables_9x13.sql` | รีเซ็ตโต๊ะเป็น 117 โต๊ะ (A-01 ถึง I-13) |

---

## 6. ไฟล์สำคัญ

| ไฟล์ | บทบาท |
|------|--------|
| `src/lib/api.ts` | ทุก API calls ไป Supabase |
| `src/lib/constants.ts` | `TABLE_BASE_PRICE` (3500) |
| `src/types/database.ts` | Types สำหรับ Table, Booking, Registration |
| `src/components/BookingModal.tsx` | ฟอร์มจอง/ลงทะเบียน, slip, เสื้อ, E Donation |
| `src/components/TableGrid.tsx` | ผังโต๊ะหน้าแรก (เลือกจอง) |
| `src/components/CheckInTableGrid.tsx` | ผังโต๊ะหน้า Check-in |
| `src/components/FoodQueueList.tsx` | คิวโต๊ะรับอาหาร |

---

## 7. สีใน Check-in (แผนผัง)

| สี | ความหมาย |
|----|----------|
| เหลือง | รออนุมัติ (PENDING_VERIFICATION) |
| ส้ม | จองแล้ว (APPROVED, ยังไม่เข้างาน) |
| น้ำเงิน | เข้าร่วมงานแล้ว |
| ม่วง | รับอาหารแล้ว |
| เทา | ว่าง |

---

## 8. ข้อควรระวังก่อน Production

1. **Env:** ตั้งค่า `.env` จาก `.env.example` ให้ครบ
2. **Supabase:** รัน SQL scripts ให้ครบ และตรวจสอบ RLS policy
3. **Storage:** สร้าง bucket `slips` และตั้ง policy ให้อ่าน/เขียนได้
4. **Security:** Check-in และ Admin ใช้ client-side auth เท่านั้น — เหมาะ internal / งานภายใน

---

## 9. สรุป

ระบบ logic และ data flow สอดคล้องกัน build ผ่าน พร้อม deploy ใน Docker ตาม `docs/INSTALL_UBUNTU24.md`
