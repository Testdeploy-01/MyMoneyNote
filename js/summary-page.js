/**
 * ============================================
 * SUMMARY PAGE - หน้าสรุปข้อมูลเดือนปัจจุบัน
 * ============================================
 * 
 * แสดงข้อมูลจากตาราง transactions (Monthly)
 */

async function initSummaryPage() {
  const loadingEl = document.getElementById('loading-overlay');
  if (loadingEl) loadingEl.style.display = 'flex';
  
  try {
    // โหลดข้อมูลเดือนปัจจุบัน
    const transactions = await loadMonthlyTransactions();
    
    // แสดงยอดสรุป
    const totals = calculateTotals(transactions);
    
    document.getElementById('total-income').textContent = formatMoney(totals.income);
    document.getElementById('total-expense').textContent = formatMoney(totals.expense);
    document.getElementById('net-balance').textContent = formatMoney(totals.income - totals.expense);
    document.getElementById('total-count').textContent = transactions.length;
    
    // แสดงรายจ่ายวันนี้แบ่งตาม Category
    const today = getTodayDate();
    const todayExpenses = transactions.filter(t => t.type === 'expense' && t.date === today);
    const todayByCategory = {};
    
    todayExpenses.forEach(t => {
      todayByCategory[t.category] = (todayByCategory[t.category] || 0) + t.amount;
    });
    
    const todayList = document.getElementById('today-expenses-list');
    const sortedToday = Object.entries(todayByCategory).sort((a, b) => b[1] - a[1]);
    const maxToday = sortedToday[0]?.[1] || 1;
    
    // คำนวณยอดรวมวันนี้
    const todayTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    if (sortedToday.length === 0) {
      todayList.innerHTML = '<li style="text-align: center; padding: 20px; opacity: 0.6;">No expenses today</li>';
    } else {
      // Show total first
      const totalLi = document.createElement('li');
      totalLi.className = 'category-item';
      totalLi.style.borderBottom = '2px solid var(--expense)';
      totalLi.style.paddingBottom = '12px';
      totalLi.style.marginBottom = '8px';
      totalLi.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700;">Today's Total</span>
            <span style="color: var(--expense); font-weight: 800; font-size: 1.2rem;">${formatMoney(todayTotal)}</span>
          </div>
        </div>
      `;
      todayList.appendChild(totalLi);
      
      // Show each category
      sortedToday.forEach(([category, amount]) => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerHTML = `
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between;">
              <span>${category}</span>
              <span style="color: var(--expense); font-weight: 700;">${formatMoney(amount)}</span>
            </div>
            <div class="category-bar" style="width: ${(amount / maxToday) * 100}%;"></div>
          </div>
        `;
        todayList.appendChild(li);
      });
    }
    
    // สร้างกราฟ Pie Chart
    const categoryData = calculateCategoryTotals(transactions);
    createPieChart(
      document.getElementById('pieChart'),
      categoryData
    );
    
    const now = new Date();
    const dailyData = calculateDailyTotals(transactions, now.getFullYear(), now.getMonth());
    createDailyChart(
      document.getElementById('dailyChart'),
      dailyData.labels,
      dailyData.income,
      dailyData.expense
    );
    
    // Top Categories
    const categoryList = document.getElementById('category-list');
    const sortedCategories = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const maxExpense = sortedCategories[0]?.[1] || 1;
    
    sortedCategories.forEach(([category, amount]) => {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between;">
            <span>${category}</span>
            <span style="color: var(--expense); font-weight: 700;">${formatMoney(amount)}</span>
          </div>
          <div class="category-bar" style="width: ${(amount / maxExpense) * 100}%;"></div>
        </div>
      `;
      categoryList.appendChild(li);
    });
    
    if (sortedCategories.length === 0) {
      categoryList.innerHTML = '<li style="text-align: center; padding: 20px; opacity: 0.6;">No expense data yet</li>';
    }
    
    // Next Month Button - Reset Monthly only
    document.getElementById('next-month-btn')?.addEventListener('click', async () => {
      if (transactions.length === 0) {
        await showModal({
          title: 'No Transactions',
          message: 'No transactions to reset.',
          type: 'alert',
          icon: 'ri-information-line',
          confirmText: 'OK'
        });
        return;
      }
      
      const confirmed = await showModal({
        title: 'Start New Month?',
        message: 'Summary data will be cleared.\nAll Time data will remain.',
        icon: 'ri-calendar-check-line',
        confirmText: 'Reset',
        cancelText: 'Cancel'
      });
      
      if (confirmed) {
        if (loadingEl) loadingEl.style.display = 'flex';
        
        await resetMonthlyData();
        
        await showModal({
          title: 'Success!',
          message: 'Monthly data has been reset.\n\nOld data is still available in All Time.',
          type: 'alert',
          icon: 'ri-check-line',
          confirmText: 'OK'
        });
        
        window.location.reload();
      }
    });
    
    console.log('Summary page loaded!');
    
  } catch (error) {
    console.error('Error loading summary:', error);
    alert('Could not load data. Please try again.');
  }
  
  if (loadingEl) loadingEl.style.display = 'none';
}

initSummaryPage();
