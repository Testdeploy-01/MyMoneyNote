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

  historyList: document.getElementById('history-list'),
  emptyState: document.getElementById('empty-state'),

  summaryBtn: document.getElementById('summary-btn'),
  settingsBtn: document.getElementById('settings-btn'),
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

// Pagination settings
const ITEMS_PER_PAGE = 10;
let displayedCount = ITEMS_PER_PAGE;

function renderSummary() {
  const totals = calculateTotals(transactions);

  updateSummaryDisplay({
    incomeEl: elements.totalIncomeEl,
    expenseEl: elements.totalExpenseEl,
    balanceEl: elements.netBalanceEl
  }, totals);
}

function renderHistory() {
  const result = renderHistoryList(
    elements.historyList,
    elements.emptyState,
    transactions,
    displayedCount,
    handleDeleteItem // callback for swipe delete
  );

  // Update load more button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn && result) {
    if (result.hasMore) {
      loadMoreBtn.style.display = 'block';
      loadMoreBtn.innerHTML = `<i class="ri-arrow-down-line"></i> More (${result.displayedCount}/${result.totalCount})`;
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
}

function renderAll() {
  renderSummary();
  renderHistory();
  renderBudget(transactions);
}

// ============================================
// Delete Functions (Swipe to Delete)
// ============================================

async function handleDeleteItem(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;

  const confirmed = await showModal({
    title: 'Delete?',
    message: `Delete "${transaction.category}" (${formatMoney(transaction.amount)})?`,
    icon: 'ri-delete-bin-line',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });

  if (confirmed) {
    showLoading();
    await deleteTransactions([id]);
    hideLoading();

    transactions = transactions.filter(t => t.id !== id);
    renderAll();
    showNotice(elements.formMessage, 'success', 'Transaction deleted');
  } else {
    // Reset swipe position
    renderHistory();
  }
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

  // Load More button
  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    displayedCount += ITEMS_PER_PAGE;
    renderHistory();
  });

  // Setup Budget listeners - pass a getter function for real-time transactions access
  setupBudgetListeners(() => transactions, renderAll);
}

// ============================================
// Initialize
// ============================================

async function init() {
  // Setup error handlers first
  setupErrorHandlers();
  setupOfflineListeners();

  elements.dateInput.value = getTodayDate();
  elements.timeInput.value = getCurrentTime();
  updateCategories();
  setupEventListeners();

  showLoading();

  try {
    transactions = await loadMonthlyTransactions();
    console.log(`Loaded ${transactions.length} monthly transactions`);

    // Load budget from Supabase
    await initBudgetFromDB(transactions);

    // Sync offline queue if online
    if (isOnline()) {
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        const result = await syncOfflineQueue();
        if (result.synced > 0) {
          // Reload data after sync
          transactions = await loadMonthlyTransactions();
        }
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    handleError(error, 'Loading transactions');
  }

  hideLoading();
  renderAll();

  console.log('My Money Notes initialized!');
}

init();
