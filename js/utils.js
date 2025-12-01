/**
 * ============================================
 * UTILS - ฟังก์ชันช่วยเหลือทั่วไป
 * ============================================
 */

/**
 * ดึงวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
 * @returns {string} วันที่ในรูปแบบ ISO
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * ดึงเวลาปัจจุบันในรูปแบบ HH:MM
 * @returns {string} เวลาในรูปแบบ 24 ชั่วโมง
 */
function getCurrentTime() {
  return new Date().toTimeString().slice(0, 5);
}

/**
 * แปลงวันที่เป็นชื่อวัน
 * @param {string} dateString - วันที่ในรูปแบบ string
 * @returns {string} ชื่อวัน (Sun, Mon, ...)
 */
function getDayName(dateString) {
  return DAY_NAMES[new Date(dateString).getDay()];
}

/**
 * แปลงตัวเลขเป็นรูปแบบเงินบาท
 * @param {number} amount - จำนวนเงิน
 * @returns {string} เงินในรูปแบบ ฿1,234.00
 */
function formatMoney(amount) {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB' 
  }).format(amount);
}

/**
 * สร้าง ID ไม่ซ้ำกันสำหรับแต่ละ transaction
 * @returns {string} UUID หรือ custom ID
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * ตรวจจับหมวดหมู่จากข้อความ
 * @param {string} text - ข้อความที่จะตรวจสอบ
 * @returns {string|null} ชื่อหมวดหมู่ หรือ null ถ้าไม่พบ
 */
function detectCategoryFromText(text) {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return null;
}
