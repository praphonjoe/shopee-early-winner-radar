/* ============================================================
   interceptor.js — MAIN world
   ดักข้อมูลสินค้าที่ Shopee โหลดให้เบราว์เซอร์คุณ "ทุกหน้า"
   (หน้าค้นหา/หมวด/มาแรง = โหลดทีละหลายสิบตัว → เก็บยกล็อต)
   ============================================================ */
(function () {
  // endpoint ที่มีข้อมูลสินค้า (ค้นหา / แนะนำ / flash sale / ร้าน / รายละเอียด)
  var API_RE = /\/api\/v4\/.*(search_items|recommend|flash_sale|get_shop|item\/get|pdp\/get_pc|find_similar|bundle_deal|collection)/i;

  // เดินหา object ที่เป็น "สินค้า" (มี itemid + name + price) แบบ recursive
  function collect(node, out, depth) {
    if (!node || depth > 8 || out.length > 400) return;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) collect(node[i], out, depth + 1);
      return;
    }
    if (typeof node === "object") {
      if (node.itemid && node.name && (node.price != null || node.price_min != null)) {
        out.push(node);
      }
      for (var k in node) {
        var v = node[k];
        if (v && typeof v === "object") collect(v, out, depth + 1);
      }
    }
  }

  function relay(text) {
    try {
      var j = JSON.parse(text);
      var out = [];
      collect(j, out, 0);
      if (out.length) window.postMessage({ __ewr: true, items: out }, "*");
    } catch (e) {}
  }

  // hook fetch
  var origFetch = window.fetch;
  window.fetch = function () {
    var args = arguments, url = "";
    try { url = (args[0] && (args[0].url || args[0])) || ""; } catch (e) {}
    var p = origFetch.apply(this, args);
    if (API_RE.test(String(url))) {
      p.then(function (res) { try { res.clone().text().then(relay); } catch (e) {} return res; });
    }
    return p;
  };

  // hook XHR
  var oOpen = XMLHttpRequest.prototype.open, oSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    var x = this;
    if (API_RE.test(String(x.__u || ""))) {
      x.addEventListener("load", function () { try { relay(x.responseText); } catch (e) {} });
    }
    return oSend.apply(this, arguments);
  };

  console.log("[ก่อนกระแส] interceptor พร้อม 🎯 (ดักหน้าค้นหา/หมวด/สินค้า)");
})();
