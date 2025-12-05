/**
 * ============================================
 * SUPABASE - เชื่อมต่อฐานข้อมูล Supabase
 * ============================================
 * 
 * ใช้ 2 ตาราง:
 * - transactions: ข้อมูลเดือนปัจจุบัน (รีเซ็ตได้)
 * - transactions_archive: ข้อมูลทั้งหมด (ถาวร)
 */

// ============================================
// Supabase Configuration
// ============================================
// หมายเหตุ: anon key นี้ปลอดภัยสำหรับ client-side เพราะ:
// 1. ใช้ Row Level Security (RLS) บน Supabase
// 2. key นี้มีสิทธิ์จำกัดตาม RLS policies
// สำหรับ production ควรตั้ง RLS policies ให้เหมาะสม

const SUPABASE_URL = 'https://oeeyxnzpuvusalqruzud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZXl4bnpwdXZ1c2FscXJ1enVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDA3NzYsImV4cCI6MjA4MDE3Njc3Nn0.fIy6eCUusBisIXgbH41LkUSpN01paPf3gWAITsZeXUE';

// สร้าง Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Monthly Transactions (ตาราง transactions)
// ============================================

/**
 * ดึง transactions เดือนปัจจุบันจาก Supabase
 */
async function fetchTransactionsFromDB() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * เพิ่ม transaction ใหม่ไปตาราง transactions (เดือนปัจจุบัน)
 */
async function insertTransactionToDB(transaction) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        time: transaction.time || null,
        note: transaction.note || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error inserting transaction:', error);
    return null;
  }
}

/**
 * ลบ transaction จากตาราง transactions
 */
async function deleteTransactionFromDB(id) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}

/**
 * ลบหลาย transactions จากตาราง transactions
 */
async function deleteMultipleTransactionsFromDB(ids) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting transactions:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting transactions:', error);
    return false;
  }
}

/**
 * ลบ transactions ทั้งหมดจากตาราง transactions (สำหรับ Next Month)
 */
async function deleteAllTransactionsFromDB() {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error deleting all transactions:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting all transactions:', error);
    return false;
  }
}

// ============================================
// Archive Transactions (ตาราง transactions_archive)
// ============================================

/**
 * ดึง transactions ทั้งหมดจาก archive (All Time)
 */
async function fetchArchiveTransactionsFromDB() {
  try {
    const { data, error } = await supabase
      .from('transactions_archive')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching archive:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching archive:', error);
    return [];
  }
}

/**
 * เพิ่ม transaction ไป archive (ถาวร)
 */
async function insertToArchive(transaction) {
  try {
    const { data, error } = await supabase
      .from('transactions_archive')
      .insert([{
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        time: transaction.time || null,
        note: transaction.note || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting to archive:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error inserting to archive:', error);
    return null;
  }
}

/**
 * ลบ transaction จาก archive
 */
async function deleteFromArchive(id) {
  try {
    const { error } = await supabase
      .from('transactions_archive')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting from archive:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from archive:', error);
    return false;
  }
}

/**
 * ลบหลาย transactions จาก archive
 */
async function deleteMultipleFromArchive(ids) {
  try {
    const { error } = await supabase
      .from('transactions_archive')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting from archive:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from archive:', error);
    return false;
  }
}

// ============================================
// Budget Settings (ตาราง budget)
// ============================================

/**
 * ดึง budget settings จาก Supabase
 */
async function fetchBudgetFromDB() {
  try {
    const { data, error } = await supabase
      .from('budget')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // No budget found is not an error
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching budget:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
}

/**
 * บันทึก budget settings ไป Supabase (upsert)
 */
async function saveBudgetToDB(budget) {
  try {
    // ลบ budget เก่าก่อน แล้วเพิ่มใหม่
    await supabase.from('budget').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { data, error } = await supabase
      .from('budget')
      .insert([{
        id: budget.cycleId,
        amount: budget.amount,
        cycle_days: budget.cycleDays,
        start_date: budget.startDate
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving budget:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving budget:', error);
    return null;
  }
}

/**
 * ลบ budget (เมื่อเริ่ม New Cycle)
 */
async function deleteBudgetFromDB() {
  try {
    const { error } = await supabase
      .from('budget')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error deleting budget:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting budget:', error);
    return false;
  }
}

console.log('Supabase module loaded!');
