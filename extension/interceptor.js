/* ============================================================
   interceptor.js — รันใน MAIN world (คอนเท็กซ์เดียวกับหน้า Shopee)
   หน้าที่: ดักข้อมูลสินค้าที่ Shopee โหลดให้เบราว์เซอร์คุณอยู่แล้ว
   (Shopee เรียก API ตัวเองสำเร็จเพราะคุณคือคนจริง — เราแค่ "แอบฟัง" ผล)
   ============================================================ */
(function () {
  var ITEM_RE = /\/api\/v4\/(item\/get|pdp\/get_pc|item\/get_ratings)/;

  function extractItem(text) {
    try {
      var j = JSON.parse(text);
      var d = j && j.data;
      if (!d) return null;
      // /item/get -> data (มี name ตรงๆ) ; /pdp/get_pc -> data.item
      var it = d.item || (d.name ? d : null);
      if (it && it.name) return it;
    } catch (e) {}
    return null;
  }

  function relay(text) {
    var it = extractItem(text);
    if (it) window.postMessage({ __ewr: true, item: it }, "*");
  }

  // --- hook fetch ---
  var origFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    var url = "";
    try { url = (args[0] && (args[0].url || args[0])) || ""; } catch (e) {}
    var p = origFetch.apply(this, args);
    if (ITEM_RE.test(String(url))) {
      p.then(function (res) {
        try { res.clone().text().then(relay); } catch (e) {}
        return res;
      });
    }
    return p;
  };

  // --- hook XMLHttpRequest ---
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) {
    this.__ewrUrl = u;
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    if (ITEM_RE.test(String(xhr.__ewrUrl || ""))) {
      xhr.addEventListener("load", function () {
        try { relay(xhr.responseText); } catch (e) {}
      });
    }
    return origSend.apply(this, arguments);
  };

  console.log("[ก่อนกระแส] interceptor พร้อมทำงาน 🎯");
})();
