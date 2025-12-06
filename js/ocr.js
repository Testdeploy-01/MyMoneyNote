/**
 * ============================================
 * OCR - Scan Slip ด้วย Tesseract.js
 * ============================================
 * Tesseract.js is loaded dynamically on first use to improve initial load time
 */

// Track if Tesseract is loaded
let tesseractLoaded = false;
let tesseractLoadPromise = null;

/**
 * Load Tesseract.js dynamically (saves ~2-3MB on initial page load)
 */
async function loadTesseract() {
  if (tesseractLoaded) return;
  if (tesseractLoadPromise) return tesseractLoadPromise;

  tesseractLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => {
      tesseractLoaded = true;
      console.log('Tesseract.js loaded dynamically');
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
    document.head.appendChild(script);
  });

  return tesseractLoadPromise;
}

// Thai month names mapping
const THAI_MONTHS = {
  'ม.ค.': '01', 'มค': '01', 'มกราคม': '01',
  'ก.พ.': '02', 'กพ': '02', 'กุมภาพันธ์': '02',
  'มี.ค.': '03', 'มีค': '03', 'มีนาคม': '03',
  'เม.ย.': '04', 'เมย': '04', 'เมษายน': '04',
  'พ.ค.': '05', 'พค': '05', 'พฤษภาคม': '05',
  'มิ.ย.': '06', 'มิย': '06', 'มิถุนายน': '06',
  'ก.ค.': '07', 'กค': '07', 'กรกฎาคม': '07',
  'ส.ค.': '08', 'สค': '08', 'สิงหาคม': '08',
  'ก.ย.': '09', 'กย': '09', 'กันยายน': '09',
  'ต.ค.': '10', 'ตค': '10', 'ตุลาคม': '10',
  'พ.ย.': '11', 'พย': '11', 'พฤศจิกายน': '11',
  'ธ.ค.': '12', 'ธค': '12', 'ธันวาคม': '12'
};

/**
 * ดึงจำนวนเงินจากข้อความ
 * @param {string} text - ข้อความจาก OCR
 * @returns {number|null} จำนวนเงิน หรือ null
 */
function extractAmount(text) {
  const patterns = [
    /จำนวน[เงิน]*\s*:?\s*([\d,]+\.?\d*)/i,
    /ยอด[เงิน]*\s*:?\s*([\d,]+\.?\d*)/i,
    /amount\s*:?\s*([\d,]+\.?\d*)/i,
    /THB\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:THB|บาท)/i,
    /฿\s*([\d,]+\.?\d*)/i,
    /([\d]{1,3}(?:,\d{3})*(?:\.\d{2}))/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 10000000) {
        return amount;
      }
    }
  }
  return null;
}

/**
 * ดึงวันที่จากข้อความ
 * @param {string} text - ข้อความจาก OCR
 * @returns {string|null} วันที่ในรูปแบบ YYYY-MM-DD หรือ null
 */
function extractDate(text) {
  // Pattern: "1 ธ.ค. 2567"
  const thaiDateMatch = text.match(
    /(\d{1,2})\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{2,4})/i
  );

  if (thaiDateMatch) {
    let [, day, monthThai, year] = thaiDateMatch;
    const month = THAI_MONTHS[monthThai] || THAI_MONTHS[monthThai.replace(/\./g, '')] || '01';
    if (year.length === 2) year = '25' + year;
    if (parseInt(year) > 2500) year = parseInt(year) - 543;
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  return null;
}

/**
 * ดึงเวลาจากข้อความ
 * @param {string} text - ข้อความจาก OCR
 * @returns {string|null} เวลาในรูปแบบ HH:MM หรือ null
 */
function extractTime(text) {
  const patterns = [
    /(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:น\.?)?/,
    /(\d{1,2})\.(\d{2})\s*(?:น\.?)/,
    /เวลา\s*:?\s*(\d{1,2})[:\.](\d{2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const hour = parseInt(match[1]);
      if (hour >= 0 && hour <= 23) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
    }
  }
  return null;
}

/**
 * ดึง memo/note จากข้อความ
 * @param {string} text - ข้อความจาก OCR
 * @returns {string} memo หรือ empty string
 */
function extractMemo(text) {
  const patterns = [
    /บันทึกช่วยจ[ำํา]+\s+(.+?)(?:\n|$)/i,
    /ช่วยจ[ำํา]+\s+(.+?)(?:\n|$)/i,
    /บันทึก\s*:?\s*(.+?)(?:\n|$)/i,
    /หมายเหตุ\s*:?\s*(.+?)(?:\n|$)/i,
    /memo\s*:?\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim()
        .replace(/[|\\\/\[\]{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return '';
}

/**
 * ประมวลผลข้อมูลจาก slip
 * @param {string} text - ข้อความจาก OCR
 * @returns {Object} { amount, date, time, memo, category }
 */
function parseSlipData(text) {
  console.log('OCR Text:', text);

  const amount = extractAmount(text);
  const date = extractDate(text);
  const time = extractTime(text);
  const memo = extractMemo(text);
  const category = memo ? detectCategoryFromText(memo) : null;

  return { amount, date, time, memo, category };
}

/**
 * Scan slip ด้วย Tesseract
 * @param {File} file - ไฟล์รูปภาพ
 * @param {Function} onProgress - callback สำหรับ progress
 * @returns {Promise<Object>} ข้อมูลที่ดึงได้
 */
async function scanSlip(file, onProgress) {
  // Load Tesseract.js dynamically on first use
  if (!tesseractLoaded) {
    if (onProgress) onProgress('Loading...');
    await loadTesseract();
  }

  const result = await Tesseract.recognize(file, 'tha+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  return parseSlipData(result.data.text);
}
