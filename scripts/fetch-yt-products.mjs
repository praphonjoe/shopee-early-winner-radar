/* ============================================================
   fetch-yt-products.mjs — ดึง "สินค้ามาแรง" จาก YouTube (ไทย)
   ค้นคลิปรีวิว/แกะกล่องหลายหมวด → เอาตัวยอดวิวพุ่ง → เก็บ Supabase
   env: YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
   ============================================================ */
const YT = process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// หมวดสินค้า + คำค้น (เจาะจงกว่า "รีวิวสินค้า" เพื่อลดคลิปมั่ว)
const QUERIES = [
  { cat: "หูฟัง / ลำโพง",   q: "รีวิว หูฟังไร้สาย ลำโพงบลูทูธ" },
  { cat: "แกดเจ็ต",         q: "รีวิว แกดเจ็ต ของมันต้องมี gadget" },
  { cat: "ความงาม",         q: "รีวิว สกินแคร์ ครีม เครื่องสำอาง" },
  { cat: "เครื่องครัว",      q: "รีวิว เครื่องครัว ของใช้ในครัว" },
  { cat: "ของแต่งบ้าน",      q: "รีวิว ของแต่งบ้าน ไอเทมแต่งห้อง" },
  { cat: "สุขภาพ / นวด",     q: "รีวิว เครื่องนวด อุปกรณ์เพื่อสุขภาพ" },
  { cat: "แม่และเด็ก",       q: "รีวิว ของใช้เด็ก แม่และเด็ก" },
  { cat: "สัตว์เลี้ยง",      q: "รีวิว ของใช้สัตว์เลี้ยง หมาแมว" },
  { cat: "ช้อปปิ้ง",         q: "แกะกล่อง shopee haul ไอเทมเด็ด" },
];

const daysAgoISO = (d) => new Date(Date.now() - d * 86400000).toISOString();

async function jget(url) {
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j;
}

async function runQuery({ cat, q }) {
  const s = await jget(
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
    "&regionCode=TH&relevanceLanguage=th&order=viewCount&maxResults=10" +
    "&publishedAfter=" + encodeURIComponent(daysAgoISO(45)) +
    "&q=" + encodeURIComponent(q) + "&key=" + YT
  );
  const ids = (s.items || []).map((it) => it.id.videoId).filter(Boolean);
  if (!ids.length) return [];
  const v = await jget(
    "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=" +
    ids.join(",") + "&key=" + YT
  );
  const rows = (v.items || []).map((it) => {
    const views = parseInt(it.statistics.viewCount || "0", 10);
    const pub = it.snippet.publishedAt;
    const days = Math.max(1, (Date.now() - new Date(pub).getTime()) / 86400000);
    const th = it.snippet.thumbnails || {};
    return {
      video_id: it.id,
      category: cat,
      title: it.snippet.title,
      channel: it.snippet.channelTitle,
      views,
      velocity: Math.round(views / days),   // วิว/วัน = สัญญาณกำลังพุ่ง
      published_at: pub.slice(0, 10),
      thumbnail: (th.medium || th.default || {}).url || null,
    };
  });
  rows.sort((a, b) => b.views - a.views);
  return rows.slice(0, 5); // เอา 5 อันดับแรกต่อหมวด
}

async function main() {
  if (!YT || !SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("ขาด env (YOUTUBE_API_KEY / SUPABASE_*)");
  const seen = new Map();
  for (const Q of QUERIES) {
    try {
      const rows = await runQuery(Q);
      for (const r of rows) if (!seen.has(r.video_id)) seen.set(r.video_id, r);
      console.log(`  ${Q.cat}: +${rows.length}`);
    } catch (e) { console.warn(`  ${Q.cat}: ${e.message}`); }
  }
  const all = [...seen.values()];
  console.log(`รวม ${all.length} สินค้า/คลิป`);
  if (!all.length) throw new Error("ไม่ได้ข้อมูลเลย");

  const up = await fetch(`${SUPABASE_URL}/rest/v1/yt_products?on_conflict=video_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(all),
  });
  if (!up.ok) throw new Error("upsert ล้มเหลว: " + up.status + " " + (await up.text()));
  console.log("✅ บันทึกเข้า Supabase สำเร็จ");
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
