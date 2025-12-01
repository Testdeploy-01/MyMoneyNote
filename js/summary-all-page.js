/**
 * ============================================
 * ALL TIME SUMMARY PAGE - หน้าสรุปข้อมูลทั้งหมด
 * ============================================
 * 
 * แสดงข้อมูลจากตาราง transactions_archive (ถาวร)
 */

async function initAllTimePage() {
  const loadingEl = document.getElementById('loading-overlay');
  if (loadingEl) loadingEl.style.display = 'flex';
  
  try {
    // โหลดข้อมูลทั้งหมดจาก Archive
    const transactions = await loadAllTimeTransactions();
    
    // แสดงยอดสรุป
    const totals = calculateTotals(transactions);
    
    document.getElementById('total-income').textContent = formatMoney(totals.income);
    document.getElementById('total-expense').textContent = formatMoney(totals.expense);
    document.getElementById('net-balance').textContent = formatMoney(totals.income - totals.expense);
    document.getElementById('total-count').textContent = transactions.length;
    
    // สร้างกราฟ
    createBarChart(
      document.getElementById('barChart'),
      totals.income,
      totals.expense
    );
    
    const categoryData = calculateCategoryTotals(transactions);
    createPieChart(
      document.getElementById('pieChart'),
      categoryData
    );
    
    const monthlyData = calculateMonthlyTotals(transactions);
    createLineChart(
      document.getElementById('lineChart'),
      monthlyData.labels,
      monthlyData.income,
      monthlyData.expense
    );
    
    // Top Categories (All Time)
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
    
    console.log('All Time Summary page loaded!');
    
  } catch (error) {
    console.error('Error loading all time summary:', error);
    alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
  }
  
  if (loadingEl) loadingEl.style.display = 'none';
}

initAllTimePage();
