/* ============================================================
   fetch-searches.mjs — "คนไทยกำลังค้นหาซื้ออะไร" + คะแนนความนิยม + ประวัติรายวัน
   Google Suggest ให้คำค้นจริง + google:suggestrelevance = คะแนนไว้จัดอันดับ
   เก็บลง search_daily (query, day, seed, score) → สะสมประวัติไว้ทำกราฟแนวโน้ม
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
const NOISE = /ภาษาอังกฤษ|แปลว่า|คืออะไร|pantip|วิธี|ทำไม|หมายถึง|ราคาเท่าไหร่|ยี่ห้อไหนดี|ภาษา|ใกล้ฉัน|เชียงใหม่|จตุจักร|the sims/;

async function suggest(seed) {
  const url = "https://suggestqueries.google.com/complete/search?client=chrome&hl=th&gl=th&q=" + encodeURIComponent(seed);
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return [];
  const j = await r.json();
  const words = j[1] || [];
  const scores = (j[4] && j[4]["google:suggestrelevance"]) || [];
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const q = words[i];
    if (!q || q === seed || NOISE.test(q) || q.length > 60) continue;
    out.push({ query: q, score: scores[i] || 0 });
  }
  return out.slice(0, 8);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("ขาด env SUPABASE_*");
  const day = new Date().toISOString().slice(0, 10);
  const seen = new Map();
  for (const seed of SEEDS) {
    try {
      const list = await suggest(seed);
      for (const it of list) if (!seen.has(it.query)) seen.set(it.query, { query: it.query, day, seed, score: it.score });
      console.log(`  ${seed}: +${list.length}`);
    } catch (e) { console.warn(`  ${seed}: ${e.message}`); }
  }
  const rows = [...seen.values()];
  console.log(`คำค้นสินค้าวันนี้: ${rows.length}`);
  if (!rows.length) throw new Error("ไม่ได้ข้อมูลเลย");

  // append ประวัติของวันนี้ (ไม่ลบวันก่อนๆ — เก็บไว้ทำกราฟแนวโน้ม)
  const up = await fetch(`${SUPABASE_URL}/rest/v1/search_daily?on_conflict=query,day`, {
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
  console.log("✅ บันทึกเข้า search_daily สำเร็จ (วันที่ " + day + ")");
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
