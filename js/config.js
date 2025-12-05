/**
 * ============================================
 * CONFIG - ค่าตั้งต่างๆ ของแอพ
 * ============================================
 */

// Storage Keys สำหรับ localStorage
const CONFIG = {
  // ข้อมูลเดือนปัจจุบัน (รีเซ็ตได้ด้วย Next Month)
  STORAGE_KEY: 'money-notes-transactions',
  
  // ข้อมูลทั้งหมดตลอดกาล (ถาวร)
  ALL_TIME_KEY: 'money-notes-all-transactions'
};

// หมวดหมู่สำหรับรายรับ
const INCOME_CATEGORIES = [
  'Salary', 
  'Bonus', 
  'Freelance', 
  'Other Income'
];

// หมวดหมู่สำหรับรายจ่าย
const EXPENSE_CATEGORIES = [
  'Food',
  '7-Eleven',
  'AIS and Premium',
  'Cigarettes',
  'Bills', 
  'Transport', 
  'Shopping', 
  'Other'
];

// คำสำคัญสำหรับตรวจจับหมวดหมู่อัตโนมัติจาก slip
const CATEGORY_KEYWORDS = {
  'Bills': [
    'ค่าบ้าน', 'ค่าบิล', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าโทรศัพท์', 
    'ค่าเน็ต', 'ค่า.internet'
  ],
  'Food': [
    'อาหาร', 'ข้าว', 'กาแฟ', 'coffee', 'ร้านอาหาร', 
    'foodpanda', 'grab food', 'lineman', 'mcdonald', 'kfc'
  ],
  'Transport': [
    'grab', 'bolt', 'taxi', 'แท็กซี่', 'bts', 'mrt', 
    'น้ำมัน', 'ปั๊ม', 'ptt', 'ค่ารถ'
  ],
  'Shopping': [
    'เซเว่น', 'โลตัส', 'บิ๊กซี', 'makro', 
    'lazada', 'shopee', 'central'
  ],
  'AIS and Premium': [
    'netflix', 'youtube', 'spotify', 'หนัง', 'movie', 'Ai',
    'เน็ต', 'ค่าเน็ต', 'internet', 'ais', 'true', 'dtac'
  ]
};

// ชื่อเดือนภาษาอังกฤษ
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// ชื่อวันภาษาอังกฤษ
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
