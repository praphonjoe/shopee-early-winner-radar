/* ============================================================
   Supabase config — ใส่ค่าจาก Supabase Dashboard → Project Settings → API
   anon key เปิดเผยได้ (ปลอดภัยด้วย Row Level Security)
   ถ้ายังไม่ใส่ แอปจะทำงานด้วยข้อมูลตัวอย่าง (โหมดออฟไลน์) โดยอัตโนมัติ
   ============================================================ */
window.__CONFIG__ = {
  SUPABASE_URL: "",   // เช่น "https://abcdxyz.supabase.co"
  SUPABASE_ANON_KEY: "" // เช่น "eyJhbGciOi..."
};
