import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ---------------- Supabase ---------------- */
const CFG = window.__CONFIG__ || {};
const HAS_DB = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
const sb = HAS_DB ? createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

/* ---------------- seed (ใช้เมื่อยังไม่ต่อ DB หรือตารางว่าง) ---------------- */
const SEED = [
  {id:"s1", emoji:"👁️", name:"เครื่องนวดตาไฟฟ้าพกพา", cat:"สุขภาพ", price:390, cost:150, sales:420, trend:145, creators:12, shops:34, reviews:210, rating:4.7, days:22, live:0, f:{wow:1,demo:1,problem:1,easy:1}},
  {id:"s2", emoji:"👃", name:"ที่ดูดน้ำมูกเด็กไฟฟ้า", cat:"แม่และเด็ก", price:290, cost:95, sales:260, trend:95, creators:20, shops:45, reviews:130, rating:4.8, days:18, live:5, f:{wow:0,demo:1,problem:1,easy:1}},
  {id:"s3", emoji:"🌇", name:"โคมไฟพระอาทิตย์ตั้งโต๊ะ", cat:"ของใช้ในบ้าน", price:220, cost:70, sales:800, trend:20, creators:480, shops:520, reviews:2100, rating:4.6, days:120, live:45, f:{wow:1,demo:1,problem:0,easy:1}},
  {id:"s4", emoji:"🪥", name:"แปรงสีฟันไฟฟ้าเด็กลายการ์ตูน", cat:"สุขภาพ", price:180, cost:60, sales:150, trend:60, creators:40, shops:90, reviews:85, rating:4.7, days:30, live:20, f:{wow:0,demo:1,problem:1,easy:1}},
  {id:"s5", emoji:"🧼", name:"เครื่องตีโฟมล้างหน้าอัตโนมัติ", cat:"ความงาม", price:260, cost:80, sales:340, trend:110, creators:28, shops:60, reviews:160, rating:4.6, days:20, live:15, f:{wow:1,demo:1,problem:0,easy:1}},
  {id:"s6", emoji:"🔌", name:"คลิปหนีบสายไฟแม่เหล็กติดโต๊ะ", cat:"แกดเจ็ต", price:120, cost:35, sales:90, trend:25, creators:60, shops:140, reviews:70, rating:4.5, days:40, live:0, f:{wow:0,demo:1,problem:0,easy:1}},
  {id:"s7", emoji:"💆", name:"หวีนวดหนังศีรษะไฟฟ้า", cat:"ความงาม", price:350, cost:120, sales:300, trend:130, creators:18, shops:40, reviews:140, rating:4.7, days:16, live:10, f:{wow:1,demo:1,problem:1,easy:1}},
  {id:"s8", emoji:"🍶", name:"กระบอกน้ำมีจอวัดอุณหภูมิ LED", cat:"แกดเจ็ต", price:320, cost:110, sales:500, trend:40, creators:220, shops:300, reviews:900, rating:4.6, days:80, live:40, f:{wow:1,demo:0,problem:0,easy:1}},
  {id:"s9", emoji:"🦟", name:"เครื่องดักยุงไฟฟ้า USB เงียบ", cat:"ของใช้ในบ้าน", price:450, cost:160, sales:380, trend:150, creators:25, shops:55, reviews:175, rating:4.5, days:20, live:0, f:{wow:1,demo:1,problem:1,easy:1}},
  {id:"s10", emoji:"👀", name:"แผ่นแปะลดบวมใต้ตา (30 คู่)", cat:"ความงาม", price:150, cost:45, sales:260, trend:55, creators:90, shops:180, reviews:400, rating:4.4, days:50, live:30, f:{wow:0,demo:1,problem:1,easy:1}},
  {id:"s11", emoji:"🥤", name:"เครื่องปั่นพกพาไร้สาย", cat:"ครัว", price:480, cost:180, sales:210, trend:35, creators:350, shops:400, reviews:1500, rating:4.5, days:150, live:55, f:{wow:1,demo:1,problem:0,easy:1}},
  {id:"s12", emoji:"🐾", name:"ที่กรอเล็บสุนัขไฟฟ้าเงียบ", cat:"สัตว์เลี้ยง", price:340, cost:110, sales:180, trend:120, creators:15, shops:30, reviews:95, rating:4.7, days:17, live:0, f:{wow:0,demo:1,problem:1,easy:1}},
];
let P = SEED.slice();

/* map a Supabase row -> internal product shape */
function fromRow(r){
  return {id:r.id, emoji:r.emoji||"🛍️", name:r.name, cat:r.cat, price:+r.price, cost:+r.cost,
    sales:+r.sales, trend:+r.trend, creators:+r.creators, shops:+r.shops, reviews:+r.reviews,
    rating:+r.rating, days:+r.days||0, live:+r.live_share||0, f:{wow:r.f_wow?1:0, demo:r.f_demo?1:0, problem:r.f_problem?1:0, easy:r.f_easy?1:0}};
}
function toRow(p){
  return {emoji:p.emoji, name:p.name, cat:p.cat, price:p.price, cost:p.cost, sales:p.sales, trend:p.trend,
    creators:p.creators, shops:p.shops, reviews:p.reviews, rating:p.rating, days:p.days, live_share:p.live,
    f_wow:!!p.f.wow, f_demo:!!p.f.demo, f_problem:!!p.f.problem, f_easy:!!p.f.easy};
}
/* สถานะช่องทาง Live */
function liveStatus(p){
  const s=p.live||0;
  if(s<=0) return {key:"none", inLive:false, chip:"⚫ ยังไม่มีใน Live", tagCls:"nolive", icon:"🎯",
    title:"ยังไม่มีใครขายตัวนี้ในไลฟ์", desc:"โอกาสทองเปิดไลฟ์เจ้าแรก จับตลาดก่อนคนอื่นเห็น"};
  if(s<=25) return {key:"low", inLive:true, chip:"🔴 มีใน Live", tagCls:"live", icon:"🟠",
    title:`ขายผ่านไลฟ์ ~${s}% — ยังน้อย`, desc:"มีคนไลฟ์ขายบ้างแต่ยังไม่แน่น ยังมีที่ว่างให้แทรก"};
  return {key:"high", inLive:true, chip:"🔴 อยู่ใน Live เยอะ", tagCls:"live", icon:"🔥",
    title:`ขายผ่านไลฟ์สูง ~${s}%`, desc:"แข่งไลฟ์กันเยอะแล้ว เน้นทำคลิป/หามุมต่าง แทนการชนไลฟ์ตรง ๆ"};
}

async function loadData(){
  if(!HAS_DB){ setDataNote(false, "offline"); return; }
  try{
    const {data, error} = await sb.from("products").select("*").order("created_at",{ascending:true});
    if(error) throw error;
    if(data && data.length){ P = data.map(fromRow); setDataNote(true, "live"); }
    else { P = SEED.slice(); setDataNote(true, "empty"); }
  }catch(e){
    console.warn("Supabase load failed, ใช้ข้อมูลตัวอย่างแทน:", e.message);
    P = SEED.slice(); setDataNote(false, "error");
  }
  renderHome();
}
function setDataNote(live, mode){
  const note=document.getElementById("dataNote"), txt=document.getElementById("dataNoteTxt");
  if(live && mode==="live"){ note.classList.add("live"); txt.innerHTML='☁️ <b>เชื่อมต่อฐานข้อมูลแล้ว</b> — สินค้าที่เพิ่มจะถูกบันทึกถาวร ใช้ได้ทุกเครื่อง'; }
  else if(live && mode==="empty"){ note.classList.add("live"); txt.innerHTML='☁️ <b>ฐานข้อมูลพร้อม (ยังว่างอยู่)</b> — ตอนนี้โชว์ข้อมูลตัวอย่าง ลองกด “เพิ่มสินค้าของฉัน” เพื่อเริ่มบันทึกจริง'; }
  else { txt.innerHTML='💡 ตอนนี้ใช้ <b>ข้อมูลตัวอย่าง</b> (ยังไม่ได้ต่อฐานข้อมูล) — ใส่ค่า Supabase ใน <b>config.js</b> เพื่อบันทึกถาวร'; }
}

/* ---------------- scoring ---------------- */
function band(v, table){ for(const [th,pts] of table){ if(v>=th) return pts; } return table[table.length-1][1]; }
function score(p){
  const margin = p.price>0 ? (p.price-p.cost)/p.price*100 : 0;
  const momentum = band(p.trend, [[100,25],[50,21],[30,17],[15,12],[0,7],[-9999,2]]);
  const creators = p.creators<=15?20 : p.creators<=50?15 : p.creators<=150?10 : p.creators<=500?5 : 2;
  const cflags = (p.f.wow?1:0)+(p.f.demo?1:0)+(p.f.problem?1:0)+(p.f.easy?1:0);
  const content = cflags*5;
  const priceP = (p.price>=150&&p.price<=600)?7 : ((p.price>=100&&p.price<150)||(p.price>600&&p.price<=900))?5 : ((p.price>=60&&p.price<100)||(p.price>900&&p.price<=1500))?3 : 1;
  const marginP = margin>=50?8 : margin>=40?6 : margin>=30?4 : margin>=20?2 : 0;
  const marginScore = priceP+marginP;
  const revP = p.reviews>=1000?6 : p.reviews>=300?5 : p.reviews>=100?4 : p.reviews>=30?3 : p.reviews>=10?2 : 1;
  const ratP = p.rating>=4.8?4 : p.rating>=4.5?3 : p.rating>=4.0?2 : 1;
  const demand = revP+ratP;
  const competition = p.shops<=20?10 : p.shops<=80?7 : p.shops<=300?4 : 2;
  const total = momentum+creators+content+marginScore+demand+competition;
  return {total, margin, cflags, dims:[
    {name:"โมเมนตัมยอดขาย", v:momentum, max:25},
    {name:"ครีเอเตอร์ยังน้อย", v:creators, max:20},
    {name:"ทำคอนเทนต์ปังง่าย", v:content, max:20},
    {name:"มาร์จิ้น & ราคา", v:marginScore, max:15},
    {name:"หลักฐานดีมานด์", v:demand, max:10},
    {name:"คู่แข่งไม่แน่น", v:competition, max:10},
  ]};
}
function tier(t){
  if(t>=80) return {key:"go",label:"ลุยเลย",cls:"t-go"};
  if(t>=65) return {key:"watch",label:"น่าสนใจ",cls:"t-watch"};
  if(t>=50) return {key:"mid",label:"กลาง ๆ",cls:"t-mid"};
  return {key:"skip",label:"ผ่าน",cls:"t-skip"};
}
function verdictText(p,s){
  const tr=tier(s.total).key, low=p.creators<=20, hot=p.trend>=100;
  if(tr==="go")   return hot&&low ? "จังหวะทองเลย — ยอดกำลังพุ่งแต่คนทำยังน้อยมาก รีบทำคอนเทนต์วันนี้ก่อนตลาดแน่น" : "สัญญาณดีครบ ทั้งดีมานด์และช่องว่างคอนเทนต์ ลุยได้เลย";
  if(tr==="watch")return "มีของ น่าลองทำ 1–2 คลิปทดสอบ ถ้าเอนเกจดีค่อยอัดหนัก";
  if(tr==="mid")  return p.creators>150 ? "ดีมานด์มีจริง แต่คนทำเยอะแล้ว ต้องหามุมใหม่ให้ต่างถึงจะแทรกได้" : "ก้ำกึ่ง รอสัญญาณโตชัดกว่านี้ หรือเก็บไว้เป็นตัวสำรอง";
  return "ยังไม่คุ้มโฟกัส — ตลาดแน่นไปแล้วหรือดีมานด์ยังไม่พอ ข้ามไปหาตัวอื่นก่อน";
}
function angles(p){
  const a=[];
  if(p.f.problem) a.push('เปิดด้วยปัญหาที่ลูกค้าเจอจริง แล้วโชว์ของแก้ปัญหาใน 15 วิแรก');
  if(p.f.wow)     a.push('ฮุก 3 วิแรกด้วยภาพผลลัพธ์ “ว้าว” ก่อน ค่อยเฉลยว่าใช้ตัวนี้');
  if(p.f.demo)    a.push('คลิปเดโมใช้งานจริง โชว์ before / after ให้เห็นชัด ๆ');
  if(p.f.easy)    a.push('ถ่ายมือถือช็อตเดียว รีวิวแบบติดมือ ไม่ต้องเซ็ตสตูดิโอ');
  const byCat={"ความงาม":"สาย GRWM / รีวิวผิวจริง 7 วันเห็นผล","สุขภาพ":"เล่าเป็นของดูแลตัวเองหลังเลิกงาน สายรักสุขภาพ","แม่และเด็ก":"มุมคุณแม่มือใหม่ — ปัญหาลูก + วิธีแก้แบบเรียลใจ","ของใช้ในบ้าน":"มุมแต่งห้อง/จัดโต๊ะ aesthetic + ของมันต้องมี","ครัว":"คลิปทำเมนูง่าย ๆ โชว์ความไวความสะดวก","สัตว์เลี้ยง":"มุมทาสหมาทาสแมว คลิปรีแอ็กชันน้อง ๆ","แกดเจ็ต":"สาย life hack / ของบนโต๊ะทำงานสายมินิมอล","แฟชั่น":"คลิปแมตช์ลุค / โชว์ดีเทลใกล้ ๆ"};
  if(byCat[p.cat]) a.push(byCat[p.cat]);
  return a.slice(0,3);
}
function risks(p,s){
  const r=[];
  if(s.margin<35) r.push('กำไรต่อชิ้นบาง — ระวังต้นทุนค่าแอด/ค่าคอมกินกำไร');
  if(p.creators>150) r.push('เริ่มมีคนทำเยอะ ต้องหามุมใหม่ให้ต่างถึงจะเด่น');
  if(p.shops>250) r.push('ร้านขายเยอะ เลี่ยงแข่งราคาล้วน ๆ เน้นชนะที่คอนเทนต์');
  if(p.trend<20) r.push('โมเมนตัมเริ่มแผ่ว รอดูอีก 1 สัปดาห์ก่อนอัดสต๊อกหนัก');
  if(p.reviews<50) r.push('รีวิวยังน้อย ของอาจใหม่มาก — สั่งตัวอย่างมาลองก่อนสต๊อกเยอะ');
  if(p.rating<4.5) r.push('เรทติ้งไม่สูง เช็กรีวิวลบว่าติดปัญหาอะไร กันลูกค้าคืนของ');
  if(!r.length) r.push('ความเสี่ยงต่ำ — แต่รีบทำก่อนคนอื่นเห็นแล้วตลาดแน่น');
  return r;
}
const ringColor={go:"var(--emerald)",watch:"var(--teal)",mid:"var(--amber)",skip:"var(--grey)"};

/* ---------------- render ---------------- */
let FILTER="all", LIVE="all";
function ranked(){ return P.map(p=>({p,s:score(p)})).sort((a,b)=>b.s.total-a.s.total); }
function fmt(n){ return Number(n).toLocaleString('en-US'); }
function renderHome(){
  const r=ranked();
  document.getElementById('stat-total').textContent=P.length;
  document.getElementById('stat-go').textContent=r.filter(x=>x.s.total>=80).length;
  document.getElementById('stat-top').textContent=r.length?r[0].s.total:'—';
}
function renderFilters(){
  const defs=[["all","ทั้งหมด"],["go","ลุยเลย"],["watch","น่าสนใจ"],["mid","กลาง ๆ"]];
  document.getElementById('filters').innerHTML=defs.map(([k,l])=>`<button class="chip ${FILTER===k?'on':''}" data-f="${k}">${l}</button>`).join('');
  document.querySelectorAll('#filters .chip').forEach(c=>c.onclick=()=>{FILTER=c.dataset.f;renderFilters();renderList();});
}
function renderLiveSeg(){
  const defs=[["all","ทั้งหมด"],["out","⚫ ยังไม่มีใน Live"],["in","🔴 มีใน Live"]];
  document.getElementById('liveseg').innerHTML=defs.map(([k,l])=>`<button data-live="${k}" class="${LIVE===k?'on':''}">${l}</button>`).join('');
  document.querySelectorAll('#liveseg button').forEach(b=>b.onclick=()=>{LIVE=b.dataset.live;renderLiveSeg();renderList();});
}
function renderList(){
  let r=ranked();
  if(FILTER!=="all") r=r.filter(x=>tier(x.s.total).key===FILTER);
  if(LIVE!=="all") r=r.filter(x=>LIVE==="in"? liveStatus(x.p).inLive : !liveStatus(x.p).inLive);
  const el=document.getElementById('list');
  if(!r.length){ el.innerHTML=`<p style="color:var(--ink-soft);padding:30px 6px;text-align:center">ยังไม่มีสินค้าในกลุ่มนี้</p>`; return; }
  el.innerHTML=r.map((x,i)=>{
    const {p,s}=x, t=tier(s.total), rank=i+1, ls=liveStatus(p);
    const tags=[];
    if(p.trend>=80) tags.push(`<span class="tag">🔥 โต ${p.trend}%</span>`);
    if(p.creators<=25) tags.push(`<span class="tag">👥 คนทำน้อย (${p.creators})</span>`);
    if(s.cflags>=4) tags.push(`<span class="tag">🎬 คอนเทนต์ปังง่าย</span>`);
    if(p.shops>250) tags.push(`<span class="tag warn">⚔️ คู่แข่งเยอะ</span>`);
    if(p.trend<20) tags.push(`<span class="tag warn">📉 โมเมนตัมแผ่ว</span>`);
    const liveTag=`<span class="tag ${ls.tagCls}">${ls.chip}</span>`;
    const q=encodeURIComponent(p.name);
    const links=`<div class="tr-links" onclick="event.stopPropagation()">
      <a class="shopee" href="https://shopee.co.th/search?keyword=${q}" target="_blank" rel="noopener">🛒 Shopee</a>
      <a href="https://www.lazada.co.th/catalog/?q=${q}" target="_blank" rel="noopener">🛍️ Lazada</a>
      <a href="https://www.tiktok.com/search?q=${q}" target="_blank" rel="noopener">▶️ TikTok</a>
    </div>`;
    const isTop = FILTER==="all" && LIVE==="all" && i===0;
    return `${isTop?'<div class="toppick-tag">🏆 ตัวท็อปวันนี้ — โอกาสดีที่สุด</div>':''}
    <div class="card ${isTop?'hero-card':''}" data-id="${p.id}">
      <span class="rank">${rank}</span><div class="thumb">${p.emoji}</div>
      <div class="card-body"><div class="card-name">${p.name}</div><div class="card-cat">${p.cat} · ฿${fmt(p.price)}</div><div class="tags">${liveTag}${tags.slice(0,2).join('')}</div>${links}</div>
      <div class="score-wrap"><div class="score-num ${t.cls}">${s.total}</div><div class="score-max">/ 100</div><span class="tierbadge ${t.cls}">${t.label}</span></div>
    </div>`;
  }).join('');
  el.querySelectorAll('.card').forEach(c=>c.onclick=()=>openDetail(c.dataset.id));
}
function openDetail(id){
  const p=P.find(x=>String(x.id)===String(id)); if(!p) return;
  const s=score(p), t=tier(s.total), ls=liveStatus(p);
  const ring=`conic-gradient(${ringColor[t.key]} ${s.total*3.6}deg, #EAE8DF 0deg)`;
  const livecard=`<div class="livecard ${ls.key}"><span class="lic">${ls.icon}</span><div><b>${ls.title}</b>${ls.desc}</div></div>`;
  const dims=s.dims.map(d=>`<div class="dim"><span class="dim-name">${d.name}</span><span class="dim-val">${d.v}/${d.max}</span><div class="bar"><i style="width:${Math.round(d.v/d.max*100)}%"></i></div></div>`).join('');
  const trendCls=p.trend>=0?'up':'down', trendSign=p.trend>=0?'▲':'▼';
  const stats=`
    <div class="stat"><div class="sl">ยอดขาย 7 วัน</div><div class="sv">${fmt(p.sales)} <small>ชิ้น</small></div></div>
    <div class="stat"><div class="sl">โต WoW</div><div class="sv ${trendCls}">${trendSign} ${Math.abs(p.trend)}%</div></div>
    <div class="stat"><div class="sl">ครีเอเตอร์</div><div class="sv">${fmt(p.creators)} <small>คน</small></div></div>
    <div class="stat"><div class="sl">ร้านที่ขาย</div><div class="sv">${fmt(p.shops)} <small>ร้าน</small></div></div>
    <div class="stat"><div class="sl">มาร์จิ้น</div><div class="sv">${Math.round(s.margin)}% <small>฿${fmt(p.price-p.cost)}/ชิ้น</small></div></div>
    <div class="stat"><div class="sl">รีวิว / เรทติ้ง</div><div class="sv">${p.rating} <small>★ · ${fmt(p.reviews)}</small></div></div>
    <div class="stat"><div class="sl">ขายผ่าน Live</div><div class="sv ${ls.inLive?'down':'up'}">${p.live||0}% <small>${ls.inLive?'มีใน Live':'ยังไม่มี'}</small></div></div>`;
  const ang=angles(p).map(a=>`<div class="list-item"><span class="li-ic a">🎬</span><span>${a}</span></div>`).join('');
  const rsk=risks(p,s).map(a=>`<div class="list-item"><span class="li-ic r">⚠️</span><span>${a}</span></div>`).join('');
  document.getElementById('detail').innerHTML=`
    <div class="d-head"><div class="d-thumb">${p.emoji}</div><div><div class="d-name">${p.name}</div><div class="d-cat">${p.cat}${p.days?` · ลงขายมา ${p.days} วัน`:''}</div></div></div>
    <div class="verdict"><div class="ring" style="background:${ring}"><span class="rv" style="color:${ringColor[t.key]}">${s.total}</span></div>
      <div class="verdict-txt"><div class="vt" style="color:${ringColor[t.key]}">${t.label} · ${s.total}/100</div><div class="vd">${verdictText(p,s)}</div></div></div>
    <div class="sec-label">ช่องทาง Live</div>${livecard}
    <div class="sec-label">คะแนนแยกรายด้าน</div><div class="dims">${dims}</div>
    <div class="sec-label">ตัวเลขสำคัญ</div><div class="grid2">${stats}</div>
    <div class="sec-label">มุมคอนเทนต์แนะนำ</div>${ang}
    <div class="sec-label">ต้องระวัง</div>${rsk}
    <div class="sec-label">ไปหาสินค้านี้ / สินค้าคล้ายกัน</div>
    <div class="tr-links">
      <a class="shopee" href="https://shopee.co.th/search?keyword=${encodeURIComponent(p.name)}" target="_blank" rel="noopener">🛒 หาใน Shopee</a>
      <a href="https://www.lazada.co.th/catalog/?q=${encodeURIComponent(p.name)}" target="_blank" rel="noopener">🛍️ Lazada</a>
      <a href="https://www.tiktok.com/search?q=${encodeURIComponent(p.name)}" target="_blank" rel="noopener">▶️ TikTok</a>
    </div>
    <button class="cta ghost" onclick="goBack()" style="margin-top:26px">← กลับไปดูอันดับ</button>`;
  go('detail');
}

/* ---------------- add product ---------------- */
document.getElementById('flags').addEventListener('change',e=>{
  const l=e.target.closest('.flag'); if(l) l.classList.toggle('checked',e.target.checked);
});
document.getElementById('addForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f=e.target, g=n=>f.elements[n], btn=document.getElementById('addBtn');
  const p={ id:"local-"+Date.now(), emoji:(g('emoji').value||'🛍️').trim(), name:g('name').value.trim(), cat:g('cat').value,
    price:+g('price').value, cost:+g('cost').value, sales:+g('sales').value, trend:+g('trend').value,
    creators:+g('creators').value, shops:+g('shops').value, reviews:+g('reviews').value, rating:+g('rating').value, days:0, live:+g('live').value||0,
    f:{wow:g('wow').checked?1:0, demo:g('demo').checked?1:0, problem:g('problem').checked?1:0, easy:g('easy').checked?1:0} };
  if(HAS_DB){
    btn.disabled=true; btn.textContent="กำลังบันทึก…";
    try{
      const {data,error}=await sb.from("products").insert(toRow(p)).select().single();
      if(error) throw error;
      p.id=data.id;
      // ถ้าเดิมโชว์ seed อยู่ ให้ล้างแล้วเริ่มจาก DB จริง
      if(P.length && String(P[0].id).startsWith("s")) P=[];
      toast("บันทึกลงฐานข้อมูลแล้ว ☁️");
    }catch(err){ console.warn(err); toast("บันทึกออนไลน์ไม่ได้ — เก็บชั่วคราวในเครื่อง"); }
    btn.disabled=false; btn.textContent="⚡ ให้คะแนน & บันทึก";
  }else{
    toast("ให้คะแนนแล้ว (โหมดตัวอย่าง ยังไม่บันทึกถาวร)");
  }
  P.push(p);
  f.reset(); document.querySelectorAll('.flag').forEach(x=>x.classList.remove('checked'));
  renderHome(); openDetail(p.id);
});

/* ---------------- สินค้ามาแรงจาก YouTube ---------------- */
function ytClean(t){
  let s=(t||'').split(/[—\|｜]/)[0];
  s=s.replace(/#\S+/g,'').replace(/รีวิว|แกะกล่อง|unbox(ing)?|review|พาส่อง/gi,'').replace(/[!?]/g,'');
  s=s.replace(/[\uD800-\uDFFF]/g,'').trim();        // ตัด emoji/surrogate กันพัง encodeURIComponent
  return Array.from(s).slice(0,50).join('') || 'สินค้า';
}
async function loadHot(){
  const el=document.getElementById('hot-list'), sub=document.getElementById('hot-sub');
  if(!HAS_DB){ sub.textContent="ต้องต่อฐานข้อมูลก่อน"; return; }
  el.innerHTML=`<p style="color:var(--ink-soft);padding:24px 6px;text-align:center">กำลังโหลด…</p>`;
  try{
    const {data,error}=await sb.from('yt_products').select('*').order('views',{ascending:false}).limit(30);
    if(error) throw error;
    if(!data||!data.length){ sub.textContent="ยังไม่มีข้อมูล (cron ดึงให้ทุกวัน)"; el.innerHTML=''; return; }
    sub.textContent=`${data.length} สินค้าที่คนไทยกำลังดู/รีวิว · เรียงตามยอดวิว`;
    el.innerHTML=data.map((p,i)=>{
      const q=encodeURIComponent(ytClean(p.title));
      const views=Number(p.views).toLocaleString('en-US');
      return `<div class="hot" style="position:relative">
        <span class="hot-rank">${i+1}</span>
        <img class="hot-thumb" src="${p.thumbnail||''}" loading="lazy" alt="">
        <div class="hot-body">
          <div class="hot-title">${p.title}</div>
          <div class="hot-meta">${p.channel||''} · <span class="v">👁️ ${views} วิว</span></div>
          <span class="hot-cat">${p.category}</span>
          <div class="tr-links">
            <a class="shopee" href="https://shopee.co.th/search?keyword=${q}" target="_blank" rel="noopener">🛒 หาใน Shopee</a>
            <a href="https://www.youtube.com/watch?v=${p.video_id}" target="_blank" rel="noopener">▶️ ดูคลิป</a>
          </div>
        </div>
      </div>`;
    }).join('');
  }catch(e){ console.warn(e); sub.textContent="โหลดไม่ได้: "+e.message; el.innerHTML=''; }
}

/* ---------------- trends (เรดาร์เทรนด์ไทย) ---------------- */
const ANGLE = {
  "หวย / ดวง":        {ic:"🔮", prod:false, txt:"สายมู/เลขเด็ด — ทำคลิปตีความ หรือขายของมงคล/เครื่องรางที่เกี่ยว จับจังหวะก่อนหวยออก"},
  "กีฬา":             {ic:"⚽", prod:false, txt:"คลิปวิเคราะห์/รีแอกชันหลังเกม, ขายเสื้อทีม/ของเชียร์ — ทำให้ทันช่วงกระแสร้อน"},
  "การเมือง / ข่าว":  {ic:"⚠️", prod:false, txt:"หัวข้ออ่อนไหว — เน้นสรุปข่าว/ให้ข้อมูล ไม่ควรขายของตรงๆ ระวังดราม่า"},
  "การเงิน":          {ic:"📈", prod:false, txt:"คอนเทนต์ให้ความรู้/เตือนภัย สร้างความน่าเชื่อถือ ต่อยอดเป็นที่ปรึกษา"},
  "บันเทิง / ดารา":   {ic:"🎬", prod:false, txt:"รีแอกชัน/รีวิว, ตามสไตล์ดารา, ขายสินค้าที่คนดังใช้ — แรงช่วงกระแสพีค"},
  "ไลฟ์สไตล์ / สินค้า":{ic:"🎯", prod:true,  txt:"โอกาสขายของ! หาสินค้าที่เกี่ยวมาทำรีวิว/คอนเทนต์เลย — นี่คือเทรนด์ที่ปั้นยอดขายได้"},
  "กระแสสังคม":       {ic:"💡", prod:false, txt:"จับโมเมนต์ทำคอนเทนต์ให้ทัน — เล่นกับกระแสก่อนมันจาง คนกำลังสนใจสูงสุด"},
};
async function loadTrends(){
  const el=document.getElementById('trends-list'), sub=document.getElementById('trends-sub');
  if(!HAS_DB){ sub.textContent="ต้องต่อฐานข้อมูลก่อน"; return; }
  el.innerHTML=`<p style="color:var(--ink-soft);padding:24px 6px;text-align:center">กำลังโหลดเทรนด์…</p>`;
  try{
    const {data,error}=await sb.from('trends').select('*').order('trend_date',{ascending:false}).order('volume',{ascending:false}).limit(20);
    if(error) throw error;
    if(!data||!data.length){ sub.textContent="ยังไม่มีข้อมูล (cron จะดึงให้อัตโนมัติ)"; el.innerHTML=''; return; }
    const d=data[0].trend_date;
    sub.textContent=`อัปเดตล่าสุด ${d} · เรียงตามยอดค้นหา · ${data.length} เทรนด์`;
    el.innerHTML=data.map((t,i)=>{
      const a=ANGLE[t.category]||ANGLE["กระแสสังคม"];
      const vol=t.volume?`🔍 ${Number(t.volume).toLocaleString('en-US')}+`:'';
      const news=t.news_title?`<div class="tr-news"><b>${t.news_source||''}:</b> ${t.news_title}</div>`:'';
      const q=encodeURIComponent(t.title);
      const links=`<div class="tr-links">
        <a class="shopee" href="https://shopee.co.th/search?keyword=${q}" target="_blank" rel="noopener">🛒 หาสินค้าใน Shopee</a>
        <a href="https://www.lazada.co.th/catalog/?q=${q}" target="_blank" rel="noopener">🛍️ Lazada</a>
        <a href="https://www.tiktok.com/search?q=${q}" target="_blank" rel="noopener">▶️ TikTok</a>
      </div>`;
      return `<div class="trend">
        <div class="tr-rank">${i+1}</div>
        <div class="tr-body">
          <div class="tr-top"><span class="tr-title">${t.title}</span>${vol?`<span class="tr-vol">${vol}</span>`:''}</div>
          <span class="tr-cat ${a.prod?'prod':''}">${a.ic} ${t.category}</span>
          ${news}
          <div class="tr-angle ${a.prod?'prod':''}"><span>${a.ic}</span><span>${a.txt}</span></div>
          ${links}
        </div>
      </div>`;
    }).join('');
  }catch(e){ console.warn(e); sub.textContent="โหลดไม่ได้: "+e.message; el.innerHTML=''; }
}

/* ---------------- toast + nav ---------------- */
let toastT;
function toast(msg){
  const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2600);
}
let CURRENT='home';
const navStack=[];
function switchScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('s-'+name); if(!el) return;
  el.classList.add('active');
  if(name==='results'){ renderLiveSeg(); renderFilters(); renderList(); }
  if(name==='hot'){ loadHot(); }
  if(name==='trends'){ loadTrends(); }
  document.getElementById('topback').style.display = name==='home' ? 'none' : 'flex';
  window.scrollTo({top:0,behavior:'instant'});
}
function go(name){
  if(name!==CURRENT) navStack.push(CURRENT);
  CURRENT=name; switchScreen(name);
  try{ history.pushState({s:name},''); }catch(e){}   // เผื่อปุ่ม back มือถือใช้ได้
}
function goBack(){
  const p=navStack.pop()||'home';
  CURRENT=p; switchScreen(p);
}
window.addEventListener('popstate', ()=>{ if(CURRENT!=='home') goBack(); });
window.go=go; window.goBack=goBack;

/* ---------------- init ---------------- */
(function(){
  const d=new Date(), th=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  document.getElementById('today').textContent=`${d.getDate()} ${th[d.getMonth()]} ${d.getFullYear()+543}`;
  renderHome();
  loadData();
})();
