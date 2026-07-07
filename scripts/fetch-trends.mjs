/* ============================================================
   fetch-trends.mjs — ดึง "เทรนด์สินค้า" จาก Google Trends (Trending Now)
   กรองเฉพาะหมวดสินค้า (เทค/ช้อปปิ้ง/ความงาม/ยานยนต์/งานอดิเรก) → เก็บ Supabase
   ใช้ batchexecute API (ฟรี ไม่ต้อง key) + parse โครงสร้างที่ Google ส่งมา
   env: SUPABASE_URL, SUPABASE_ANON_KEY
   ============================================================ */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// หมวดที่ถือว่าเป็น "สินค้า" ( id → ชื่อไทย) — เลือกเฉพาะหมวดสินค้าชัดๆ
const PRODUCT_CATS = {
  1: "ยานยนต์",
  2: "ความงาม/แฟชั่น",
  16: "ช้อปปิ้ง",
  18: "เทคโนโลยี/แกดเจ็ต",
};

async function fetchTrending() {
  const inner = JSON.stringify([null, null, "TH", 0, "en-US", 168, 1]);
  const freq = JSON.stringify([[["i0OFE", inner, null, "generic"]]]);
  const res = await fetch(
    "https://trends.google.com/_/TrendsUi/data/batchexecute?rpcids=i0OFE&hl=en&gl=TH",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      },
      body: "f.req=" + encodeURIComponent(freq),
    }
  );
  if (!res.ok) throw new Error("batchexecute HTTP " + res.status);
  let txt = await res.text();
  txt = txt.slice(txt.indexOf("[", txt.indexOf(")]}'")));
  const data = JSON.parse(txt);
  const rowStr = (data.find((r) => r && r[1] === "i0OFE") || [])[2];
  if (!rowStr) throw new Error("ไม่พบข้อมูล i0OFE");
  return JSON.parse(rowStr)[1] || [];
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("ขาด env SUPABASE_*");
  const all = await fetchTrending();
  const date = new Date().toISOString().slice(0, 10);

  const rows = all
    .map((t) => {
      const catId = t[10] && t[10][0];
      const cat = PRODUCT_CATS[catId];
      if (!cat) return null;                       // เอาเฉพาะหมวดสินค้า
      return {
        trend_date: date,
        rank: 0,
        title: t[0],
        traffic: (t[6] || 0) >= 1000 ? Math.round((t[6] || 0) / 1000) + "k+" : String(t[6] || 0),
        volume: t[6] || 0,
        category: cat,
        news_title: null, news_source: null, news_url: null, picture_url: null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.volume - a.volume)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  console.log(`เทรนด์สินค้า (Google): ${rows.length} รายการ`);
  rows.slice(0, 10).forEach((r) => console.log(`  ${r.volume} | [${r.category}] ${r.title}`));

  // ล้าง trends เก่าทั้งหมดทิ้งก่อน (เป็นแค่ cache) แล้วใส่ชุดใหม่
  await fetch(`${SUPABASE_URL}/rest/v1/trends?trend_date=gte.2000-01-01`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
  }).catch(() => {});

  if (!rows.length) { console.log("วันนี้ไม่มีเทรนด์สินค้า — ข้าม"); return; }

  const up = await fetch(`${SUPABASE_URL}/rest/v1/trends?on_conflict=title,trend_date`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!up.ok) throw new Error("upsert HTTP " + up.status + " " + (await up.text()));
  console.log("✅ บันทึกเข้า Supabase สำเร็จ");
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
