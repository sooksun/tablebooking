# คู่มือการติดตั้ง Tablebooking บน Ubuntu 24.04 LTS (Docker)

ติดตั้งแอป **Charity Gala Table Booking** (Next.js + Supabase) **ใน Docker** ที่โฟลเดอร์  
**`/DATA/AppData/www/tablebooking`**

> **สำคัญ:** หัวข้อ **§1 การตรวจสอบก่อนติดตั้ง** ต้องทำและผ่านทุกข้อก่อน จึงเริ่มติดตั้ง Docker และ clone โปรเจกต์  
> **จุดประสงค์:** ป้องกัน **การลงซ้ำ** และป้องกัน **ทำให้ software ตัวเดิมพัง** (เขียนทับ โฟลเดอร์/container เดิม)

---

## การรันคำสั่งผ่าน WinSCP

ถ้าคุณใช้ **WinSCP** จาก Windows เพื่อเชื่อมต่อเข้า Ubuntu ให้รันคำสั่งในคู่มือผ่าน **Terminal** ของ WinSCP ดังนี้

1. เปิด **WinSCP** → ล็อกอินเข้าเซิร์ฟเวอร์ Ubuntu (โปรโตคอล SFTP หรือ SCP, พอร์ต 22)
2. เปิด **Terminal:** เมนู **Commands** → **Open Terminal** (หรือกด **Ctrl+T** หรือคลิกขวาที่โฟลเดอร์ → **Open in Terminal**)
3. ในหน้าต่าง Terminal จะเป็น shell บน Ubuntu — **copy คำสั่งจากคู่มือแล้ว paste ลงไป** แล้วกด Enter
4. รันคำสั่ง **ทีละบล็อก** (ทีละกล่อง ```bash ... ``` ในคู่มือ) แล้วดูผลลัพธ์ก่อนไปขั้นถัดไป
5. คำสั่งที่ต้องใช้ `sudo` อาจถามรหัสผ่าน — ให้ใส่รหัสผู้ใช้ Ubuntu

**หมายเหตุ:** ถ้า paste ทั้งหลายบรรทัดแล้วไม่รัน ให้ลอง paste ทีละคำสั่ง หรือเลือกคำสั่งแล้วกด Enter เอง

**ชุดคำสั่งที่จัดกลุ่มสำหรับ copy-paste ผ่าน WinSCP** อยู่ที่ **ภาคผนวก ก** ด้านท้ายคู่มือ

---

## 1. การตรวจสอบก่อนติดตั้ง (ต้องทำก่อน)

**ให้รันตรวจสอบทีละข้อด้านล่าง ถ้าไม่ผ่านหรือเจอ "มีการติดตั้งอยู่แล้ว" ต้องจัดการตามที่ระบุ — ห้ามข้ามขั้น**

---

### ⚠️ 1.0 ตรวจว่ามีการติดตั้ง tablebooking อยู่แล้วหรือไม่ (ป้องกันลงซ้ำ / ทำลายตัวเดิม)

รันชุดคำสั่งด้านล่าง **ก่อน** ทำขั้นตอนอื่นใด

```bash
# ตรวจว่ามีโฟลเดอร์แอปและไฟล์สำคัญอยู่แล้วหรือไม่
APP_DIR="/DATA/AppData/www/tablebooking"
if [ -d "$APP_DIR" ]; then
  echo ">>> พบโฟลเดอร์แอปอยู่แล้ว: $APP_DIR"
  [ -f "$APP_DIR/docker-compose.yml" ] && echo "    - มี docker-compose.yml (น่าจะเป็นโปรเจกต์นี้)"
  [ -f "$APP_DIR/package.json" ]       && echo "    - มี package.json"
  echo ">>> ถ้าจะติดตั้งใหม่: ต้อง backup หรือย้ายโฟลเดอร์เดิมก่อน แล้วค่อย clone ใหม่"
  echo ">>> ถ้าแค่อัปเดต: ไปที่โฟลเดอร์นี้แล้วรัน git pull แล้ว docker compose up -d --build (ดู §12)"
else
  echo "OK: ยังไม่มีโฟลเดอร์ $APP_DIR — ลงใหม่ได้"
fi

# ตรวจว่ามี container ของโปรเจกต์นี้รันอยู่หรือไม่ (รันจากโฟลเดอร์ tablebooking)
docker ps --format "{{.Names}}\t{{.Ports}}" 2>/dev/null | grep -E "9900|tablebooking" && echo ">>> มี container ใช้พอร์ต 9900 หรือชื่อ tablebooking — อาจเป็นตัวเดิมรันอยู่" || true
```

**ถ้าผลลัพธ์บอกว่า "พบโฟลเดอร์แอปอยู่แล้ว" หรือ "มี container … รันอยู่":**

- **ห้าม** รัน `git clone … tablebooking` ซ้ำใน path เดิม — จะเขียนทับของเดิมและมีโอกาสทำให้แอปเดิมพัง
- **ให้เลือกทำอย่างใดอย่างหนึ่ง:**
  1. **แค่อัปเดตโค้ด:** เข้าโฟลเดอร์เดิม → `git pull` → `docker compose up -d --build` (ดู §12)
  2. **ติดตั้งใหม่จริงๆ:** backup โฟลเดอร์เดิม (หรือย้ายไปที่อื่น) แล้วลบ/เปลี่ยนชื่อโฟลเดอร์ `tablebooking` ให้ว่าง จากนั้นค่อย clone ใหม่ตามคู่มือ

**เมื่อตรวจแล้วว่า "ยังไม่มีโฟลเดอร์" หรือ "จัดการตัวเดิมแล้ว"** จึงไปข้อ 1.1 ต่อ

---

### 1.1 ตรวจสอบระบบปฏิบัติการ

```bash
cat /etc/os-release | grep -E "^(NAME|VERSION_ID)="
```

- ต้องเป็น **Ubuntu 24.04** หรือ **22.04** (VERSION_ID="24.04" หรือ "22.04")
- ถ้าเป็นตัวอื่น อาจใช้ได้แต่คำสั่งในคู่มือทดสอบกับ Ubuntu

### 1.2 ตรวจสอบสิทธิ์ sudo

```bash
sudo -n true 2>/dev/null && echo "OK: มีสิทธิ์ sudo" || echo "FAIL: ไม่มีสิทธิ์ sudo หรือต้องใส่รหัส"
```

- ต้องได้ข้อความ **OK: มีสิทธิ์ sudo** จึงจะติดตั้งแพ็กเกจได้

### 1.3 ตรวจสอบพื้นที่ดิสก์

```bash
df -h /DATA 2>/dev/null || df -h /
```

- โฟลเดอร์ที่จะใช้ (เช่น `/DATA` หรือ `/`) ควรเหลืออย่างน้อย **2 GB** สำหรับ image และ build
- ถ้ายังไม่มี `/DATA` จะใช้ partition หลัก (/) — ตรวจที่คอลัมน์ **Avail**

### 1.4 ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต

```bash
curl -s -o /dev/null -w "%{http_code}" https://download.docker.com 2>/dev/null || echo "ไม่มี curl หรือติดต่อไม่ได้"
curl -s -o /dev/null -w "%{http_code}" https://github.com 2>/dev/null
```

- ต้องได้รหัส **200** หรือ **301/302** (ใช้ได้)
- ถ้าไม่มี `curl`: รัน `sudo apt update && sudo apt install -y curl` ก่อน

### 1.5 ตรวจสอบพอร์ต 9900 ว่าง (ป้องกันลงทับตัวเดิมที่รันอยู่)

```bash
sudo ss -tlnp | grep :9900 || echo "OK: พอร์ต 9900 ว่าง"
```

- ต้องได้ข้อความ **OK: พอร์ต 9900 ว่าง**
- **ถ้ามีบรรทัดแสดง process:** แปลว่าพอร์ต 9900 ถูกใช้แล้ว — อาจเป็น **tablebooking ตัวเดิมที่รันอยู่**  
  - **ห้าม** รันติดตั้ง/ลงซ้ำโดยไม่หยุดตัวเดิมก่อน (เสี่ยงทำให้พังหรือ port conflict)  
  - ถ้าจะลงใหม่: ไปที่โฟลเดอร์เดิม → `docker compose down` แล้วค่อยทำตามข้อ 1.0 (backup/ย้าย)  
  - ถ้าแค่อัปเดต: ใช้ `docker compose up -d --build` ในโฟลเดอร์เดิม (ดู §12)

### 1.6 ตรวจสอบโฟลเดอร์ปลายทาง (ป้องกัน clone ทับของเดิม)

```bash
# โฟลเดอร์พ่อต้องมีและเขียนได้ — ต้องยังไม่มี tablebooking ข้างใน (ตรวจใน 1.0 แล้ว)
sudo mkdir -p /DATA/AppData/www
ls -la /DATA/AppData/www 2>/dev/null && echo "โฟลเดอร์พร้อม"
test ! -d /DATA/AppData/www/tablebooking && echo "OK: ยังไม่มี tablebooking — clone ได้" || echo ">>> มี tablebooking อยู่แล้ว — ดูข้อ 1.0 ห้าม clone ทับ"
```

- ถ้า `ls` ขึ้น permission denied ให้รัน: `sudo chown "$USER:$USER" /DATA/AppData/www`
- **ถ้ามี `tablebooking` อยู่แล้ว:** ห้าม `git clone … tablebooking` ใน path เดิม — กลับไปทำตามข้อ 1.0 (backup/ย้าย หรืออัปเดต)

### 1.7 ตรวจสอบ Supabase (ก่อนใส่ใน .env)

- เข้า **Supabase Dashboard** → โปรเจกต์ของคุณ
- **Project Settings → API**: มี **Project URL** และ **anon public** key
- เก็บสองค่านี้ไว้สำหรับใส่ใน `.env` ตอนติดตั้ง
- ถ้ายังไม่มีโปรเจกต์: สร้างโปรเจกต์ใหม่ก่อน แล้วรัน SQL ตามหัวข้อ "ฐานข้อมูล Supabase" ในคู่มือ

### 1.8 สรุป: เช็คลิสต์ก่อนติดตั้ง (ป้องกันลงซ้ำ + ป้องกันทำลายตัวเดิม)

| ลำดับ | รายการ | คำสั่ง/การตรวจ | ผลที่ต้องการ |
|-------|--------|-----------------|--------------|
| **1.0** | **มีแอป/container เดิมหรือไม่** | ดู §1.0 — ตรวจโฟลเดอร์ + `docker ps` | ยังไม่มี หรือ backup/ย้าย/อัปเดตแล้ว |
| 1.1 | OS | `cat /etc/os-release \| grep VERSION_ID` | 24.04 หรือ 22.04 |
| 1.2 | sudo | `sudo -n true && echo OK` | OK |
| 1.3 | พื้นที่ดิสก์ | `df -h /` หรือ `df -h /DATA` | เหลือ ≥ 2 GB |
| 1.4 | อินเทอร์เน็ต | `curl -sI https://github.com` | HTTP 200/301/302 |
| 1.5 | พอร์ต 9900 | `ss -tlnp \| grep 9900` | ไม่มีผลลัพธ์ (ว่าง — ไม่มีตัวเดิมรันอยู่) |
| 1.6 | โฟลเดอร์ + ไม่มี tablebooking | `test ! -d .../tablebooking` | ยังไม่มีโฟลเดอร์ tablebooking (ห้าม clone ทับ) |
| 1.7 | Supabase | เปิด Dashboard → API | มี URL + anon key |

**เมื่อครบทุกข้อแล้ว** (โดยเฉพาะ 1.0 และ 1.5–1.6 ต้องไม่มีการติดตั้ง/รันอยู่ที่ path เดิม) จึงไปขั้นตอนถัดไป (ติดตั้ง Docker)

---

**สรุป: ป้องกันลงซ้ำ และป้องกันทำลาย software เดิม**

- **§1.0:** ตรวจว่ามีโฟลเดอร์แอปหรือ container รันอยู่หรือไม่ → ถ้ามี ต้อง **backup/ย้าย** หรือใช้วิธี **อัปเดต** (§12) ห้าม clone ทับ
- **§1.5:** พอร์ต 9900 ต้องว่าง → ถ้ามี process อยู่ มักเป็นตัวเดิม รันอยู่ ห้ามลงซ้ำโดยไม่หยุด/จัดการก่อน
- **§1.6:** ต้องยังไม่มีโฟลเดอร์ `tablebooking` ใน path ปลายทาง → ห้าม `git clone` ทับของเดิม

---

## 2. สิ่งที่ต้องมีก่อนติดตั้ง

- Ubuntu 24.04 LTS (หรือ 22.04) — ตรวจแล้วในหัวข้อ 1
- บัญชี Supabase และโปรเจกต์ที่สร้างแล้ว (มี URL + anon key)
- ผู้ใช้ที่มีสิทธิ์ `sudo`

**ไม่ต้องติดตั้ง Node.js บนเครื่อง** — แอปรันใน Docker container

---

## 3. ติดตั้ง Docker และ Docker Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"
```

**ออกจาก session แล้วล็อกอินใหม่** (หรือรัน `newgrp docker`) เพื่อให้ใช้กลุ่ม `docker` ได้

ตรวจสอบ:

```bash
docker --version
docker compose version
```

---

## 4. ติดตั้ง Git และ Clone โปรเจกต์

```bash
sudo apt install -y git
```

สร้างโฟลเดอร์และ clone (ทำเฉพาะเมื่อ **§1.0 และ §1.6 ผ่านแล้ว — ยังไม่มีโฟลเดอร์ tablebooking**):

```bash
sudo mkdir -p /DATA/AppData/www
sudo chown "$USER:$USER" /DATA/AppData/www

cd /DATA/AppData/www
# ห้าม clone ถ้ามี tablebooking อยู่แล้ว — จะเขียนทับของเดิม (ดู §1.0)
git clone https://github.com/sooksun/tablebooking.git tablebooking
cd tablebooking
```

โฟลเดอร์แอป: **`/DATA/AppData/www/tablebooking`**

---

## 5. สร้างไฟล์ `.env`

Docker Compose อ่าน `.env` เพื่อส่งค่าให้ build (NEXT_PUBLIC_*) และรันแอป

```bash
cd /DATA/AppData/www/tablebooking
cp .env.example .env
nano .env
```

แก้ค่าให้ตรงกับโปรเจกต์ Supabase ของคุณ:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

บันทึก (Ctrl+O, Enter) แล้วออก (Ctrl+X)

---

## 6. Build และรันแอปด้วย Docker

```bash
cd /DATA/AppData/www/tablebooking
docker compose up -d --build
```

- Build ครั้งแรกอาจใช้เวลาสักพัก
- แอปจะ listen ที่พอร์ต **9900** (ใน container ใช้ 3000, map ออกเป็น 9900)

เปิดเบราว์เซอร์ที่ **`http://<IP-เครื่อง>:9900`**

---

## 7. คำสั่ง Docker ที่ใช้บ่อย

| คำสั่ง | ความหมาย |
|--------|-----------|
| `docker compose up -d --build` | Build (ถ้ามีการเปลี่ยน) และรันในพื้นหลัง |
| `docker compose ps` | ดูสถานะ container |
| `docker compose logs -f` | ดู log แบบ realtime |
| `docker compose restart` | รัน container ใหม่ |
| `docker compose down` | หยุดและลบ container |

ตัวอย่างดู log:

```bash
cd /DATA/AppData/www/tablebooking
docker compose logs -f
```

กด Ctrl+C เพื่อออกจาก log

---

## 8. ฐานข้อมูล Supabase (ต้องทำก่อนใช้งาน)

ทำใน **Supabase Dashboard → SQL Editor**:

1. **ตาราง `tables` / `bookings`**  
   ใช้ schema ตามโปรเจกต์ หรือรัน `reset_tables_117.sql` ถ้ามี

2. **คอลัมน์ Check-in**  
   รัน `supabase_checkin_column.sql` เพื่อเพิ่ม `checked_in_at`, `food_received_at` ใน `bookings`

3. **ตารางลงทะเบียนไม่จองโต๊ะ**  
   รัน `supabase_registrations_table.sql` เพื่อสร้างตาราง `registrations`

4. **Storage bucket `slips`**  
   สร้าง bucket ชื่อ `slips` สำหรับอัปโหลดสลิป (ตั้งค่า public ตาม RLS)

---

## 9. Nginx เป็น Reverse Proxy (ทางเลือก)

ถ้าต้องการเข้าผ่านพอร์ต 80/443 หรือใช้โดเมน:

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/tablebooking
```

เนื้อหา (เปลี่ยน `your-domain.com` ตามจริง):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:9900;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

เปิดใช้และ reload:

```bash
sudo ln -s /etc/nginx/sites-available/tablebooking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS: ติดตั้ง Certbot แล้วรัน `sudo certbot --nginx -d your-domain.com`

---

## 10. Firewall (ถ้าเปิด UFW)

เข้าผ่าน Nginx (80/443):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

เข้าผ่านพอร์ต 9900 โดยตรง:

```bash
sudo ufw allow 9900/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 11. สรุป path และคำสั่ง (Docker)

| รายการ | ค่า |
|--------|-----|
| โฟลเดอร์แอป | `/DATA/AppData/www/tablebooking` |
| ไฟล์ env | `.env` |
| พอร์ตแอป (host) | 9900 |
| รัน | `docker compose up -d --build` |
| หยุด | `docker compose down` |
| ดู log | `docker compose logs -f` |

---

## 12. แก้ปัญหาเบื้องต้น

**Build ขึ้น `WARN... variable is not set` หรือ `NEXT_PUBLIC_SUPABASE_*` เป็นค่าว่าง**

- Docker Compose อ่าน `.env` ในโฟลเดอร์แอปเพื่อส่งเข้า build
- ต้องมีไฟล์ `.env` ที่ `/DATA/AppData/www/tablebooking/.env` และมีอย่างน้อย:
  - `NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`
- สร้างจาก `.env.example`: `cp .env.example .env` แล้ว `nano .env` แก้ค่า (ดู §5)
- แก้แล้วรัน `docker compose up -d --build` ใหม่

**Build ล้ม `Cannot find module 'typescript'` / `Failed to transpile next.config.ts`**

- Dockerfile ปรับแล้ว: builder ติดตั้ง `npm ci` เอง (มี TypeScript) ไม่ copy จาก stage อื่น
- ให้ `git pull` ดึงโค้ดล่าสุด แล้วรัน `docker compose up -d --build` ใหม่
- **ถ้ายังไม่ผ่าน** (มักเพราะ Docker ใช้ cache เก่า): รัน **`docker compose build --no-cache`** แล้ว **`docker compose up -d`**

**แอปไม่ขึ้น / เข้าไม่ได้**

- ตรวจว่า container รัน: `docker compose ps`
- ดู log: `docker compose logs -f`
- ตรวจว่าพอร์ต 9900 ไม่ถูกโปรแกรมอื่นใช้: `sudo ss -tlnp | grep 9900`

**ไม่เห็นข้อมูล / error Supabase**

- ตรวจ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใน `.env`
- แก้ `.env` แล้วต้อง build ใหม่: `docker compose down` แล้ว `docker compose up -d --build`

**อัปเดตโค้ดจาก Git (ไม่ลงซ้ำ — แก้เฉพาะตัวที่ติดตั้งแล้ว)**

ใช้เมื่อ **มีแอปติดตั้งอยู่แล้ว** (โฟลเดอร์สร้างจาก `git clone`) และต้องการดึงโค้ดล่าสุด — **ห้าม** clone ใหม่ทับโฟลเดอร์เดิม

```bash
cd /DATA/AppData/www/tablebooking
git pull
docker compose up -d --build
```

**โฟลเดอร์ไม่ใช่ git repository (git pull ไม่ได้ / docker compose ไม่พบไฟล์)**

ถ้ารัน `git pull` แล้วขึ้น **`fatal: not a git repository`** หรือ `docker compose` ขึ้น **configuration file provided: not found** แปลว่าโฟลเดอร์ `/DATA/AppData/www/tablebooking` **ไม่ได้สร้างจาก `git clone`** (อาจอัปโหลดหรือคัดลอกไฟล์มา) จึงไม่มี `.git` และไม่มี `docker-compose.yml` ครบ

**วิธีแก้: ให้ clone ใหม่เป็น git repo แล้วค่อย pull ได้**

1. Backup ไฟล์ `.env` (ถ้ามี — เก็บค่า Supabase ไว้):

```bash
cp /DATA/AppData/www/tablebooking/.env /tmp/tablebooking.env.bak 2>/dev/null || true
```

2. ย้ายโฟลเดอร์เดิมออก (หรือลบถ้าไม่ต้องการ):

```bash
sudo mv /DATA/AppData/www/tablebooking /DATA/AppData/www/tablebooking.old
```

3. Clone ใหม่จาก GitHub:

```bash
cd /DATA/AppData/www
git clone https://github.com/sooksun/tablebooking.git tablebooking
cd tablebooking
```

4. คืนค่า `.env` (ถ้า backup ไว้):

```bash
cp /tmp/tablebooking.env.bak /DATA/AppData/www/tablebooking/.env 2>/dev/null || true
```

ถ้าไม่มี `.env` ให้สร้างจาก `.env.example` แล้วแก้ค่า Supabase (ดู §5)

5. Build และรัน:

```bash
cd /DATA/AppData/www/tablebooking
docker compose up -d --build
```

หลังนี้โฟลเดอร์จะเป็น git repository — ครั้งถัดไปใช้ `git pull` แล้ว `docker compose up -d --build` ได้ตามปกติ

---

## ภาคผนวก ก: ชุดคำสั่งสำหรับ WinSCP (copy-paste ทีละบล็อก)

รันผ่าน WinSCP Terminal: **copy ทั้งบล็อก → paste ใน Terminal → Enter**  
ทำทีละบล็อกตามลำดับ และดูผลลัพธ์ก่อนไปขั้นถัดไป

---

### คำสั่ง git pull ลง server ที่ /DATA/AppData/www/tablebooking

ใช้เมื่อแอปติดตั้งอยู่แล้ว และต้องการดึงโค้ดล่าสุดจาก GitHub แล้ว build/รันใหม่

```bash
cd /DATA/AppData/www/tablebooking
git pull
docker compose up -d --build
```

- **บรรทัด 1:** เข้าโฟลเดอร์แอปบน server  
- **บรรทัด 2:** ดึงโค้ดล่าสุดจาก repo (sooksun/tablebooking)  
- **บรรทัด 3:** build image ใหม่ (ถ้ามีการเปลี่ยน) และรัน container ที่พอร์ต 9900  

รันใน WinSCP Terminal หรือ SSH ได้เลย

**ถ้าขึ้น `fatal: not a git repository`** แปลว่าโฟลเดอร์นี้ไม่ได้สร้างจาก `git clone` (อาจอัปโหลด/คัดลอกมา) → ใช้วิธี **"แก้ปัญหา: โฟลเดอร์ไม่ใช่ git repository"** ใน §12

---

**บล็อก 1 — ตรวจว่ามีแอป/container เดิมหรือไม่ (§1.0)**  
ถ้าขึ้น "พบโฟลเดอร์แอปอยู่แล้ว" หรือ "มี container" ห้าม clone ทับ ดู §1.0

```bash
APP_DIR="/DATA/AppData/www/tablebooking"
if [ -d "$APP_DIR" ]; then
  echo ">>> พบโฟลเดอร์แอปอยู่แล้ว: $APP_DIR"
  [ -f "$APP_DIR/docker-compose.yml" ] && echo "    - มี docker-compose.yml"
  [ -f "$APP_DIR/package.json" ]       && echo "    - มี package.json"
  echo ">>> ห้าม clone ทับ — ใช้วิธีอัปเดต (§12) หรือ backup/ย้ายก่อน"
else
  echo "OK: ยังไม่มีโฟลเดอร์ — ลงใหม่ได้"
fi
docker ps --format "{{.Names}}\t{{.Ports}}" 2>/dev/null | grep -E "9900|tablebooking" && echo ">>> มี container รันอยู่" || echo "OK: ไม่มี container ใช้พอร์ต 9900"
```

---

**บล็อก 2 — ตรวจ OS, sudo, ดิสก์, อินเทอร์เน็ต, พอร์ต 9900 (§1.1–1.5)**

```bash
echo "=== OS ===" && cat /etc/os-release | grep -E "^(NAME|VERSION_ID)="
echo "=== sudo ===" && sudo -n true 2>/dev/null && echo "OK: มีสิทธิ์ sudo" || echo "FAIL: sudo"
echo "=== ดิสก์ ===" && df -h /DATA 2>/dev/null || df -h /
echo "=== อินเทอร์เน็ต ===" && curl -s -o /dev/null -w "docker.com=%{http_code} " https://download.docker.com && curl -s -o /dev/null -w "github.com=%{http_code}\n" https://github.com
echo "=== พอร์ต 9900 ===" && sudo ss -tlnp | grep :9900 || echo "OK: พอร์ต 9900 ว่าง"
```

---

**บล็อก 3 — ติดตั้ง Docker และ Docker Compose (§3)**  
รันเมื่อตรวจ §1 ผ่านแล้ว (ใช้เวลาสักครู่)

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
echo "เสร็จแล้ว — ออกจาก WinSCP แล้วล็อกอินใหม่ แล้วค่อยรันบล็อกถัดไป"
```

---

**บล็อก 4 — ติดตั้ง Git, สร้างโฟลเดอร์, clone (§4)**  
รันหลังล็อกอินใหม่ (และเมื่อตรวจ §1.0, §1.6 แล้วว่าไม่มี tablebooking)

```bash
sudo apt install -y git
sudo mkdir -p /DATA/AppData/www
sudo chown "$USER:$USER" /DATA/AppData/www
cd /DATA/AppData/www
git clone https://github.com/sooksun/tablebooking.git tablebooking
cd tablebooking
pwd
ls -la
```

---

**บล็อก 5 — สร้างไฟล์ .env (§5)**  
หลังรันบรรทัดแรก ให้แก้ค่าใน nano (ใส่ URL + anon key จาก Supabase) แล้ว Ctrl+O, Enter, Ctrl+X

```bash
cd /DATA/AppData/www/tablebooking
cp .env.example .env
nano .env
```

---

**บล็อก 6 — Build และรันแอปด้วย Docker (§6)**

```bash
cd /DATA/AppData/www/tablebooking
docker compose up -d --build
```

เปิดเบราว์เซอร์ที่ `http://<IP-เครื่อง>:9900`

---

**บล็อก 7 — อัปเดต (เมื่อติดตั้งอยู่แล้ว ไม่ลงซ้ำ)**  
ใช้เมื่อมีแอปอยู่แล้ว แค่อยากดึงโค้ดล่าสุด

```bash
cd /DATA/AppData/www/tablebooking
git pull
docker compose up -d --build
```

---

*อัปเดตล่าสุด: ติดตั้งด้วย Docker บน Ubuntu 24, โฟลเดอร์ /DATA/AppData/www/tablebooking, รันคำสั่งผ่าน WinSCP ได้*
