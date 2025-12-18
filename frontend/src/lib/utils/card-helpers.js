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
 */
export function getStatusVariant(status) {
  if (status === 'APPROVED') return 'approved';
  if (status === 'LIVE') return 'live';
  if (status === 'DIE') return 'dead';
  if (status === 'ERROR' || status === 'RETRY') return 'error';
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
 */
export function formatCardMessage(result) {
  if (!result.message) return null;
  
  if (result.status === 'APPROVED') {
    return result.chargeAmountFormatted 
      ? `Charged ${result.chargeAmountFormatted}` 
      : 'Payment successful';
  }
  
  if (result.status === 'DIE') {
    return result.message.replace(/^Declined:\s*/i, '').replace(/_/g, ' ');
  }
  
  return result.message.replace(/^(Error:|Tokenization failed:)\s*/i, '');
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





