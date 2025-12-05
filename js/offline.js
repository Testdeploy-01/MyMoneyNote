/**
 * ============================================
 * OFFLINE QUEUE - จัดการ transactions เมื่อ offline
 * ============================================
 */

const OFFLINE_QUEUE_KEY = 'money-notes-offline-queue';

/**
 * ตรวจสอบว่า online หรือไม่
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * ดึง offline queue จาก localStorage
 */
function getOfflineQueue() {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

/**
 * บันทึก offline queue ไป localStorage
 */
function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
}

/**
 * เพิ่ม transaction ไป offline queue
 */
function addToOfflineQueue(action, data) {
  const queue = getOfflineQueue();
  queue.push({
    id: generateId(),
    action, // 'add' | 'delete' | 'deleteMultiple'
    data,
    timestamp: Date.now()
  });
  saveOfflineQueue(queue);
  console.log('Added to offline queue:', action, data);
}

/**
 * ลบ item ออกจาก offline queue
 */
function removeFromOfflineQueue(queueId) {
  const queue = getOfflineQueue();
  const filtered = queue.filter(item => item.id !== queueId);
  saveOfflineQueue(filtered);
}

/**
 * Sync offline queue กับ server
 */
async function syncOfflineQueue() {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  console.log(`Syncing ${queue.length} offline items...`);

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      let success = false;

      switch (item.action) {
        case 'add':
          const result = await insertTransactionToDB(item.data);
          if (result) {
            await insertToArchive(item.data);
            success = true;
          }
          break;

        case 'delete':
          success = await deleteTransactionFromDB(item.data.id);
          if (success) await deleteFromArchive(item.data.id);
          break;

        case 'deleteMultiple':
          success = await deleteMultipleTransactionsFromDB(item.data.ids);
          if (success) await deleteMultipleFromArchive(item.data.ids);
          break;
      }

      if (success) {
        removeFromOfflineQueue(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Error syncing item:', error);
      failed++;
    }
  }

  console.log(`Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

/**
 * แสดง offline indicator
 */
function showOfflineIndicator() {
  let indicator = document.getElementById('offline-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.innerHTML = '<i class="ri-wifi-off-line"></i> Offline';
    document.body.appendChild(indicator);
  }

  indicator.classList.add('show');
}

/**
 * ซ่อน offline indicator
 */
function hideOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.classList.remove('show');
  }
}

/**
 * แสดง syncing indicator
 */
function showSyncingIndicator() {
  let indicator = document.getElementById('offline-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    document.body.appendChild(indicator);
  }

  indicator.innerHTML = '<i class="ri-refresh-line spinning"></i> Syncing...';
  indicator.classList.add('show', 'syncing');
}

/**
 * Setup offline event listeners
 */
function setupOfflineListeners() {
  window.addEventListener('online', async () => {
    console.log('Back online!');
    hideOfflineIndicator();

    const queue = getOfflineQueue();
    if (queue.length > 0) {
      showSyncingIndicator();
      const result = await syncOfflineQueue();
      hideOfflineIndicator();

      if (result.synced > 0) {
        showNotice(null, 'success', `Synced ${result.synced} offline transaction(s)`);
      }
      if (result.failed > 0) {
        showNotice(null, 'error', `Failed to sync ${result.failed} item(s)`);
      }
    }
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline');
    showOfflineIndicator();
  });

  // Check initial state
  if (!isOnline()) {
    showOfflineIndicator();
  }
}

console.log('Offline module loaded!');
