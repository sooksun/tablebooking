# รายงานตรวจสอบความสมบูรณ์ของ Code และ Data Flow (ก่อน Production Build)

## 1. สรุปผลการตรวจสอบ

- **Production build:** ผ่าน (`npm run build` สำเร็จ)
- **Logic & data flow:** สอดคล้องกัน มีการแก้ไขเสริม 1 จุด (backend ตรวจ `checked_in_at` ก่อนยืนยันรับอาหาร)

---

## 2. Data Flow

### 2.1 แหล่งข้อมูลหลัก

| แหล่ง | ใช้ที่ | บันทึก |
|-------|--------|--------|
| **Supabase** | ทุกหน้า | `tables`, `bookings`, `registrations`, storage `slips` |
| **Env** | Build-time | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ADMIN_*` |

### 2.2 API → React Query → UI

- **`fetchTables()`** → `queryKey: ['tables']`  
  - ใช้ใน: หน้าแรก (`TableGrid`), หน้า check-in (`CheckInTableGrid`), `BookingModal`  
  - ดึง `tables` + `bookings` (PENDING_VERIFICATION, APPROVED) แล้ว map เป็น `current_booking` ต่อโต๊ะ  
- **`fetchBookingsByPhone`** → `queryKey: ['ticket-by-phone', phone]`  
  - ใช้ใน: หน้า /ticket  
- **`fetchPendingBookings`** / **`fetchAllBookings`** → `['bookings','pending']` / `['bookings','all']`  
  - ใช้ใน: Admin  
- **`fetchRegistrations`** → `['registrations']`  
  - ใช้ใน: Admin  

หลัง mutation (จอง, อนุมัติ/ปฏิเสธ, check-in, ยืนยันรับอาหาร) มีการ `invalidateQueries` สำหรับ `['tables']` และ/หรือ `['bookings']` ทำให้ทุกหน้าที่ใช้ cache เดียวกันได้ข้อมูลล่าสุด

### 2.3 Types สอดคล้องกับ DB

- `src/types/database.ts`: `Table`, `Booking` (รวม `checked_in_at`, `food_received_at`), `Registration`, `RegistrationShirtOrder`  
- API ใช้ type เหล่านี้และ cast จากการตอบของ Supabase สอดคล้องกับการใช้งานใน components

---

## 3. Logic ที่ตรวจและแก้ไข

### 3.1 กฎ "จ่ายอาหารได้เมื่อเข้างานแล้ว"

- **UI (check-in page):**  
  - `canConfirmFood = APPROVED && !!checked_in_at && !food_received_at`  
  - ปุ่ม "ยืนยัน การรับอาหาร" เปิดเฉพาะเมื่อเข้างานแล้ว แสดงข้อความ "ต้องเข้างานก่อน" เมื่อยังไม่เข้างาน  
- **API (`confirmFoodReceived`):**  
  - เพิ่มตรวจ `!b.checked_in_at` แล้ว `throw new Error('ต้องเข้างานก่อน จึงจะยืนยันการรับอาหารได้')`  
  - สอดคล้องกับ UI และกันการยืนยันรับอาหารจาก API โดยตรงโดยไม่ผ่าน check-in

### 3.2 อื่นๆ

- การจอง: ตรวจ `status`, `current_queue_count` ของโต๊ะก่อน insert booking  
- Check-in: ตรวจ `status === 'APPROVED'`, `!checked_in_at`  
- อนุมัติ/ปฏิเสธ: อัปเดตทั้ง `bookings` และ `tables` ครบ  
- สลิป: จำกัด type ขนาด และอัปโหลดไป Supabase storage `slips`

---

## 4. สิ่งที่ควรทำก่อน/หลัง Production

1. **Env**  
   - ใช้ `.env.example` เป็นแม่แบบ สร้าง `.env` หรือ `.env.local` ไม่ commit ค่าจริง  
   - Production ต้องมี `NEXT_PUBLIC_SUPABASE_*` และ `NEXT_PUBLIC_ADMIN_*` (ถ้าใช้)

2. **Supabase**  
   - รัน `supabase_checkin_column.sql` ให้มี `checked_in_at`, `food_received_at`  
   - รัน `supabase_registrations_table.sql` ถ้าใช้ registrations  
   - เปิด RLS และตั้งนโยบายให้อ่าน/เขียนตรงกับที่แอปใช้

3. **Security**  
   - Check-in page ใช้ hardcoded login (admin/admin) เหมาะแค่ dev/internal  
   - Admin ใช้ `NEXT_PUBLIC_ADMIN_*` เป็น client-side check ถ้า production ควรมี backend auth

4. **Docker**  
   - Build ต้องมี env สำหรับ `NEXT_PUBLIC_*` (ดู README ส่วน Docker)

---

## 5. สรุป

- Code และ data flow สอดคล้องกัน build ผ่าน  
- เพิ่มการตรวจ `checked_in_at` ใน `confirmFoodReceived` ให้ตรงกับกฎ "จ่ายอาหารได้เมื่อเข้างานแล้ว"  
- พร้อม build production และรันใน Docker ตามขั้นตอนใน README
