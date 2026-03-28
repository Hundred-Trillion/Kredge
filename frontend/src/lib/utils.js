/**
 * Format number in Indian currency format: ₹X,XX,XXX
 * Uses the Indian grouping system (lakhs, crores)
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const num = Math.abs(Math.round(amount));
  const str = num.toString();
  let result = '';
  const len = str.length;

  if (len <= 3) {
    result = str;
  } else {
    result = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) {
      result = remaining + ',' + result;
    }
  }

  return (isNegative ? '-' : '') + '₹' + result;
}

/**
 * Format number with Indian grouping (no currency symbol)
 */
export function formatIndianNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return formatINR(num).replace('₹', '');
}

/**
 * Get time-aware greeting
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format GSTIN with proper spacing for readability
 */
export function formatGSTIN(gstin) {
  if (!gstin) return '—';
  return gstin.toUpperCase();
}

/**
 * Get month name from month number
 */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[(month - 1) % 12] || 'Unknown';
}

/**
 * Get short month name
 */
export function getMonthShort(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[(month - 1) % 12] || '???';
}

/**
 * Format date string to readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format period (month + year) to readable string
 */
export function formatPeriod(month, year) {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Status color mapping
 */
export function getStatusConfig(status) {
  const configs = {
    pending: { label: 'Pending', className: 'badge-warning' },
    processing: { label: 'Processing', className: 'badge-info' },
    completed: { label: 'Completed', className: 'badge-success' },
    failed: { label: 'Failed', className: 'badge-danger' },
  };
  return configs[status] || configs.pending;
}

/**
 * Mismatch type display config
 */
export function getMismatchConfig(type) {
  const configs = {
    MISSING_IN_2B: { label: 'Missing in 2B', className: 'badge-danger', description: 'Invoice present in Purchase Register but absent in GSTR-2B' },
    VALUE_MISMATCH: { label: 'Value Mismatch', className: 'badge-warning', description: 'Invoice amounts differ between Purchase Register and GSTR-2B' },
    GSTIN_MISMATCH: { label: 'GSTIN Mismatch', className: 'badge-info', description: 'Supplier GSTIN does not match between Purchase Register and GSTR-2B' },
  };
  return configs[type] || { label: type, className: 'badge', description: '' };
}

/**
 * Generate API URL
 */
export function apiUrl(path) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${base}${path}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLen = 30) {
  if (!str) return '—';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
