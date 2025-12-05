/**
 * ============================================
 * STORAGE - จัดการข้อมูลผ่าน Supabase
 * ============================================
 * 
 * 2 ระบบแยกกัน:
 * - Monthly: ข้อมูลเดือนปัจจุบัน (รีเซ็ตได้ด้วย Next Month)
 * - All Time: ข้อมูลทั้งหมดตลอดกาล (ถาวร ไม่มีวันลบ)
 */

// ============================================
// Monthly Storage (หน้าหลัก + Summary)
// ============================================

/**
 * โหลด transactions เดือนปัจจุบัน
 */
async function loadMonthlyTransactions() {
  return await fetchTransactionsFromDB();
}

/**
 * เพิ่ม transaction ใหม่ (บันทึกทั้ง Monthly และ Archive)
 * รองรับ offline mode
 */
async function addTransaction(transaction) {
  // ถ้า offline ให้เก็บไว้ใน queue
  if (!isOnline()) {
    addToOfflineQueue('add', transaction);
    return transaction; // Return transaction เพื่อให้ UI อัพเดทได้
  }

  // บันทึกไป Monthly
  const monthly = await insertTransactionToDB(transaction);

  // บันทึกไป Archive ด้วย (ถาวร)
  await insertToArchive(transaction);

  return monthly;
}

/**
 * ลบ transaction (ลบจากทั้ง Monthly และ Archive)
 */
async function deleteTransaction(id) {
  // ลบจาก Monthly
  await deleteTransactionFromDB(id);

  // ลบจาก Archive ด้วย
  await deleteFromArchive(id);

  return true;
}

/**
 * ลบหลาย transactions (ลบจากทั้ง Monthly และ Archive)
 * รองรับ offline mode
 */
async function deleteTransactions(ids) {
  const idsArray = Array.isArray(ids) ? ids : Array.from(ids);

  // ถ้า offline ให้เก็บไว้ใน queue
  if (!isOnline()) {
    addToOfflineQueue('deleteMultiple', { ids: idsArray });
    return true;
  }

  // ลบจาก Monthly
  await deleteMultipleTransactionsFromDB(idsArray);

  // ลบจาก Archive ด้วย
  await deleteMultipleFromArchive(idsArray);

  return true;
}

/**
 * รีเซ็ตข้อมูลเดือนปัจจุบัน (Next Month)
 * ลบเฉพาะ Monthly ไม่กระทบ Archive
 */
async function resetMonthlyData() {
  return await deleteAllTransactionsFromDB();
}

// ============================================
// All Time Storage (หน้า All Time Summary)
// ============================================

/**
 * โหลด transactions ทั้งหมด (All Time)
 */
async function loadAllTimeTransactions() {
  return await fetchArchiveTransactionsFromDB();
}

console.log('Storage module loaded (Monthly + Archive)!');
