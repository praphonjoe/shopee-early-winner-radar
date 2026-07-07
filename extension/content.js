/* ============================================================
   content.js — รันใน ISOLATED world
   หน้าที่: รับข้อมูลจาก interceptor → แสดงปุ่มลอย "＋ เข้าเรดาร์"
            → คลิกแล้วส่งเข้า Supabase → เด้ง toast
   ============================================================ */
const SUPABASE_URL = "https://zovdlmoycqpdvrdgzaqa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmRsbW95Y3FwZHZyZGd6YXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTEzMDAsImV4cCI6MjA5ODk2NzMwMH0.abZmtNz1Q_1Ph9wJiPtTfv7nmAbItqXJmcipco_nTzU";

let latestItem = null;
let currentKey = "";

/* ---- รับข้อมูลที่ดักได้จาก interceptor ---- */
window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || !e.data.__ewr) return;
  latestItem = e.data.item;
  setBtn("ready");
});

/* ---- แปลงข้อมูล Shopee -> แถวของแอป ---- */
function mapRow(it) {
  const price = (it.price ?? it.price_min ?? it.price_max ?? 0) / 100000;
  const rc = it.item_rating && it.item_rating.rating_count;
  const reviews = Array.isArray(rc) ? (rc[0] || 0) : (it.cmt_count || 0);
  const rating = it.item_rating && it.item_rating.rating_star
    ? Math.round(it.item_rating.rating_star * 10) / 10 : 0;
  return {
    emoji: "🛍️",
    name: (it.name || "").slice(0, 200),
    cat: "อื่น ๆ",
    price: Math.round(price * 100) / 100,
    cost: 0,
    sales: it.historical_sold || it.sold || 0,   // ยอดขายสะสม (Shopee ไม่ให้ 7 วันตรงๆ)
    trend: 0,                                     // ต้องเก็บหลายวันเพื่อคำนวณ
    creators: 0,                                  // Shopee ไม่มี (เป็นของ TikTok)
    shops: 0,
    reviews: reviews,
    rating: rating,
    days: 0,
    live_share: 0,
    f_wow: false, f_demo: false, f_problem: false, f_easy: false,
    _src: "shopee"
  };
}

/* ---- ส่งเข้า Supabase ---- */
async function save() {
  let it = latestItem;

  // สำรอง: ถ้ายังไม่ดักได้ ลองยิง API ของ Shopee เอง (same-origin = ผ่าน เพราะเป็นเซสชันคุณ)
  if (!it || !it.name) {
    const m = location.href.match(/i\.(\d+)\.(\d+)/);
    if (m) {
      try {
        const r = await fetch(`/api/v4/item/get?itemid=${m[2]}&shopid=${m[1]}`, {
          headers: { "x-api-source": "pc", "x-shopee-language": "th" },
          credentials: "include"
        });
        const j = await r.json();
        it = (j && j.data) || null;
      } catch (e) {}
    }
  }

  if (!it || !it.name) {
    toast("⚠️ ยังไม่เจอข้อมูลสินค้า — เลื่อนดูหน้าสินค้าให้โหลดครบก่อนแล้วลองใหม่");
    return;
  }

  const row = mapRow(it);
  // ตัด _src ออกก่อนส่ง (เผื่อ schema ไม่มีคอลัมน์นี้)
  const { _src, ...payload } = row;
  setBtn("saving");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      toast("✅ เข้าเรดาร์แล้ว: " + row.name.slice(0, 32));
      setBtn("done");
    } else {
      const t = await res.text();
      console.log("[ก่อนกระแส] supabase error", res.status, t);
      toast("❌ บันทึกไม่ได้ (" + res.status + ") — ดู Console");
      setBtn("ready");
    }
  } catch (e) {
    toast("❌ error: " + e.message);
    setBtn("ready");
  }
}

/* ---- UI: ปุ่มลอย + toast ---- */
let btnEl;
function isProductPage() { return /i\.\d+\.\d+/.test(location.href); }

function ensureUI() {
  if (btnEl) return;
  btnEl = document.createElement("button");
  btnEl.id = "ewr-btn";
  Object.assign(btnEl.style, {
    position: "fixed", right: "18px", bottom: "84px", zIndex: 2147483647,
    padding: "13px 18px", borderRadius: "999px", border: "none", cursor: "pointer",
    background: "#14201A", color: "#F4FBEF", fontSize: "15px", fontWeight: "800",
    fontFamily: "-apple-system,Sukhumvit Set,sans-serif",
    boxShadow: "0 10px 30px -8px rgba(20,32,26,.5)", transition: "transform .12s, background .2s"
  });
  btnEl.onmouseenter = () => (btnEl.style.transform = "translateY(-2px)");
  btnEl.onmouseleave = () => (btnEl.style.transform = "none");
  btnEl.onclick = save;
  document.body.appendChild(btnEl);
  setBtn(latestItem ? "ready" : "wait");
}
function setBtn(state) {
  if (!btnEl) return;
  const map = {
    wait:  ["📡 กำลังอ่านหน้า…", "#5B6A61"],
    ready: ["＋ เข้าเรดาร์", "#0F9B6C"],
    saving:["⏳ กำลังบันทึก…", "#5B6A61"],
    done:  ["✅ บันทึกแล้ว", "#0A5A42"]
  };
  const [txt, bg] = map[state] || map.ready;
  btnEl.textContent = txt;
  btnEl.style.background = bg;
}

let toastEl, toastT;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    Object.assign(toastEl.style, {
      position: "fixed", left: "50%", bottom: "150px", transform: "translateX(-50%) translateY(12px)",
      zIndex: 2147483647, background: "#14201A", color: "#F4FBEF", padding: "12px 20px",
      borderRadius: "12px", fontSize: "14px", fontWeight: "700", fontFamily: "-apple-system,Sukhumvit Set,sans-serif",
      boxShadow: "0 10px 30px -8px rgba(20,32,26,.5)", opacity: "0", transition: ".3s", maxWidth: "80vw", textAlign: "center"
    });
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.opacity = "1";
  toastEl.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    toastEl.style.opacity = "0";
    toastEl.style.transform = "translateX(-50%) translateY(12px)";
  }, 3200);
}

/* ---- ตรวจ SPA navigation: โชว์/ซ่อนปุ่ม + รีเซ็ตเมื่อเปลี่ยนสินค้า ---- */
setInterval(() => {
  const m = location.href.match(/i\.(\d+)\.(\d+)/);
  const key = m ? m[1] + "." + m[2] : "";
  if (key !== currentKey) {
    currentKey = key;
    latestItem = null;
    if (key) setBtn("wait");
  }
  if (isProductPage()) {
    ensureUI();
    btnEl.style.display = "block";
  } else if (btnEl) {
    btnEl.style.display = "none";
  }
}, 1000);

console.log("[ก่อนกระแส] content script พร้อม 🚀 (เปิดหน้าสินค้า Shopee เพื่อเริ่มใช้)");
