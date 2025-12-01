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
  'Transport', 
  'Shopping', 
  'Bills', 
  'Entertainment', 
  'Health', 
  'Other'
];

// คำสำคัญสำหรับตรวจจับหมวดหมู่อัตโนมัติจาก slip
const CATEGORY_KEYWORDS = {
  'Bills': [
    'เน็ต', 'ค่าเน็ต', 'internet', 'ais', 'true', 'dtac', 
    'ค่าไฟ', 'ไฟฟ้า', 'ค่าน้ำ', 'ประปา', 'ค่าโทรศัพท์', 'ค่าเช่า'
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
    'เซเว่น', '7-eleven', 'โลตัส', 'บิ๊กซี', 'makro', 
    'lazada', 'shopee', 'central'
  ],
  'Entertainment': [
    'netflix', 'youtube', 'spotify', 'หนัง', 'movie', 'เกม'
  ],
  'Health': [
    'โรงพยาบาล', 'hospital', 'คลินิก', 'ยา', 'pharmacy'
  ]
};

// ชื่อเดือนภาษาอังกฤษ
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// ชื่อวันภาษาอังกฤษ
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
