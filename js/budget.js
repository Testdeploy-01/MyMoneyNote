/**
 * ============================================
 * BUDGET.JS - Budget Tracking Module
 * ============================================
 * 
 * Manual Budget Cycle - flexible timing
 * Start new cycle whenever you want
 * Data stored in Supabase
 */

// ============================================
// Budget Storage (Supabase + LocalStorage cache)
// ============================================

const BUDGET_KEY = 'money_notes_budget';
let cachedBudget = null;

/**
 * Load Budget from cache or Supabase
 */
function loadBudget() {
  // Return cached budget if available
  if (cachedBudget) return cachedBudget;

  // Try localStorage as fallback/cache
  try {
    const data = localStorage.getItem(BUDGET_KEY);
    if (data) {
      cachedBudget = JSON.parse(data);
      return cachedBudget;
    }
  } catch (e) {
    console.error('Error loading budget from cache:', e);
  }
  return null;
}

/**
 * Load Budget from Supabase (async)
 */
async function loadBudgetFromDB() {
  try {
    const data = await fetchBudgetFromDB();
    if (data) {
      // Convert DB format to app format
      cachedBudget = {
        amount: data.amount,
        cycleDays: data.cycle_days,
        startDate: data.start_date,
        cycleId: data.id
      };
      // Update local cache
      localStorage.setItem(BUDGET_KEY, JSON.stringify(cachedBudget));
      return cachedBudget;
    }
  } catch (e) {
    console.error('Error loading budget from DB:', e);
  }
  return null;
}

/**
 * Save Budget to Supabase and LocalStorage
 */
async function saveBudget(budget) {
  try {
    // Save to localStorage first (for immediate UI update)
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
    cachedBudget = budget;

    // Save to Supabase
    await saveBudgetToDB(budget);
    return true;
  } catch (e) {
    console.error('Error saving budget:', e);
    return false;
  }
}

/**
 * Create new Budget
 */
function createBudget(amount, cycleDays = 5) {
  return {
    amount: amount,
    cycleDays: cycleDays,
    startDate: new Date().toISOString(),
    cycleId: generateId()
  };
}

// Categories to track in budget (Food & 7-Eleven only)
const BUDGET_CATEGORIES = ['Food', '7-Eleven'];

/**
 * Calculate spent amount in current cycle
 * Only counts Food and 7-Eleven categories
 * Only counts transactions created after cycle start
 */
function calculateBudgetSpent(transactions, budget) {
  if (!budget || !budget.startDate) return 0;

  const cycleStart = new Date(budget.startDate);

  return transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      // Only count Food and 7-Eleven
      if (!BUDGET_CATEGORIES.includes(t.category)) return false;

      // Use transaction date + time to compare
      const txDateTime = new Date(`${t.date}T${t.time || '00:00'}`);
      return txDateTime >= cycleStart;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// ============================================
// Budget UI
// ============================================

const budgetElements = {
  card: null,
  setup: null,
  total: null,
  spent: null,
  remaining: null,
  fill: null,
  startDate: null,
  amountInput: null,
  daysOptions: null
};

let selectedCycleDays = 5;

/**
 * Initialize Budget Elements
 */
function initBudgetElements() {
  budgetElements.card = document.getElementById('budget-card');
  budgetElements.setup = document.getElementById('budget-setup');
  budgetElements.total = document.getElementById('budget-total');
  budgetElements.spent = document.getElementById('budget-spent');
  budgetElements.remaining = document.getElementById('budget-remaining');
  budgetElements.fill = document.getElementById('budget-fill');
  budgetElements.startDate = document.getElementById('budget-start-date');
  budgetElements.amountInput = document.getElementById('budget-amount-input');
  budgetElements.daysOptions = document.getElementById('budget-days-options');
}

/**
 * Show Budget Card
 */
function showBudgetCard(budget, spent) {
  if (!budgetElements.card) return;

  const remaining = budget.amount - spent;
  const percent = Math.min((spent / budget.amount) * 100, 100);
  const cycleDays = budget.cycleDays || 5;

  // Update values - remaining is the main display now (can be negative)
  const remainingText = remaining < 0
    ? `-${formatMoney(Math.abs(remaining))}`
    : formatMoney(remaining);
  budgetElements.remaining.textContent = remainingText;
  budgetElements.spent.textContent = `${formatMoney(spent)} spent`;
  budgetElements.total.textContent = `of ${formatMoney(budget.amount)}`;

  // Add/remove overspent class for styling
  budgetElements.remaining.classList.toggle('overspent', remaining < 0);

  // Animate progress bar from 0 to target
  budgetElements.fill.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      budgetElements.fill.style.width = `${percent}%`;
    });
  });

  // Update start date with cycle info
  const startDate = new Date(budget.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + cycleDays);

  const daysDiff = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(cycleDays - daysDiff, 0);

  // Format dates: "5 Dec 15:30"
  const formatDateTime = (date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${month} ${time}`;
  };

  const startStr = formatDateTime(startDate);
  const endStr = formatDateTime(endDate);

  let statusText;
  if (daysLeft > 0) {
    statusText = `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
  } else {
    statusText = 'Cycle ended';
  }

  budgetElements.startDate.textContent = `${startStr} → ${endStr} · ${statusText}`;

  // Show card, hide setup
  budgetElements.card.style.display = 'block';
  budgetElements.setup.style.display = 'none';
}

/**
 * Show Budget Setup Form
 */
function showBudgetSetup(defaultAmount = 1000, defaultDays = 5) {
  if (!budgetElements.setup) return;

  budgetElements.amountInput.value = defaultAmount;
  selectedCycleDays = defaultDays;

  // Update active button
  updateDaysButtons(defaultDays);

  budgetElements.setup.style.display = 'block';
  budgetElements.card.style.display = 'none';
}

/**
 * Update days buttons active state
 */
function updateDaysButtons(days) {
  const buttons = document.querySelectorAll('.budget-day-btn');
  const customInput = document.getElementById('budget-custom-days');
  const presetDays = [3, 5, 7];

  // Clear all active states
  buttons.forEach(btn => btn.classList.remove('active'));
  if (customInput) {
    customInput.classList.remove('active');
    customInput.value = '';
  }

  // Check if it's a preset value
  if (presetDays.includes(days)) {
    buttons.forEach(btn => {
      if (parseInt(btn.dataset.days) === days) {
        btn.classList.add('active');
      }
    });
  } else {
    // Custom value
    if (customInput) {
      customInput.value = days;
      customInput.classList.add('active');
    }
  }
}

/**
 * Render Budget (main function)
 */
function renderBudget(transactions) {
  initBudgetElements();

  const budget = loadBudget();

  if (!budget) {
    // Not configured yet - show setup form
    showBudgetSetup();
    return;
  }

  const spent = calculateBudgetSpent(transactions, budget);
  showBudgetCard(budget, spent);
}

/**
 * Initialize Budget from Supabase (async)
 */
async function initBudgetFromDB(transactions) {
  const budget = await loadBudgetFromDB();
  if (budget) {
    const spent = calculateBudgetSpent(transactions, budget);
    showBudgetCard(budget, spent);
  } else {
    showBudgetSetup();
  }
}

/**
 * Setup Budget Event Listeners
 * @param {Function} getTransactions - Function that returns current transactions array
 * @param {Function} onUpdate - Callback when budget is updated
 */
function setupBudgetListeners(getTransactions, onUpdate) {
  initBudgetElements();

  // Days selection buttons
  document.querySelectorAll('.budget-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCycleDays = parseInt(btn.dataset.days);
      updateDaysButtons(selectedCycleDays);
    });
  });

  // Custom days input
  const customDaysInput = document.getElementById('budget-custom-days');
  if (customDaysInput) {
    customDaysInput.addEventListener('focus', () => {
      // Clear preset buttons when focusing custom input
      document.querySelectorAll('.budget-day-btn').forEach(btn => btn.classList.remove('active'));
      customDaysInput.classList.add('active');
    });

    customDaysInput.addEventListener('input', () => {
      const value = parseInt(customDaysInput.value);
      if (value && value > 0) {
        selectedCycleDays = Math.min(value, 30); // Max 30 days
        document.querySelectorAll('.budget-day-btn').forEach(btn => btn.classList.remove('active'));
        customDaysInput.classList.add('active');
      }
    });
  }

  // Settings button - show setup
  document.getElementById('budget-settings-btn')?.addEventListener('click', () => {
    const budget = loadBudget();
    showBudgetSetup(budget?.amount || 1000, budget?.cycleDays || 5);
  });

  // Cancel button - use getTransactions() to get latest data
  document.getElementById('budget-cancel-btn')?.addEventListener('click', () => {
    const budget = loadBudget();
    if (budget) {
      const spent = calculateBudgetSpent(getTransactions(), budget);
      showBudgetCard(budget, spent);
    }
  });

  // Save button - use getTransactions() to get latest data
  document.getElementById('budget-save-btn')?.addEventListener('click', () => {
    const amount = parseFloat(budgetElements.amountInput.value);
    if (!amount || amount <= 0) {
      showNotice(null, 'error', 'Please enter a valid amount');
      return;
    }

    let budget = loadBudget();
    if (budget) {
      // Update amount and days, keep cycle
      budget.amount = amount;
      budget.cycleDays = selectedCycleDays;
    } else {
      // Create new budget
      budget = createBudget(amount, selectedCycleDays);
    }

    saveBudget(budget);
    const spent = calculateBudgetSpent(getTransactions(), budget);
    showBudgetCard(budget, spent);
    showNotice(null, 'success', 'Budget saved');

    if (onUpdate) onUpdate();
  });

  // Reset button - start new cycle
  document.getElementById('budget-reset-btn')?.addEventListener('click', async () => {
    const budget = loadBudget();
    if (!budget) return;

    const cycleDays = budget.cycleDays || 5;
    const confirmed = await showModal({
      title: 'Start New Cycle?',
      message: `Reset budget to ${formatMoney(budget.amount)} for ${cycleDays} days`,
      icon: 'ri-restart-line',
      confirmText: 'New Cycle',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      const newBudget = createBudget(budget.amount, cycleDays);
      saveBudget(newBudget);
      showBudgetCard(newBudget, 0);
      showNotice(null, 'success', 'New cycle started!');

      if (onUpdate) onUpdate();
    }
  });
}

console.log('Budget module loaded!');
