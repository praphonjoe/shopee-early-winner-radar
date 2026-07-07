/* ============================================================
   content.js — ISOLATED world
   เก็บสินค้ายกล็อตจากหน้า Shopee → แผงลอย → ส่งเข้า Supabase (upsert)
   + ปุ่มเลื่อนเก็บอัตโนมัติ
   ============================================================ */
const SUPABASE_URL = "https://zovdlmoycqpdvrdgzaqa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmRsbW95Y3FwZHZyZGd6YXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTEzMDAsImV4cCI6MjA5ODk2NzMwMH0.abZmtNz1Q_1Ph9wJiPtTfv7nmAbItqXJmcipco_nTzU";

const captured = new Map();   // itemid -> row (ยังไม่ส่ง)
let sentCount = 0;
let autoScrolling = false;

/* ---- รับสินค้าที่ดักได้ (ยกล็อต) ---- */
window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || !e.data.__ewr || !e.data.items) return;
  let added = 0;
  for (const it of e.data.items) {
    const id = String(it.itemid);
    if (!captured.has(id)) { captured.set(id, mapRow(it)); added++; }
  }
  if (added) updatePanel();
});

function mapRow(it) {
  const price = (it.price ?? it.price_min ?? it.price_max ?? 0) / 100000;
  const rc = it.item_rating && it.item_rating.rating_count;
  const reviews = Array.isArray(rc) ? (rc[0] || 0) : (it.cmt_count || 0);
  const rating = it.item_rating && it.item_rating.rating_star
    ? Math.round(it.item_rating.rating_star * 10) / 10 : 0;
  return {
    src_id: String(it.itemid),
    emoji: "🛍️",
    name: (it.name || "").slice(0, 200),
    cat: "อื่น ๆ",
    price: Math.round(price * 100) / 100,
    cost: 0,
    sales: it.historical_sold || it.sold || 0,
    trend: 0, creators: 0, shops: 0,
    reviews: reviews,
    rating: rating,
    days: 0, live_share: 0,
    f_wow: false, f_demo: false, f_problem: false, f_easy: false
  };
}

/* ---- ส่งเข้า Supabase แบบ upsert (กันซ้ำด้วย src_id) ---- */
async function sendAll() {
  const rows = [...captured.values()];
  if (!rows.length) { toast("ยังไม่มีสินค้าให้ส่ง — เลื่อนดูหน้าค้นหา/หมวดก่อน"); return; }
  setSending(true);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=src_id`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(rows)
    });
    if (res.ok) {
      sentCount += rows.length;
      captured.clear();
      toast(`✅ ส่งเข้าเรดาร์แล้ว ${rows.length} สินค้า`);
      updatePanel();
    } else {
      const t = await res.text();
      console.log("[ก่อนกระแส] supabase error", res.status, t);
      toast(`❌ ส่งไม่ได้ (${res.status}) — ดู Console`);
    }
  } catch (e) {
    toast("❌ error: " + e.message);
  }
  setSending(false);
}

/* ---- เลื่อนเก็บอัตโนมัติ (ให้ Shopee โหลดสินค้ามาเรื่อยๆ) ---- */
async function autoScroll() {
  if (autoScrolling) { autoScrolling = false; return; }
  autoScrolling = true;
  updatePanel();
  for (let i = 0; i < 30 && autoScrolling; i++) {
    window.scrollBy(0, window.innerHeight * 0.9);
    await new Promise((r) => setTimeout(r, 1400));
    // ถ้าถึงล่างสุดแล้วรออีกนิดเผื่อโหลด
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 50) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  autoScrolling = false;
  updatePanel();
  toast(`เลื่อนเก็บเสร็จ — สะสมได้ ${captured.size} สินค้า กด "ส่งเข้าเรดาร์" ได้เลย`);
}

/* ---- UI: แผงลอย ---- */
let panel;
function ensurePanel() {
  if (panel) return;
  panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed", right: "16px", bottom: "80px", zIndex: 2147483647,
    width: "230px", background: "#FFFFFF", border: "1px solid #E3E0D6", borderRadius: "16px",
    padding: "13px", boxShadow: "0 12px 34px -10px rgba(20,32,26,.4)",
    fontFamily: "-apple-system,Sukhumvit Set,sans-serif", color: "#14201A"
  });
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;font-weight:800;font-size:13px;margin-bottom:9px">
      <span style="width:9px;height:9px;border-radius:50%;background:#0F9B6C;display:inline-block"></span>
      ก่อนกระแส · เรดาร์
    </div>
    <div id="ewr-count" style="font-size:26px;font-weight:850;line-height:1;letter-spacing:-1px">0</div>
    <div style="font-size:11px;color:#5B6A61;margin:3px 0 11px">สินค้าที่เก็บได้ (รอส่ง)</div>
    <button id="ewr-scroll" style="width:100%;margin-bottom:7px;padding:10px;border:1.5px solid #E3E0D6;border-radius:11px;background:#fff;font-family:inherit;font-size:13px;font-weight:700;color:#14201A;cursor:pointer">🔄 เลื่อนเก็บอัตโนมัติ</button>
    <button id="ewr-send" style="width:100%;padding:11px;border:none;border-radius:11px;background:#14201A;color:#F4FBEF;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer">⬇️ ส่งเข้าเรดาร์</button>
    <a href="https://shopee-early-winner-radar.vercel.app" target="_blank" style="display:block;text-align:center;margin-top:9px;font-size:11.5px;color:#0F9B6C;font-weight:700;text-decoration:none">เปิดแอปดูอันดับ →</a>
  `;
  document.body.appendChild(panel);
  panel.querySelector("#ewr-send").onclick = sendAll;
  panel.querySelector("#ewr-scroll").onclick = autoScroll;
  updatePanel();
}
function updatePanel() {
  if (!panel) return;
  panel.querySelector("#ewr-count").textContent = captured.size;
  const s = panel.querySelector("#ewr-scroll");
  s.textContent = autoScrolling ? "⏹ หยุดเลื่อน" : "🔄 เลื่อนเก็บอัตโนมัติ";
  s.style.background = autoScrolling ? "#FBF1E2" : "#fff";
  const btn = panel.querySelector("#ewr-send");
  btn.textContent = `⬇️ ส่งเข้าเรดาร์ (${captured.size})`;
}
function setSending(on) {
  const btn = panel && panel.querySelector("#ewr-send");
  if (btn) { btn.textContent = on ? "⏳ กำลังส่ง…" : `⬇️ ส่งเข้าเรดาร์ (${captured.size})`; btn.disabled = on; }
}

let toastEl, toastT;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    Object.assign(toastEl.style, {
      position: "fixed", left: "50%", bottom: "150px", transform: "translateX(-50%) translateY(12px)",
      zIndex: 2147483647, background: "#14201A", color: "#F4FBEF", padding: "12px 20px", borderRadius: "12px",
      fontSize: "14px", fontWeight: "700", fontFamily: "-apple-system,Sukhumvit Set,sans-serif",
      boxShadow: "0 10px 30px -8px rgba(20,32,26,.5)", opacity: "0", transition: ".3s", maxWidth: "82vw", textAlign: "center"
    });
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.opacity = "1"; toastEl.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(toastT);
  toastT = setTimeout(() => { toastEl.style.opacity = "0"; toastEl.style.transform = "translateX(-50%) translateY(12px)"; }, 3400);
}

/* แผงโชว์ทุกหน้า shopee (ค้นหา/หมวด/มาแรง ล้วนมีสินค้า) */
const boot = setInterval(() => { if (document.body) { clearInterval(boot); ensurePanel(); } }, 300);
console.log("[ก่อนกระแส] content พร้อม 🚀 เสิร์ช/เปิดหมวดใน Shopee แล้วกดส่งเข้าเรดาร์ได้เลย");
