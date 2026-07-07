/* ============================================================
   fetch-trends.mjs — ดึง Google Trends "เทรนด์รายวันของไทย" (ฟรี ไม่ต้อง key)
   → แปลง → upsert เข้า Supabase table `trends`
   รันโดย GitHub Action (cron) หรือรันเองด้วย node
   ต้องมี env: SUPABASE_URL, SUPABASE_ANON_KEY
   ============================================================ */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const RSS = "https://trends.google.com/trending/rss?geo=TH";

const CATS = [
  ["หวย / ดวง",      /หวย|เลข|งู|พญานาค|ฝัน|ดวง|ราศี|ไพ่|มงคล|ขูด/],
  ["กีฬา",           /ฟุตบอล|บอล|ทีมชาติ|วอลเลย์|มวย|นักเตะ|แข่งขัน|ลิเวอร์|แมนซิ|พรีเมียร์|ฟีฟ่า|โอลิมปิก/],
  ["การเมือง / ข่าว", /ป\.ป\.ช|นายก|รัฐบาล|ตำรวจ|ศาล|จับ|สภา|พรรค|รัฐมนตรี|เลือกตั้ง|ม็อบ/],
  ["การเงิน",        /หุ้น|ตราสาร|ทองคำ|ทอง|บิทคอยน์|คริปโต|ดอลลาร|เงินบาท|กองทุน|ดอกเบี้ย/],
  ["บันเทิง / ดารา",  /ดารา|นักแสดง|ซีรีส์|หนัง|เพลง|คอนเสิร์ต|ไอดอล|MV|EP\.|ละคร|วง/],
  ["ไลฟ์สไตล์ / สินค้า", /รีวิว|ไอเทม|ของมันต้องมี|เปิดตัว|รุ่นใหม่|ราคา|มือถือ|แกดเจ็ต|สกินแคร์|ครีม|เครื่อง|ลดราคา|เซล/],
];
function guessCat(text) {
  for (const [name, re] of CATS) if (re.test(text)) return name;
  return "กระแสสังคม";
}
function parseVolume(t) {
  if (!t) return 0;
  const n = parseInt(String(t).replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}
const pick = (block, tag) => {
  const m = block.match(new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">"));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : null;
};

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("ขาด env SUPABASE_URL / SUPABASE_ANON_KEY");
  const res = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("ดึง RSS ไม่ได้: HTTP " + res.status);
  const xml = await res.text();
  const date = new Date().toISOString().slice(0, 10);

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const rows = items.map((b, i) => {
    const title = pick(b, "title");
    const traffic = pick(b, "ht:approx_traffic");
    const news = b.match(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/);
    const nb = news ? news[1] : "";
    const ctx = (title || "") + " " + (pick(nb, "ht:news_item_title") || "");
    return {
      trend_date: date,
      rank: i + 1,
      title,
      traffic,
      volume: parseVolume(traffic),
      category: guessCat(ctx),
      news_title: pick(nb, "ht:news_item_title"),
      news_source: pick(nb, "ht:news_item_source"),
      news_url: pick(nb, "ht:news_item_url"),
      picture_url: pick(b, "ht:picture"),
    };
  }).filter((r) => r.title);

  console.log(`ดึงได้ ${rows.length} เทรนด์ (วันที่ ${date})`);

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
  if (!up.ok) throw new Error("upsert ล้มเหลว: HTTP " + up.status + " " + (await up.text()));
  console.log("✅ บันทึกเข้า Supabase สำเร็จ");
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
