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
 * @param {HTMLElement} _element - (deprecated, kept for compatibility)
 * @param {string} type - 'success' หรือ 'error'
 * @param {string} message - ข้อความที่จะแสดง
 */
function showNotice(_element, type, message) {
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

  // Update Progress Bar elements
  updateProgressBar(totals);
}

/**
 * อัพเดท Progress Bar และ Status
 * @param {Object} totals - { income, expense }
 */
function updateProgressBar(totals) {
  const income = totals.income || 0;
  const expense = totals.expense || 0;

  // Calculate spending percentage
  const spendingPercent = income > 0 ? Math.min((expense / income) * 100, 100) : 0;

  // Update progress bar fill
  const progressFill = document.getElementById('spending-progress-fill');
  if (progressFill) {
    progressFill.style.width = `${spendingPercent}%`;
  }

  // Update labels
  const labelLeft = document.querySelector('.progress-label-left');
  const labelRight = document.getElementById('spending-percent');

  if (labelLeft) {
    labelLeft.textContent = `${formatMoney(expense)} spent`;
  }

  if (labelRight) {
    labelRight.textContent = `${Math.round(spendingPercent)}% of income`;
  }

  // Update stat card mini bars
  const incomeBar = document.getElementById('income-bar');
  const expenseBar = document.getElementById('expense-bar');

  if (incomeBar) {
    incomeBar.style.width = '100%';
  }

  if (expenseBar && income > 0) {
    expenseBar.style.width = `${spendingPercent}%`;
  }
}

// ============================================
// History List
// ============================================

/**
 * สร้าง HTML element สำหรับ transaction item (with swipe to delete)
 * @param {Object} transaction - ข้อมูล transaction
 * @returns {HTMLElement} li element
 */
function createHistoryItem(transaction) {
  const li = document.createElement('li');
  li.className = 'history-item-wrapper';
  li.dataset.id = transaction.id;

  // Delete button (hidden behind)
  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'swipe-delete-btn';
  deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';

  // Main content (swipeable)
  const content = document.createElement('div');
  content.className = 'history-item';

  // วันที่
  const dateSpan = document.createElement('span');
  dateSpan.className = 'item-date';
  const displayDate = new Date(transaction.date).toLocaleDateString();
  const dayName = getDayName(transaction.date);
  const time = transaction.time ? transaction.time.slice(0, 5) : '';
  dateSpan.innerHTML = `${displayDate}<br><small>${dayName} ${time}</small>`;

  // รายละเอียด
  const details = document.createElement('div');
  details.className = 'item-main';

  const topRow = document.createElement('div');
  topRow.className = 'item-top';

  const categoryEl = document.createElement('strong');
  categoryEl.textContent = transaction.category;
  topRow.appendChild(categoryEl);

  details.appendChild(topRow);

  // Note
  if (transaction.note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'item-note';
    noteDiv.textContent = transaction.note;
    details.appendChild(noteDiv);
  }

  // จำนวนเงิน
  const amountEl = document.createElement('span');
  amountEl.className = `amount ${transaction.type}`;
  const sign = transaction.type === 'income' ? '+' : '-';
  amountEl.textContent = sign + formatMoney(transaction.amount);

  content.appendChild(dateSpan);
  content.appendChild(details);
  content.appendChild(amountEl);

  li.appendChild(deleteBtn);
  li.appendChild(content);

  // Setup swipe
  setupSwipeToDelete(li, content);

  return li;
}

/**
 * Setup swipe to delete gesture
 */
function setupSwipeToDelete(wrapper, content) {
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  const threshold = 80; // pixels to trigger delete state

  const onStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    isDragging = true;
    content.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    currentX = touch.clientX - startX;
    
    // Only allow swipe left (negative)
    if (currentX < 0) {
      const translateX = Math.max(currentX, -100);
      content.style.transform = `translateX(${translateX}px)`;
    }
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    content.style.transition = 'transform 0.3s ease';

    if (currentX < -threshold) {
      // Show delete button
      content.style.transform = 'translateX(-80px)';
      wrapper.classList.add('swiped');
    } else {
      // Reset
      content.style.transform = 'translateX(0)';
      wrapper.classList.remove('swiped');
    }
    currentX = 0;
  };

  // Touch events
  content.addEventListener('touchstart', onStart, { passive: true });
  content.addEventListener('touchmove', onMove, { passive: true });
  content.addEventListener('touchend', onEnd);

  // Mouse events (for desktop testing)
  content.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);

  // Click anywhere else to reset
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && wrapper.classList.contains('swiped')) {
      content.style.transition = 'transform 0.3s ease';
      content.style.transform = 'translateX(0)';
      wrapper.classList.remove('swiped');
    }
  });
}

/**
 * Render รายการ transactions (with pagination support)
 * @param {HTMLElement} listEl - ul element
 * @param {HTMLElement} emptyEl - empty state element
 * @param {Array} transactions - รายการ transactions
 * @param {number} limit - จำนวนรายการที่แสดง (0 = แสดงทั้งหมด)
 * @param {Function} onDelete - callback เมื่อกดลบ
 */
function renderHistoryList(listEl, emptyEl, transactions, limit = 0, onDelete = null) {
  if (!listEl) return;

  listEl.innerHTML = '';

  if (transactions.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return { totalCount: 0, displayedCount: 0, hasMore: false };
  }

  if (emptyEl) emptyEl.style.display = 'none';

  // เรียงจากใหม่ไปเก่า
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // จำกัดจำนวนหรือแสดงทั้งหมด
  const itemsToShow = limit > 0 ? sorted.slice(0, limit) : sorted;

  itemsToShow.forEach(item => {
    const li = createHistoryItem(item);
    
    // Delete button click handler
    const deleteBtn = li.querySelector('.swipe-delete-btn');
    if (deleteBtn && onDelete) {
      deleteBtn.addEventListener('click', () => onDelete(item.id));
    }
    
    listEl.appendChild(li);
  });

  // Return info for load more button
  return {
    totalCount: sorted.length,
    displayedCount: itemsToShow.length,
    hasMore: limit > 0 && sorted.length > limit
  };
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
      title = 'Confirm',
      message = '',
      type = 'confirm',
      confirmText = 'OK',
      cancelText = 'Cancel',
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

