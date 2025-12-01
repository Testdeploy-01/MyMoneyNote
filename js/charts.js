/**
 * ============================================
 * CHARTS - สร้างกราฟด้วย Chart.js
 * ============================================
 */

// สีสำหรับกราฟ
const CHART_COLORS = {
  income: '#43b37b',
  expense: '#f96f9b',
  incomeAlpha: 'rgba(67, 179, 123, 0.8)',
  expenseAlpha: 'rgba(249, 111, 155, 0.8)',
  incomeFill: 'rgba(67, 179, 123, 0.1)',
  expenseFill: 'rgba(249, 111, 155, 0.1)',
  categories: [
    '#f96f9b', '#c38bff', '#43b37b', '#ffb347', '#87ceeb',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
  ]
};

/**
 * สร้างกราฟแท่ง Income vs Expenses
 * @param {HTMLCanvasElement} canvas - canvas element
 * @param {number} income - ยอดรายรับ
 * @param {number} expense - ยอดรายจ่าย
 */
function createBarChart(canvas, income, expense) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [income, expense],
        backgroundColor: [CHART_COLORS.income, CHART_COLORS.expense],
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

/**
 * สร้างกราฟวงกลม Expenses by Category
 * @param {HTMLCanvasElement} canvas - canvas element
 * @param {Object} categoryData - { category: amount }
 */
function createPieChart(canvas, categoryData) {
  const labels = Object.keys(categoryData);
  const values = Object.values(categoryData);
  
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.categories.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

/**
 * สร้างกราฟแท่งรายวัน
 * @param {HTMLCanvasElement} canvas - canvas element
 * @param {Array} labels - วันที่ (1, 2, 3, ...)
 * @param {Array} incomeData - ยอดรายรับแต่ละวัน
 * @param {Array} expenseData - ยอดรายจ่ายแต่ละวัน
 */
function createDailyChart(canvas, labels, incomeData, expenseData) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: CHART_COLORS.incomeAlpha,
          borderRadius: 4,
          borderWidth: 0
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: CHART_COLORS.expenseAlpha,
          borderRadius: 4,
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: false, font: { size: 10 } } },
        y: { beginAtZero: true }
      }
    }
  });
}

/**
 * สร้างกราฟเส้น Monthly History
 * @param {HTMLCanvasElement} canvas - canvas element
 * @param {Array} labels - ชื่อเดือน
 * @param {Array} incomeData - ยอดรายรับแต่ละเดือน
 * @param {Array} expenseData - ยอดรายจ่ายแต่ละเดือน
 */
function createLineChart(canvas, labels, incomeData, expenseData) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: CHART_COLORS.income,
          backgroundColor: CHART_COLORS.incomeFill,
          fill: true,
          tension: 0.3
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: CHART_COLORS.expense,
          backgroundColor: CHART_COLORS.expenseFill,
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

/**
 * คำนวณยอดแต่ละหมวดหมู่
 * @param {Array} transactions - รายการ transactions
 * @returns {Object} { category: amount }
 */
function calculateCategoryTotals(transactions) {
  const result = {};
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      result[t.category] = (result[t.category] || 0) + t.amount;
    });
  
  return result;
}

/**
 * คำนวณยอดรายวัน
 * @param {Array} transactions - รายการ transactions
 * @param {number} year - ปี
 * @param {number} month - เดือน (0-11)
 * @returns {Object} { labels, income, expense }
 */
function calculateDailyTotals(transactions, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const labels = [];
  const income = [];
  const expense = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    labels.push(day.toString());
    
    const dayIncome = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getDate() === day && 
               d.getMonth() === month && 
               d.getFullYear() === year && 
               t.type === 'income';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayExpense = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getDate() === day && 
               d.getMonth() === month && 
               d.getFullYear() === year && 
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    income.push(dayIncome);
    expense.push(dayExpense);
  }
  
  return { labels, income, expense };
}

/**
 * คำนวณยอดรายเดือน
 * @param {Array} transactions - รายการ transactions
 * @returns {Object} { labels, income, expense }
 */
function calculateMonthlyTotals(transactions) {
  const monthlyData = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expense += t.amount;
    }
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  
  const labels = sortedMonths.map(m => {
    const [year, month] = m.split('-');
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year.slice(2)}`;
  });
  
  const income = sortedMonths.map(m => monthlyData[m].income);
  const expense = sortedMonths.map(m => monthlyData[m].expense);
  
  return { labels, income, expense };
}
