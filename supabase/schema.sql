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

-- ============================================================
--  ข้อมูลตัวอย่าง 12 รายการ (ลบทิ้งได้ถ้าไม่ต้องการ)
--  รันซ้ำได้ไม่เพิ่มซ้ำ เพราะเช็คด้วย not exists ตามชื่อ
-- ============================================================
insert into public.products (emoji,name,cat,price,cost,sales,trend,creators,shops,reviews,rating,days,f_wow,f_demo,f_problem,f_easy)
select * from (values
  ('👁️','เครื่องนวดตาไฟฟ้าพกพา','สุขภาพ',390,150,420,145,12,34,210,4.7,22,true,true,true,true),
  ('👃','ที่ดูดน้ำมูกเด็กไฟฟ้า','แม่และเด็ก',290,95,260,95,20,45,130,4.8,18,false,true,true,true),
  ('🌇','โคมไฟพระอาทิตย์ตั้งโต๊ะ','ของใช้ในบ้าน',220,70,800,20,480,520,2100,4.6,120,true,true,false,true),
  ('🪥','แปรงสีฟันไฟฟ้าเด็กลายการ์ตูน','สุขภาพ',180,60,150,60,40,90,85,4.7,30,false,true,true,true),
  ('🧼','เครื่องตีโฟมล้างหน้าอัตโนมัติ','ความงาม',260,80,340,110,28,60,160,4.6,20,true,true,false,true),
  ('🔌','คลิปหนีบสายไฟแม่เหล็กติดโต๊ะ','แกดเจ็ต',120,35,90,25,60,140,70,4.5,40,false,true,false,true),
  ('💆','หวีนวดหนังศีรษะไฟฟ้า','ความงาม',350,120,300,130,18,40,140,4.7,16,true,true,true,true),
  ('🍶','กระบอกน้ำมีจอวัดอุณหภูมิ LED','แกดเจ็ต',320,110,500,40,220,300,900,4.6,80,true,false,false,true),
  ('🦟','เครื่องดักยุงไฟฟ้า USB เงียบ','ของใช้ในบ้าน',450,160,380,150,25,55,175,4.5,20,true,true,true,true),
  ('👀','แผ่นแปะลดบวมใต้ตา (30 คู่)','ความงาม',150,45,260,55,90,180,400,4.4,50,false,true,true,true),
  ('🥤','เครื่องปั่นพกพาไร้สาย','ครัว',480,180,210,35,350,400,1500,4.5,150,true,true,false,true),
  ('🐾','ที่กรอเล็บสุนัขไฟฟ้าเงียบ','สัตว์เลี้ยง',340,110,180,120,15,30,95,4.7,17,false,true,true,true)
) as v(emoji,name,cat,price,cost,sales,trend,creators,shops,reviews,rating,days,f_wow,f_demo,f_problem,f_easy)
where not exists (select 1 from public.products p where p.name = v.name);
