/**
 * ============================================
 * APP.JS - Main Application (หน้าหลัก)
 * ============================================
 * 
 * ใช้ Supabase เป็น storage
 * - Monthly: ข้อมูลเดือนปัจจุบัน
 * - Archive: ข้อมูลทั้งหมด (All Time)
 */

// ============================================
// State Management
// ============================================

let transactions = [];
let deleteMode = false;
const pendingDeleteIds = new Set();

// ============================================
// DOM Elements
// ============================================

const elements = {
  form: document.getElementById('transaction-form'),
  amountInput: document.getElementById('amount'),
  typeInputs: document.querySelectorAll('input[name="type"]'),
  categoryInput: document.getElementById('category'),
  dateInput: document.getElementById('date'),
  timeInput: document.getElementById('time'),
  noteInput: document.getElementById('note'),
  formMessage: document.getElementById('form-message'),
  
  netBalanceEl: document.getElementById('net-balance'),
  totalIncomeEl: document.getElementById('total-income'),
  totalExpenseEl: document.getElementById('total-expense'),
  
  netBalanceMobileEl: document.getElementById('net-balance-mobile'),
  totalIncomeMobileEl: document.getElementById('total-income-mobile'),
  totalExpenseMobileEl: document.getElementById('total-expense-mobile'),
  
  historyList: document.getElementById('history-list'),
  emptyState: document.getElementById('empty-state'),
  
  deleteToggleBtn: document.getElementById('delete-toggle'),
  deleteBar: document.getElementById('delete-bar'),
  deleteHint: document.getElementById('delete-hint'),
  deleteSelectedCount: document.getElementById('delete-selected-count'),
  deleteConfirmBtn: document.getElementById('delete-confirm'),
  deleteCancelBtn: document.getElementById('delete-cancel'),
  deleteAllBtn: document.getElementById('delete-all-btn'),
  
  summaryBtn: document.getElementById('summary-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  nextMonthBtn: document.getElementById('next-month-btn'),
  scanBtn: document.getElementById('scan-btn'),
  slipInput: document.getElementById('slip-input'),
  
  loadingOverlay: document.getElementById('loading-overlay')
};

// ============================================
// Loading State
// ============================================

function showLoading() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'flex';
  }
}

function hideLoading() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'none';
  }
}

// ============================================
// Render Functions
// ============================================

function renderSummary() {
  const totals = calculateTotals(transactions);
  
  updateSummaryDisplay({
    incomeEl: elements.totalIncomeEl,
    expenseEl: elements.totalExpenseEl,
    balanceEl: elements.netBalanceEl
  }, totals);
  
  updateSummaryDisplay({
    incomeEl: elements.totalIncomeMobileEl,
    expenseEl: elements.totalExpenseMobileEl,
    balanceEl: elements.netBalanceMobileEl
  }, totals);
}

function renderHistory() {
  renderHistoryList(
    elements.historyList,
    elements.emptyState,
    transactions,
    deleteMode,
    pendingDeleteIds
  );
  updateDeleteControlsUI();
}

function renderAll() {
  renderSummary();
  renderHistory();
}

// ============================================
// Delete Mode Functions
// ============================================

function updateDeleteControlsUI() {
  const hasItems = transactions.length > 0;
  
  if (elements.deleteToggleBtn) {
    elements.deleteToggleBtn.style.display = deleteMode ? 'none' : 'inline-flex';
    elements.deleteToggleBtn.disabled = !hasItems;
  }
  if (elements.deleteBar) {
    elements.deleteBar.style.display = deleteMode ? 'flex' : 'none';
  }
  if (elements.deleteHint) {
    elements.deleteHint.style.display = deleteMode ? 'block' : 'none';
  }
  if (elements.deleteConfirmBtn) {
    elements.deleteConfirmBtn.disabled = pendingDeleteIds.size === 0;
  }
  if (elements.deleteSelectedCount) {
    elements.deleteSelectedCount.textContent = `Selected ${pendingDeleteIds.size} item(s)`;
  }
}

function enterDeleteMode() {
  deleteMode = true;
  pendingDeleteIds.clear();
  renderHistory();
}

function exitDeleteMode() {
  deleteMode = false;
  pendingDeleteIds.clear();
  renderHistory();
}

// ============================================
// Form Functions
// ============================================

function getSelectedType() {
  const checked = document.querySelector('input[name="type"]:checked');
  return checked ? checked.value : 'income';
}

function updateCategories() {
  updateCategoryDropdown(elements.categoryInput, getSelectedType());
}

function resetForm() {
  elements.form.reset();
  elements.typeInputs[0].checked = true;
  updateCategories();
  elements.dateInput.value = getTodayDate();
  elements.timeInput.value = getCurrentTime();
  
  // Blur เพื่อซ่อน keyboard บนมือถือ
  document.activeElement?.blur();
}

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const type = getSelectedType();
  const amount = parseFloat(elements.amountInput.value);
  const category = elements.categoryInput.value.trim();
  const date = elements.dateInput.value || getTodayDate();
  const time = elements.timeInput.value || getCurrentTime();
  const note = elements.noteInput.value.trim();
  
  if (!amount || amount <= 0 || !category) {
    showNotice(elements.formMessage, 'error', 'Please enter amount and category.');
    return;
  }
  
  const newTransaction = {
    id: generateId(),
    type, amount, category, date, time, note
  };
  
  showLoading();
  const saved = await addTransaction(newTransaction);
  hideLoading();
  
  if (saved) {
    transactions.unshift(newTransaction);
    renderAll();
    resetForm();
    showNotice(elements.formMessage, 'success', 'Transaction saved');
  } else {
    showNotice(elements.formMessage, 'error', 'Failed to save. Please try again.');
  }
}

// ============================================
// Scan Slip Functions
// ============================================

async function handleSlipScan(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  elements.scanBtn.disabled = true;
  elements.scanBtn.textContent = 'Scanning...';
  
  try {
    const data = await scanSlip(file, (progress) => {
      elements.scanBtn.textContent = `${progress}%`;
    });
    
    if (data.amount) elements.amountInput.value = data.amount;
    if (data.date) elements.dateInput.value = data.date;
    if (data.time) elements.timeInput.value = data.time;
    
    elements.typeInputs[1].checked = true;
    updateCategories();
    
    if (data.category) elements.categoryInput.value = data.category;
    elements.noteInput.value = data.memo || '';
    
    const msg = data.category ? `Category: ${data.category}` : 'Please choose category';
    showNotice(elements.formMessage, 'success', `Slip processed. ${msg}`);
    
  } catch (error) {
    showNotice(elements.formMessage, 'error', 'Could not read slip.');
    console.error(error);
  } finally {
    elements.scanBtn.disabled = false;
    elements.scanBtn.textContent = 'Scan slip';
    elements.slipInput.value = '';
  }
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.typeInputs.forEach(input => {
    input.addEventListener('change', updateCategories);
  });
  
  elements.summaryBtn?.addEventListener('click', () => {
    window.location.href = 'summary.html';
  });
  
  elements.settingsBtn?.addEventListener('click', () => {
    showNotice(elements.formMessage, 'success', 'Settings coming soon');
  });
  
  elements.scanBtn?.addEventListener('click', () => elements.slipInput.click());
  elements.slipInput?.addEventListener('change', handleSlipScan);
  
  elements.deleteToggleBtn?.addEventListener('click', enterDeleteMode);
  elements.deleteCancelBtn?.addEventListener('click', exitDeleteMode);
  
  elements.deleteConfirmBtn?.addEventListener('click', async () => {
    if (pendingDeleteIds.size === 0) return;
    
    showLoading();
    await deleteTransactions(pendingDeleteIds);
    hideLoading();
    
    const idsToDelete = new Set(pendingDeleteIds);
    transactions = transactions.filter(t => !idsToDelete.has(t.id));
    showNotice(elements.formMessage, 'success', `Deleted ${idsToDelete.size} item(s)`);
    exitDeleteMode();
    renderAll();
  });
  
  elements.historyList?.addEventListener('click', (e) => {
    if (!deleteMode) return;
    const item = e.target.closest('.history-item');
    if (!item) return;
    
    const id = item.dataset.id;
    if (pendingDeleteIds.has(id)) {
      pendingDeleteIds.delete(id);
    } else {
      pendingDeleteIds.add(id);
    }
    renderHistory();
  });
  
  elements.deleteAllBtn?.addEventListener('click', async () => {
    if (transactions.length === 0) return;
    
    const confirmed = await showModal({
      title: 'ลบทั้งหมด?',
      message: `ลบรายการทั้งหมด ${transactions.length} รายการ?\n\n⚠️ ข้อมูลใน All Time จะถูกลบด้วย`,
      icon: 'ri-delete-bin-line',
      confirmText: 'ลบทั้งหมด',
      cancelText: 'ยกเลิก'
    });
    
    if (confirmed) {
      showLoading();
      await deleteTransactions(transactions.map(t => t.id));
      hideLoading();
      
      transactions = [];
      exitDeleteMode();
      renderAll();
      showNotice(elements.formMessage, 'success', 'All transactions deleted');
    }
  });
  
  // Next Month - รีเซ็ตเฉพาะข้อมูลเดือนปัจจุบัน (ไม่กระทบ All Time)
  elements.nextMonthBtn?.addEventListener('click', async () => {
    if (transactions.length === 0) {
      await showModal({
        title: 'ไม่มีรายการ',
        message: 'ไม่มีรายการที่จะรีเซ็ต',
        type: 'alert',
        icon: 'ri-information-line',
        confirmText: 'ตกลง'
      });
      return;
    }
    
    const confirmed = await showModal({
      title: 'เริ่มเดือนใหม่?',
      message: '⚠️ ข้อมูลในหน้า Summary จะถูกล้าง\n✅ ข้อมูลในหน้า All Time ยังคงอยู่',
      icon: 'ri-calendar-check-line',
      confirmText: 'รีเซ็ต',
      cancelText: 'ยกเลิก'
    });
    
    if (confirmed) {
      showLoading();
      await resetMonthlyData();
      hideLoading();
      
      transactions = [];
      renderAll();
      
      await showModal({
        title: 'สำเร็จ!',
        message: 'รีเซ็ตข้อมูลเดือนนี้แล้ว\n\nข้อมูลเก่ายังดูได้ในหน้า All Time',
        type: 'alert',
        icon: 'ri-check-line',
        confirmText: 'ตกลง'
      });
    }
  });
}

// ============================================
// Initialize
// ============================================

async function init() {
  elements.dateInput.value = getTodayDate();
  elements.timeInput.value = getCurrentTime();
  updateCategories();
  setupEventListeners();
  
  showLoading();
  
  try {
    transactions = await loadMonthlyTransactions();
    console.log(`Loaded ${transactions.length} monthly transactions`);
  } catch (error) {
    console.error('Error loading data:', error);
    showNotice(elements.formMessage, 'error', 'Could not load data. Please refresh.');
  }
  
  hideLoading();
  renderAll();
  
  console.log('My Money Notes initialized!');
}

init();
