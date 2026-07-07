-- ============================================================
--  ก่อนกระแส · Early Winner Radar — Supabase schema
--  วิธีใช้: เปิด Supabase Dashboard → SQL Editor → New query
--  วางทั้งไฟล์นี้ แล้วกด Run (ครั้งเดียวพอ)
-- ============================================================

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  emoji       text default '🛍️',
  name        text not null,
  cat         text not null default 'อื่น ๆ',
  price       numeric not null default 0,
  cost        numeric not null default 0,
  sales       integer not null default 0,   -- ยอดขาย 7 วัน (ชิ้น)
  trend       numeric not null default 0,    -- % โตจากสัปดาห์ก่อน (WoW)
  creators    integer not null default 0,    -- จำนวนครีเอเตอร์ที่ทำคลิป
  shops       integer not null default 0,    -- จำนวนร้านที่ขาย
  reviews     integer not null default 0,
  rating      numeric not null default 0,
  days        integer not null default 0,    -- ลงขายมากี่วัน
  live_share  numeric not null default 0,    -- % ยอดขายจาก Live (0 = ยังไม่มีใน Live)
  f_wow       boolean not null default false,
  f_demo      boolean not null default false,
  f_problem   boolean not null default false,
  f_easy      boolean not null default false
);

-- เปิด Row Level Security
alter table public.products enable row level security;

-- นโยบายแบบง่าย: ให้ anon อ่าน/เพิ่ม/แก้/ลบ ได้ (เหมาะกับเครื่องมือส่วนตัว)
-- ถ้าต้องการจำกัดเฉพาะผู้ล็อกอิน ค่อยเปลี่ยนเป็น auth.uid() ทีหลัง
drop policy if exists "public read"   on public.products;
drop policy if exists "public insert" on public.products;
drop policy if exists "public update" on public.products;
drop policy if exists "public delete" on public.products;

create policy "public read"   on public.products for select using (true);
create policy "public insert" on public.products for insert with check (true);
create policy "public update" on public.products for update using (true) with check (true);
create policy "public delete" on public.products for delete using (true);

-- ไม่มีข้อมูลตัวอย่าง (mockup) — ตารางเริ่มว่าง
-- สินค้าจริงจะถูกเติมโดย Chrome extension หรือการกรอกเองในแอปเท่านั้น
