/* ============================================================
   fetch-searches.mjs — "คนไทยกำลังค้นหาซื้ออะไร"
   ดึง Google Suggest (autocomplete) ของหมวดสินค้า → คำค้นจริงที่คนพิมพ์บ่อย
   ฟรี ไม่ต้อง key ไม่โดน rate-limit
   env: SUPABASE_URL, SUPABASE_ANON_KEY
   ============================================================ */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SEEDS = [
  "หูฟัง", "ลำโพง", "มือถือ", "สมาร์ทวอทช์", "เคสมือถือ", "ที่ชาร์จ",
  "นาฬิกา", "กระเป๋า", "รองเท้า", "เสื้อ", "ครีมกันแดด", "เซรั่ม",
  "เครื่องสำอาง", "เครื่องนวด", "เครื่องครัว", "หม้อทอดไร้น้ำมัน",
  "ของแต่งบ้าน", "โคมไฟ", "ของเล่น", "อาหารเสริม", "ที่ดูดฝุ่น", "พัดลม",
];

const NOISE = /ภาษาอังกฤษ|แปลว่า|คืออะไร|pantip|วิธี|ทำไม|หมายถึง|ราคาเท่าไหร่|ยี่ห้อไหนดี|ภาษา/;

async function suggest(seed) {
  const url = "https://suggestqueries.google.com/complete/search?client=chrome&hl=th&gl=th&q=" + encodeURIComponent(seed);
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j[1] || [])
    .filter((s) => s && s !== seed && !NOISE.test(s) && s.length <= 60)
    .slice(0, 8);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("ขาด env SUPABASE_*");
  const seen = new Map();
  for (const seed of SEEDS) {
    try {
      const list = await suggest(seed);
      for (const q of list) if (!seen.has(q)) seen.set(q, { query: q, seed });
      console.log(`  ${seed}: +${list.length}`);
    } catch (e) { console.warn(`  ${seed}: ${e.message}`); }
  }
  const rows = [...seen.values()];
  console.log(`รวมคำค้นสินค้า: ${rows.length}`);
  if (!rows.length) throw new Error("ไม่ได้ข้อมูลเลย");

  // ล้างของเก่า แล้วใส่ชุดใหม่ (เป็น snapshot)
  await fetch(`${SUPABASE_URL}/rest/v1/searches?captured_at=gte.2000-01-01`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
  }).catch(() => {});

  const up = await fetch(`${SUPABASE_URL}/rest/v1/searches?on_conflict=query`, {
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
