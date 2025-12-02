/**
 * ============================================
 * UI - จัดการ User Interface
 * ============================================
 */

// ============================================
// Toast Notification System
// ============================================

let toastContainer = null;

/**
 * สร้าง Toast Container (ถ้ายังไม่มี)
 */
function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * แสดง Toast Notification
 * @param {HTMLElement} element - (ไม่ใช้แล้ว แต่เก็บไว้เพื่อ compatibility)
 * @param {string} type - 'success' หรือ 'error'
 * @param {string} message - ข้อความที่จะแสดง
 */
function showNotice(element, type, message) {
  const container = getToastContainer();
  
  // สร้าง toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon
  const icon = type === 'success' ? 'ri-check-line' : 'ri-error-warning-line';
  
  toast.innerHTML = `
    <i class="${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
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
// Custom Modal Dialog
// ============================================

/**
 * แสดง Modal Dialog แทน confirm/alert
 * @param {Object} options - { title, message, type, confirmText, cancelText }
 * @returns {Promise<boolean>} true ถ้ากด confirm
 */
function showModal(options) {
  return new Promise((resolve) => {
    const {
      title = 'ยืนยัน',
      message = '',
      type = 'confirm', // 'confirm' หรือ 'alert'
      confirmText = 'ตกลง',
      cancelText = 'ยกเลิก',
      icon = 'ri-question-line'
    } = options;

    // สร้าง overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // สร้าง modal
    const modal = document.createElement('div');
    modal.className = 'modal-dialog';
    
    modal.innerHTML = `
      <div class="modal-icon"><i class="${icon}"></i></div>
      <h3 class="modal-title">${title}</h3>
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        ${type === 'confirm' ? `<button class="btn-hand ghost modal-cancel">${cancelText}</button>` : ''}
        <button class="btn-hand modal-confirm">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animation
    requestAnimationFrame(() => {
      overlay.classList.add('modal-show');
    });

    // Close function
    const closeModal = (result) => {
      overlay.classList.remove('modal-show');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    // Event listeners
    modal.querySelector('.modal-confirm')?.addEventListener('click', () => closeModal(true));
    modal.querySelector('.modal-cancel')?.addEventListener('click', () => closeModal(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(false);
    });
  });
}

/**
 * Confirm dialog
 */
async function showConfirm(title, message, icon = 'ri-question-line') {
  return showModal({ title, message, type: 'confirm', icon });
}

/**
 * Alert dialog
 */
async function showAlert(title, message, icon = 'ri-information-line') {
  return showModal({ title, message, type: 'alert', icon });
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
