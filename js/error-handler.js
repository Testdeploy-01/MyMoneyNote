/**
 * ============================================
 * ERROR HANDLER - จัดการ errors ทั้งหมด
 * ============================================
 */

/**
 * แสดง Error Boundary UI
 */
function showErrorBoundary(error, context = '') {
  // ลบ error boundary เก่าถ้ามี
  const existing = document.querySelector('.error-boundary');
  if (existing) existing.remove();

  const errorBoundary = document.createElement('div');
  errorBoundary.className = 'error-boundary';
  
  const errorMessage = error?.message || 'Unknown error';
  const errorStack = error?.stack || '';

  errorBoundary.innerHTML = `
    <i class="ri-error-warning-fill error-boundary-icon"></i>
    <h2 class="error-boundary-title">Oops! Something went wrong</h2>
    <p class="error-boundary-message">
      ${context ? context + '<br><br>' : ''}
      Don't worry, your data is safe. Try refreshing the page.
    </p>
    ${errorStack ? `<pre class="error-boundary-details">${escapeHtml(errorMessage)}</pre>` : ''}
    <button class="btn-hand" onclick="window.location.reload()">
      <i class="ri-refresh-line"></i> Refresh Page
    </button>
  `;

  document.body.appendChild(errorBoundary);
}

/**
 * Escape HTML เพื่อป้องกัน XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * จัดการ async errors
 */
async function safeAsync(asyncFn, context = '') {
  try {
    return await asyncFn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    handleError(error, context);
    return null;
  }
}

/**
 * จัดการ error ทั่วไป
 */
function handleError(error, context = '') {
  console.error('Error:', error);

  // Network errors - แสดง toast แทน
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    showNotice(null, 'error', 'Network error. Please check your connection.');
    return;
  }

  // Supabase errors
  if (error?.code?.startsWith('PGRST') || error?.message?.includes('supabase')) {
    showNotice(null, 'error', 'Database error. Please try again.');
    return;
  }

  // Critical errors - แสดง error boundary
  if (error instanceof TypeError || error instanceof ReferenceError) {
    showErrorBoundary(error, context);
    return;
  }

  // Default - แสดง toast
  showNotice(null, 'error', error?.message || 'An error occurred');
}

/**
 * Setup global error handlers
 */
function setupErrorHandlers() {
  // Unhandled errors
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    handleError(error || new Error(message), 'Global');
    return true; // Prevent default browser error handling
  };

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    handleError(event.reason, 'Promise');
    event.preventDefault();
  });
}

console.log('Error handler loaded!');
