/* ============================================================
   fetch-yt-products.mjs — "สินค้าก่อนกระแส" จาก YouTube (ไทย)
   หา สินค้าเฉพาะเจาะจง ที่ "คลิปรีวิวเพิ่งลง (ใหม่) + ยอดวิวพุ่งเร็ว (ขาขึ้น)
   + ยังมีคนทำน้อย" = ก่อนกระแส (ก่อนตลาดอิ่มตัว)
   เรียงตาม velocity = วิว/วัน (ไม่ใช่ยอดวิวรวม)
   env: YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
   ============================================================ */
const YT = process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const DAYS_NEW = 21;   // เอาเฉพาะคลิปที่ลงใน 21 วันล่าสุด = "ใหม่"

const QUERIES = [
  { cat: "หูฟัง / ลำโพง",   q: "รีวิว หูฟังไร้สาย ลำโพงบลูทูธ" },
  { cat: "แกดเจ็ต",         q: "รีวิว แกดเจ็ต ของมันต้องมี gadget" },
  { cat: "ความงาม",         q: "รีวิว สกินแคร์ ครีม เครื่องสำอาง" },
  { cat: "เครื่องครัว",      q: "รีวิว เครื่องครัว หม้อทอดไร้น้ำมัน" },
  { cat: "ของแต่งบ้าน",      q: "รีวิว ของแต่งบ้าน ไอเทมแต่งห้อง" },
  { cat: "สุขภาพ / นวด",     q: "รีวิว เครื่องนวด อุปกรณ์เพื่อสุขภาพ" },
  { cat: "แม่และเด็ก",       q: "รีวิว ของใช้เด็ก แม่และเด็ก" },
  { cat: "สัตว์เลี้ยง",      q: "รีวิว ของใช้สัตว์เลี้ยง หมาแมว" },
  { cat: "ทำความสะอาด",      q: "รีวิว ที่ดูดฝุ่นไร้สาย เครื่องทำความสะอาด" },
  { cat: "ช้อปปิ้ง",         q: "แกะกล่อง shopee haul ไอเทมใหม่" },
];

const daysAgoISO = (d) => new Date(Date.now() - d * 86400000).toISOString();
async function jget(url) { const r = await fetch(url); const j = await r.json(); if (j.error) throw new Error(j.error.message); return j; }

async function runQuery({ cat, q }) {
  const s = await jget(
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
    "&regionCode=TH&relevanceLanguage=th&order=viewCount&maxResults=12" +
    "&publishedAfter=" + encodeURIComponent(daysAgoISO(DAYS_NEW)) +
    "&q=" + encodeURIComponent(q) + "&key=" + YT
  );
  const ids = (s.items || []).map((it) => it.id.videoId).filter(Boolean);
  if (!ids.length) return [];
  const v = await jget("https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=" + ids.join(",") + "&key=" + YT);
  const rows = (v.items || []).map((it) => {
    const views = parseInt(it.statistics.viewCount || "0", 10);
    const pub = it.snippet.publishedAt;
    const days = Math.max(0.5, (Date.now() - new Date(pub).getTime()) / 86400000);
    const th = it.snippet.thumbnails || {};
    return {
      video_id: it.id, category: cat, title: it.snippet.title, channel: it.snippet.channelTitle,
      views, velocity: Math.round(views / days),        // วิว/วัน = สัญญาณขาขึ้น
      published_at: pub.slice(0, 10),
      thumbnail: (th.medium || th.default || {}).url || null,
    };
  }).filter((r) =>
    (Date.now() - new Date(r.published_at).getTime()) / 86400000 <= DAYS_NEW &&
    /[ก-๙]/.test(r.title) &&                                   // ต้องมีภาษาไทย (กันคลิปต่างชาติ)
    !/ดอกเตอร์|มหาเศรษฐี|ซีรีส์|ละคร|นิยาย|ตอนที่|EP\.|ep\.|เรื่องเล่า|สารคดี|ตอนจบ|ธรรมะ|พากย์/.test(r.title)  // กันละคร/เรื่องเล่า
  );
  rows.sort((a, b) => b.velocity - a.velocity);
  return rows.slice(0, 6);
}

async function main() {
  if (!YT || !SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("ขาด env");
  const seen = new Map();
  for (const Q of QUERIES) {
    try {
      const rows = await runQuery(Q);
      for (const r of rows) { const e = seen.get(r.video_id); if (!e || r.velocity > e.velocity) seen.set(r.video_id, r); }
      console.log(`  ${Q.cat}: +${rows.length}`);
    } catch (e) { console.warn(`  ${Q.cat}: ${e.message}`); }
  }
  const all = [...seen.values()].sort((a, b) => b.velocity - a.velocity).slice(0, 40);
  console.log(`สินค้าก่อนกระแส: ${all.length}`);
  all.slice(0, 8).forEach((r) => console.log(`  ${r.velocity}/วัน (${r.published_at}) | ${r.title.slice(0, 45)}`));
  if (!all.length) throw new Error("ไม่ได้ข้อมูล");

  // ล้าง snapshot เก่าทิ้ง แล้วใส่ชุดใหม่ (เอาเฉพาะของใหม่ที่กำลังมา)
  await fetch(`${SUPABASE_URL}/rest/v1/yt_products?video_id=neq.__none__`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
  }).catch(() => {});

  const up = await fetch(`${SUPABASE_URL}/rest/v1/yt_products?on_conflict=video_id`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(all),
  });
  if (!up.ok) throw new Error("upsert HTTP " + up.status + " " + (await up.text()));
  console.log("✅ บันทึกเข้า Supabase สำเร็จ");
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
