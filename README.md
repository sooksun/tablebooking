# Charity Gala Dinner - Table Reservation System

ระบบจองโต๊ะงานเลี้ยงการกุศล พัฒนาด้วย Next.js และ Supabase

## Features

- **Visual Table Map:** แสดงผังโต๊ะ 110 โต๊ะ (Grid 10x11) พร้อมระบบสี
- **Queue System:** ระบบ "1 Active + 2 Reserves" - แต่ละโต๊ะรับได้ 3 คิว
- **Payment:** ชำระเงินผ่าน QR Code PromptPay พร้อมอัปโหลดสลิป
- **Admin Dashboard:** ตรวจสอบและอนุมัติ/ปฏิเสธการจอง
- **Auto Queue Promotion:** เลื่อนคิวอัตโนมัติเมื่อคิวหลักถูกปฏิเสธ

## Color Coding

| สี | สถานะ |
|---|---|
| เขียว | ว่าง (0/3) |
| เหลือง | มีคิว 1 (1/3) |
| ส้ม | มีคิว 2 (2/3) |
| แดง | คิวเต็ม (3/3) |
| เทา | ขายแล้ว |

## Tech Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, Shadcn UI
- **Backend/Database:** Supabase (PostgreSQL, Storage)
- **State Management:** TanStack Query (React Query)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_USERNAME=your_admin_username
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

4. (Optional) To run DB reset from CLI, add Supabase **database** connection string to `.env.local`:

```env
DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Get it from: **Supabase Dashboard → Project Settings → Database → Connection string (URI)**.

5. Run database migrations (already applied if using existing Supabase project)

6. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Security

- ใส่ **Admin username/password** ใน `.env.local` (ห้าม commit ค่าจริงลง git)
- สลิป: จำกัดเฉพาะ JPG/PNG/WebP ไม่เกิน 5 MB
- แนะนำให้เปิด **Supabase RLS** และกำหนดนโยบายให้ `tables`/`bookings` อ่านได้ทุกคน แต่เขียน/อัปเดตเฉพาะจากแอปหรือ service role ตามที่ออกแบบ

### Reset tables (9×13 = 117 tables)

**Option A – From terminal (needs `DATABASE_URL` in `.env.local`):**

```bash
npm run db:reset
```

**Option B – In Supabase:** Open **SQL Editor**, paste the contents of `reset_tables_117.sql`, then run.

### ตารางลงทะเบียนไม่จองโต๊ะ (Registrations)

สำหรับเก็บข้อมูลผู้ลงทะเบียนแบบไม่จองโต๊ะ (บริจาค/สั่งเสื้ออย่างเดียว): ใน **Supabase → SQL Editor** ให้รันไฟล์ `supabase_registrations_table.sql` ครั้งเดียวเพื่อสร้างตาราง `registrations` และ RLS policies

### คอลัมน์ลงทะเบียนเข้างาน / รับอาหาร (Check-in) และ QR บนตั๋ว

- ตั๋วมี **QR Code** (encode `booking_id`) สำหรับสแกนลงทะเบียนเข้างาน
- หน้า **ลงทะเบียนเข้างาน** (`/check-in`):
  - **สแกน QR / รหัส:** สแกน QR ด้วยกล้อง หรือกรอก/พิมพ์รหัสการจอง แล้วกดลงทะเบียน
  - **แผนผัง เข้าร่วมงาน:** แผนผัง 117 โต๊ะ คลิกโต๊ะ → popup modal แสดงข้อมูลเจ้าของ → อ่านชื่อยืนยัน → กด &quot;ยืนยัน เข้าร่วมงาน&quot;
  - **แผนผัง รับอาหาร:** แผนผัง 117 โต๊ะ คลิกโต๊ะ → popup modal → ฝ่ายบริการอ่านชื่อยืนยัน → กด &quot;ยืนยัน การรับอาหาร&quot; → จ่ายอาหารให้คนยกไปโต๊ะ
- รัน `supabase_checkin_column.sql` ใน Supabase เพื่อเพิ่มคอลัมน์ `checked_in_at` และ `food_received_at` ในตาราง `bookings`

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page (Table Grid)
│   ├── admin/
│   │   └── page.tsx      # Admin Dashboard
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── TableGrid.tsx     # Table visualization
│   ├── BookingModal.tsx  # Booking form modal
│   └── AdminDashboard.tsx
├── lib/
│   ├── api.ts            # API functions
│   ├── supabase.ts       # Supabase client
│   ├── providers.tsx     # React Query provider
│   └── utils.ts          # Utility functions
└── types/
    └── database.ts       # TypeScript types
```

## Database Schema

### tables
- `id` (int): Primary Key (1-110)
- `label` (text): Display name (e.g., "A-01")
- `status` (text): 'AVAILABLE', 'PENDING', 'BOOKED'
- `current_queue_count` (int): 0-3

### bookings
- `id` (uuid): Primary Key
- `table_id` (int): FK to tables
- `user_name`, `phone` (text): Contact info
- `amount` (numeric): Total amount
- `slip_url` (text): Payment slip URL
- `status` (text): 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'WAITING_LIST', 'CANCELLED_BY_SYSTEM'
- `queue_position` (int): 1-3

## Queue Logic

### Approval Flow
1. Admin approves Queue #1
2. Table status → 'BOOKED'
3. Queue #2, #3 → 'CANCELLED_BY_SYSTEM'

### Rejection Flow
1. Admin rejects Queue #1
2. Queue #2 → Position 1 + 'PENDING_VERIFICATION'
3. Queue #3 → Position 2

## Scripts

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run ESLint
```

## Docker (รันบน Ubuntu / Linux)

แอปใช้ Next.js standalone ใน multi-stage Docker image

### ขั้นตอน

1. สร้าง `.env` จาก `.env.example` แล้วใส่ค่า Supabase (และ Admin ถ้าใช้):

   ```bash
   cp .env.example .env
   # แก้ .env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Build และรัน:

   ```bash
   docker compose up -d --build
   ```

   Build args อ่านจาก `.env` (docker compose โหลดให้อัตโนมัติ)  
   แอปจะ listen ที่พอร์ต **3000**

3. หยุด:

   ```bash
   docker compose down
   ```

### ไฟล์ที่เกี่ยวข้อง

- `Dockerfile` — Multi-stage build (deps → builder → runner), Node 20 Alpine
- `docker-compose.yml` — Service `app` build + expose 3000
- `.dockerignore` — ไม่ส่ง `node_modules`, `.next`, `.env*` 等 เข้า build context
- `.env.example` — ตัวอย่างตัวแปรที่ต้องใช้

### หมายเหตุ

- รันบน Ubuntu ได้โดยตรง (`docker compose` / `docker-compose` ต้องมี)
- ต้องมี Docker Engine และ Docker Compose v2+

## License

MIT
