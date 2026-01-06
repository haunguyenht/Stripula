/**
 * Card Helper Utilities
 * 
 * Helper functions for card display formatting
 */

/**
 * Convert string to Title Case
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get badge variant based on card validation status
 * Supports SK-based charger statuses: Charged, Live, Declined
 */
export function getStatusVariant(status) {
  const s = status?.toUpperCase();
  if (s === 'APPROVED' || s === 'CHARGED') return 'approved';
  if (s === 'LIVE') return 'live';
  if (s === 'DIE' || s === 'DEAD') return 'dead';
  if (s === 'DECLINED') return 'declined';
  if (s === 'ERROR' || s === 'RETRY' || s === 'CAPTCHA') return 'error';
  if (s === '3DS' || s === '3DS_REQUIRED') return 'warning';
  return 'secondary';
}

/**
 * Format duration from milliseconds to seconds string
 */
export function formatDuration(ms) {
  if (!ms) return null;
  return (ms / 1000).toFixed(1);
}

/**
 * Format card result message for display
 * Supports SK-based charger response format
 */
export function formatCardMessage(result) {
  if (!result) return null;
  
  const status = result.status?.toUpperCase();
  const message = result.message || '';
  
  // For charged/approved cards, show charge amount if available
  if (status === 'APPROVED' || status === 'CHARGED') {
    if (result.chargeAmountFormatted) {
      return `Charged ${result.chargeAmountFormatted}`;
    }
    if (result.amount) {
      // Convert cents to dollars if amount > 100
      const displayAmount = result.amount > 100 ? (result.amount / 100).toFixed(2) : result.amount.toFixed(2);
      const currency = result.currency?.toUpperCase() || 'USD';
      return `Charged $${displayAmount} ${currency}`;
    }
    return message || 'Payment successful';
  }
  
  // For live cards (3DS passed)
  if (status === 'LIVE') {
    if (result.threeDs === 'passed') {
      return message || '3DS authenticated';
    }
    return message || 'Card is live';
  }
  
  if (status === 'DIE' || status === 'DEAD') {
    return message.replace(/^Declined:\s*/i, '').replace(/_/g, ' ') || 'Card declined';
  }
  
  if (status === 'DECLINED') {
    return message.replace(/^Declined:\s*/i, '').replace(/_/g, ' ') || 'Card declined';
  }
  
  // Clean up error messages - remove redundant "Error" prefix
  let cleanedMessage = message.replace(/^(Error:|Tokenization failed:)\s*/i, '');
  
  // If message is just "Error" (redundant with status badge), return a more descriptive message
  if (cleanedMessage.toLowerCase() === 'error' || cleanedMessage.trim() === '') {
    return 'Validation failed';
  }
  
  return cleanedMessage;
}

/**
 * Format card for clipboard copy
 */
export function formatCardForCopy(result) {
  const card = result.fullCard || result.card;
  const status = result.status || '';
  const country = (result.binData?.country || '').toUpperCase();
  const category = (result.binData?.category || '').toUpperCase();
  const type = (result.binData?.type || '').toUpperCase();
  return `${card}|${status}|${country}|${category}|${type}`;
}





