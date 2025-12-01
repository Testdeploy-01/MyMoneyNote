/**
 * ============================================
 * UI - จัดการ User Interface
 * ============================================
 */

// ============================================
// Notification System
// ============================================

let noticeTimeout = null;

/**
 * แสดงข้อความแจ้งเตือน
 * @param {HTMLElement} element - element ที่จะแสดงข้อความ
 * @param {string} type - 'success' หรือ 'error'
 * @param {string} message - ข้อความที่จะแสดง
 */
function showNotice(element, type, message) {
  if (!element) return;
  
  if (noticeTimeout) {
    clearTimeout(noticeTimeout);
  }
  
  element.textContent = message;
  element.className = `notice ${type}`;
  element.style.display = 'flex';
  
  noticeTimeout = setTimeout(() => {
    element.style.display = 'none';
  }, 3200);
}

// ============================================
// Summary Display
// ============================================

/**
 * คำนวณยอดรวมจาก transactions
 * @param {Array} transactions - รายการ transactions
 * @returns {Object} { income, expense }
 */
function calculateTotals(transactions) {
  return transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

/**
 * อัพเดทการแสดงยอดสรุป
 * @param {Object} elements - DOM elements สำหรับแสดงผล
 * @param {Object} totals - { income, expense }
 */
function updateSummaryDisplay(elements, totals) {
  const { incomeEl, expenseEl, balanceEl } = elements;
  const netBalance = totals.income - totals.expense;
  
  if (incomeEl) incomeEl.textContent = formatMoney(totals.income);
  if (expenseEl) expenseEl.textContent = formatMoney(totals.expense);
  if (balanceEl) balanceEl.textContent = formatMoney(netBalance);
}

// ============================================
// History List
// ============================================

/**
 * สร้าง HTML element สำหรับ transaction item
 * @param {Object} transaction - ข้อมูล transaction
 * @param {boolean} deleteMode - อยู่ในโหมดลบหรือไม่
 * @param {Set} selectedIds - IDs ที่ถูกเลือก
 * @returns {HTMLElement} li element
 */
function createHistoryItem(transaction, deleteMode = false, selectedIds = new Set()) {
  const li = document.createElement('li');
  li.className = 'history-item';
  li.dataset.id = transaction.id;
  
  if (deleteMode && selectedIds.has(transaction.id)) {
    li.classList.add('selected-delete');
  }
  
  // วันที่
  const dateSpan = document.createElement('span');
  dateSpan.className = 'item-date';
  const displayDate = new Date(transaction.date).toLocaleDateString();
  const dayName = getDayName(transaction.date);
  const time = transaction.time || '';
  dateSpan.innerHTML = `${displayDate}<br><small>${dayName} ${time}</small>`;
  
  // รายละเอียด
  const details = document.createElement('div');
  details.className = 'item-main';
  
  const topRow = document.createElement('div');
  topRow.className = 'item-top';
  
  const categoryEl = document.createElement('strong');
  categoryEl.textContent = transaction.category;
  topRow.appendChild(categoryEl);
  
  // Checkbox สำหรับโหมดลบ
  const actions = document.createElement('div');
  actions.className = 'history-actions';
  
  if (deleteMode) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'delete-select';
    checkbox.dataset.id = transaction.id;
    checkbox.checked = selectedIds.has(transaction.id);
    actions.appendChild(checkbox);
  }
  
  topRow.appendChild(actions);
  
  // Note
  const noteDiv = document.createElement('div');
  noteDiv.className = 'item-note';
  noteDiv.textContent = transaction.note || '';
  
  details.appendChild(topRow);
  details.appendChild(noteDiv);
  
  // จำนวนเงิน
  const amountEl = document.createElement('span');
  amountEl.className = `amount ${transaction.type}`;
  const sign = transaction.type === 'income' ? '+' : '-';
  amountEl.textContent = sign + formatMoney(transaction.amount);
  
  li.appendChild(dateSpan);
  li.appendChild(details);
  li.appendChild(amountEl);
  
  return li;
}

/**
 * Render รายการ transactions
 * @param {HTMLElement} listEl - ul element
 * @param {HTMLElement} emptyEl - empty state element
 * @param {Array} transactions - รายการ transactions
 * @param {boolean} deleteMode - อยู่ในโหมดลบหรือไม่
 * @param {Set} selectedIds - IDs ที่ถูกเลือก
 */
function renderHistoryList(listEl, emptyEl, transactions, deleteMode = false, selectedIds = new Set()) {
  if (!listEl) return;
  
  listEl.innerHTML = '';
  
  if (transactions.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  
  if (emptyEl) emptyEl.style.display = 'none';
  
  // เรียงจากใหม่ไปเก่า
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  
  sorted.forEach(item => {
    const li = createHistoryItem(item, deleteMode, selectedIds);
    listEl.appendChild(li);
  });
}

// ============================================
// Category Dropdown
// ============================================

/**
 * อัพเดทตัวเลือกหมวดหมู่
 * @param {HTMLElement} selectEl - select element
 * @param {string} type - 'income' หรือ 'expense'
 */
function updateCategoryDropdown(selectEl, type) {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  selectEl.innerHTML = '<option value="">-- Select --</option>';
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    selectEl.appendChild(option);
  });
}
