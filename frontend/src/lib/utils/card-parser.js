/**
 * Card parsing utility for deduplication and expired card filtering
 */

// Minimum cards required to detect generation patterns (need enough data)
const MIN_CARDS_FOR_GEN_DETECTION = 10;

// Confidence threshold to flag as generated (higher = less false positives)
const GEN_CONFIDENCE_THRESHOLD = 75;

// Thresholds for generation detection
const GEN_DETECTION_THRESHOLDS = {
  SEQUENTIAL_SUFFIX_RATIO: 0.7,      // 70% of cards have sequential last digits
  LOW_MIDDLE_ENTROPY_RATIO: 0.3,     // Less than 30% unique middle digits
  SAME_EXPIRY_MIN_CARDS: 20,         // Min cards to flag same expiry (higher threshold)
  SEQUENTIAL_CVV_RATIO: 0.8,         // 80% sequential CVVs
};

/**
 * Detect if a batch of cards appears to be generated from a BIN generator
 * Only triggers with HIGH confidence patterns - avoids false positives
 * @param {Array<{number: string, expMonth: string, expYear: string, cvv: string}>} cards - Parsed cards
 * @returns {{isGenerated: boolean, confidence: number, reasons: string[], message: string}}
 */
export function detectGeneratedCards(cards) {
  const result = {
    isGenerated: false,
    confidence: 0,
    reasons: [],
    message: '',
  };

  // Need minimum cards to detect patterns reliably
  if (!cards || cards.length < MIN_CARDS_FOR_GEN_DETECTION) {
    return result;
  }

  let score = 0;

  // 1. Check if all cards share the same BIN (first 6 digits)
  // This alone is NOT suspicious - users often check same BIN
  const bins = new Set(cards.map(c => c.number.slice(0, 6)));
  const sameBin = bins.size === 1;

  // 2. Sequential suffix pattern (last 4 digits incrementing in order)
  // Only count if cards are already sorted by suffix (generator output)
  const suffixes = cards.map(c => parseInt(c.number.slice(-4), 10));
  let strictSeqCount = 0;
  for (let i = 1; i < suffixes.length; i++) {
    const diff = suffixes[i] - suffixes[i - 1];
    // Strict: must be incrementing in INPUT order, not just close values
    if (diff >= 1 && diff <= 5) strictSeqCount++;
  }
  const seqRatio = strictSeqCount / (cards.length - 1);
  if (seqRatio > GEN_DETECTION_THRESHOLDS.SEQUENTIAL_SUFFIX_RATIO) {
    result.reasons.push('sequential_suffix');
    score += 40;
  }

  // 3. Check for incrementing middle section (STRONGEST indicator)
  // Cards must be sorted by middle digits in INPUT order
  const midNums = cards.map(c => parseInt(c.number.slice(6, 12), 10));
  let midIncCount = 0;
  for (let i = 1; i < midNums.length; i++) {
    const diff = midNums[i] - midNums[i - 1];
    if (diff > 0 && diff <= 1000) midIncCount++;
  }
  const midIncRatio = midIncCount / (cards.length - 1);
  if (midIncRatio > 0.8 && sameBin) {
    result.reasons.push('incrementing_middle');
    score += 50;
  }

  // 4. Low entropy in middle digits (positions 6-10) - many repeating patterns
  const midDigits = cards.map(c => c.number.slice(6, 10));
  const uniqueMids = new Set(midDigits);
  const entropyRatio = uniqueMids.size / cards.length;
  if (entropyRatio < GEN_DETECTION_THRESHOLDS.LOW_MIDDLE_ENTROPY_RATIO) {
    result.reasons.push('low_middle_entropy');
    score += 30;
  }

  // 5. Identical expiry dates across large batch (20+ cards same exp is suspicious)
  const expiries = new Set(cards.map(c => `${c.expMonth}|${c.expYear}`));
  if (expiries.size === 1 && cards.length >= GEN_DETECTION_THRESHOLDS.SAME_EXPIRY_MIN_CARDS) {
    result.reasons.push('identical_expiry');
    score += 20;
  }

  // 6. Sequential CVVs in INPUT order (generator pattern)
  const cvvs = cards.map(c => parseInt(c.cvv, 10)).filter(v => !isNaN(v));
  if (cvvs.length >= 10) {
    let cvvSeqCount = 0;
    for (let i = 1; i < cvvs.length; i++) {
      if (cvvs[i] - cvvs[i - 1] === 1) cvvSeqCount++;
    }
    if (cvvSeqCount / cvvs.length > GEN_DETECTION_THRESHOLDS.SEQUENTIAL_CVV_RATIO) {
      result.reasons.push('sequential_cvv');
      score += 35;
    }
  }

  // 7. Identical CVVs across batch (very suspicious)
  const uniqueCvvs = new Set(cvvs);
  if (uniqueCvvs.size === 1 && cards.length >= 15) {
    result.reasons.push('identical_cvv');
    score += 40;
  }

  // Determine if generated - require HIGH confidence
  result.confidence = Math.min(score, 100);
  result.isGenerated = score >= GEN_CONFIDENCE_THRESHOLD;

  if (result.isGenerated) {
    result.message = `Generated cards detected (${result.confidence}% confidence): ${result.reasons.join(', ')}`;
  }

  return result;
}

/**
 * Validate a card number using the Luhn algorithm (mod 10 checksum)
 * @param {string} cardNumber - Card number (digits only or with spaces/dashes)
 * @returns {boolean} True if the card number passes Luhn validation
 */
export function isValidLuhn(cardNumber) {
  // Handle edge cases
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  // Remove any non-digit characters
  const digits = cardNumber.replace(/\D/g, '');
  
  // Must have between 13 and 19 digits for valid card numbers
  if (digits.length < 13 || digits.length > 19) return false;
  
  // Luhn algorithm implementation
  let sum = 0;
  let isEven = false;
  
  // Process digits from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Parse a single card line into components
 * Supports formats: number|mm|yy|cvv, number|mm|yyyy|cvv, number|mmyy|cvv, etc.
 * Accepts delimiters: |, \, /
 * Trailing data after CVV is ignored
 * @param {string} line - Raw card line
 * @returns {object|null} Parsed card object or null if invalid
 */
export function parseCardLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Split by accepted delimiters: |, \, /
  // Note: backslash needs to be escaped in regex
  const parts = trimmed.split(/[|\\\/]+/).filter(Boolean);
  if (parts.length < 3) return null;

  const number = parts[0].replace(/\D/g, '');
  if (number.length < 13 || number.length > 19) return null;

  let expMonth, expYear, cvv, zip;

  // Check if second part is combined MMYY or MMYYYY
  if (parts[1].length === 4 && /^\d{4}$/.test(parts[1])) {
    // MMYY format
    expMonth = parts[1].substring(0, 2);
    expYear = parts[1].substring(2, 4);
    cvv = parts[2] || '';
    zip = parts[3] ? parts[3].trim() : '';
  } else if (parts[1].length === 6 && /^\d{6}$/.test(parts[1])) {
    // MMYYYY format
    expMonth = parts[1].substring(0, 2);
    expYear = parts[1].substring(4, 6);
    cvv = parts[2] || '';
    zip = parts[3] ? parts[3].trim() : '';
  } else {
    // Separate MM and YY/YYYY - handle single-digit months
    const monthPart = parts[1].trim();
    expMonth = monthPart.padStart(2, '0');
    expYear = parts[2] ? parts[2].trim() : '';
    // CVV is the 4th part
    cvv = parts[3] ? parts[3].trim() : '';
    // ZIP is the 5th part (for AVS validation)
    zip = parts[4] ? parts[4].trim() : '';
  }

  // Normalize year to 2-digit format (handle 4-digit years like 2028 → 28)
  if (expYear && expYear.length === 4 && /^\d{4}$/.test(expYear)) {
    expYear = expYear.substring(2);
  }

  // Validate month (must be 1-12 after parsing)
  const monthNum = parseInt(expMonth, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;

  // Validate year is numeric (2 digits)
  if (!/^\d{2}$/.test(expYear)) return null;

  // Extract only digits from CVV (ignore any trailing non-digit data)
  const cleanCvv = cvv.replace(/\D/g, '');

  // Build result object
  const result = {
    number,
    expMonth: expMonth.padStart(2, '0'),
    expYear,
    cvv: cleanCvv,
    raw: trimmed,
  };

  // Include zip if present (for AVS validation)
  if (zip) {
    result.zip = zip;
  }

  return result;
}

/**
 * Check if a card is expired
 * @param {object} card - Parsed card object with expMonth and expYear
 * @returns {boolean} True if expired
 */
export function isCardExpired(card) {
  if (!card || !card.expMonth || !card.expYear) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100; // 2-digit year
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const cardYear = parseInt(card.expYear, 10);
  const cardMonth = parseInt(card.expMonth, 10);

  // Handle century boundary (00-30 = 2000s, 31-99 = 1900s - adjust as needed)
  // For simplicity, assume all years are 20xx if <= 50, 19xx if > 50
  // But typically we just compare as 2-digit years
  if (cardYear < currentYear) return true;
  if (cardYear === currentYear && cardMonth < currentMonth) return true;

  return false;
}

/**
 * Generate a unique key for a card (for deduplication)
 * Uses number + expMonth + expYear for exact match
 * @param {object} card - Parsed card object
 * @returns {string} Unique key
 */
function getCardKey(card) {
  return `${card.number}|${card.expMonth}|${card.expYear}`;
}

/**
 * Process card input text - remove duplicates, expired cards, invalid formats, and Luhn-invalid cards
 * Also detects generated cards from BIN generators
 * @param {string} input - Raw card input (multiple lines)
 * @param {object} options - Processing options
 * @param {boolean} options.removeDuplicates - Remove exact duplicates (default: true)
 * @param {boolean} options.removeExpired - Remove expired cards (default: true)
 * @param {boolean} options.removeInvalidFormat - Remove cards with invalid format (default: true)
 * @param {boolean} options.removeLuhnInvalid - Remove cards failing Luhn validation (default: true)
 * @param {boolean} options.detectGenerated - Detect generated cards (default: true)
 * @returns {object} Result with cleaned input, stats, generation detection, and original cards
 */
export function processCardInput(input, options = {}) {
  const {
    removeDuplicates = true,
    removeExpired = true,
    removeInvalidFormat = true,
    removeLuhnInvalid = true,
    detectGenerated = true,
  } = options;

  const lines = input.split('\n');
  const seen = new Set();
  const validCards = [];
  const result = {
    cleanedLines: [],
    originalCount: 0,
    duplicatesRemoved: 0,
    expiredRemoved: 0,
    invalidFormatRemoved: 0,
    luhnFailedRemoved: 0,
    validCount: 0,
    invalidLines: [],
    duplicateCards: [],
    expiredCards: [],
    luhnFailedCards: [],
    generatedDetection: null,
    isGenerated: false,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    result.originalCount++;

    const card = parseCardLine(trimmed);
    if (!card) {
      // Card has invalid format
      if (removeInvalidFormat) {
        result.invalidFormatRemoved++;
        result.invalidLines.push(trimmed);
        continue;
      } else {
        // Keep invalid lines as-is if not removing
        result.cleanedLines.push(trimmed);
        result.invalidLines.push(trimmed);
        continue;
      }
    }

    // Check Luhn validation
    if (removeLuhnInvalid && !isValidLuhn(card.number)) {
      result.luhnFailedRemoved++;
      result.luhnFailedCards.push(card.number.slice(-4));
      continue;
    }

    const key = getCardKey(card);

    // Check for duplicates
    if (removeDuplicates && seen.has(key)) {
      result.duplicatesRemoved++;
      result.duplicateCards.push(card.number.slice(-4));
      continue;
    }

    // Check for expired
    if (removeExpired && isCardExpired(card)) {
      result.expiredRemoved++;
      result.expiredCards.push(card.number.slice(-4));
      continue;
    }

    seen.add(key);
    result.cleanedLines.push(trimmed);
    validCards.push(card);
    result.validCount++;
  }

  result.cleanedInput = result.cleanedLines.join('\n');
  result.hasChanges = result.duplicatesRemoved > 0 || 
                      result.expiredRemoved > 0 || 
                      result.invalidFormatRemoved > 0 || 
                      result.luhnFailedRemoved > 0;

  if (detectGenerated && validCards.length >= MIN_CARDS_FOR_GEN_DETECTION) {
    result.generatedDetection = detectGeneratedCards(validCards);
    result.isGenerated = result.generatedDetection.isGenerated;
  }

  return result;
}

/**
 * Generate a toast message for card processing results
 * Consolidates multiple removal reasons into a single message
 * @param {object} result - Result from processCardInput
 * @returns {object|null} Toast config { type, message } or null if no changes
 * 
 * Requirements: 8.1, 8.2, 8.4, 8.5, 8.6
 */
export function getProcessingToastMessage(result) {
  if (!result.hasChanges) return null;

  const messages = [];
  
  // Requirement 8.2: Invalid format message
  if (result.invalidFormatRemoved > 0) {
    messages.push(`${result.invalidFormatRemoved} card${result.invalidFormatRemoved > 1 ? 's' : ''} with invalid format`);
  }
  
  // Requirement 8.1: Luhn validation failure message
  if (result.luhnFailedRemoved > 0) {
    messages.push(`${result.luhnFailedRemoved} card${result.luhnFailedRemoved > 1 ? 's' : ''} with invalid card numbers`);
  }
  
  // Requirement 8.5: Duplicate card message
  if (result.duplicatesRemoved > 0) {
    messages.push(`${result.duplicatesRemoved} duplicate card${result.duplicatesRemoved > 1 ? 's' : ''}`);
  }
  
  // Requirement 8.4: Expired card message
  if (result.expiredRemoved > 0) {
    messages.push(`${result.expiredRemoved} expired card${result.expiredRemoved > 1 ? 's' : ''}`);
  }

  if (messages.length === 0) return null;

  // Requirement 8.6: Consolidate multiple removal reasons into single toast
  const message = `Removed ${messages.join(', ')}`;
  
  return {
    type: 'info',
    message,
  };
}

/**
 * Generate a tier limit warning toast message
 * @param {number} cardCount - Current number of cards
 * @param {number} tierLimit - Maximum cards allowed for user's tier
 * @param {string} tier - User's tier name (e.g., 'free', 'bronze')
 * @returns {object} Toast config { type, message }
 * 
 * Requirements: 8.3
 */
export function getTierLimitWarningMessage(cardCount, tierLimit, tier) {
  return {
    type: 'warning',
    message: `You have ${cardCount} cards but your ${tier} tier limit is ${tierLimit}. Please reduce to continue.`
  };
}

/**
 * Generate a tier limit exceeded error toast message (for validation attempt)
 * @param {number} cardCount - Current number of cards
 * @param {number} tierLimit - Maximum cards allowed for user's tier
 * @param {string} tier - User's tier name (e.g., 'free', 'bronze')
 * @returns {object} Toast config { type, message }
 * 
 * Requirements: 8.7
 */
export function getTierLimitExceededMessage(cardCount, tierLimit, tier) {
  return {
    type: 'error',
    message: `You have ${cardCount} cards but your ${tier} tier limit is ${tierLimit}. Please reduce to continue.`
  };
}

/**
 * Generate an error message for generated cards detection
 * @param {object} generatedDetection - Result from detectGeneratedCards
 * @returns {object} Toast config { type, message }
 */
export function getGeneratedCardsErrorMessage(generatedDetection) {
  if (!generatedDetection || !generatedDetection.isGenerated) return null;
  
  return {
    type: 'error',
    message: `Generated cards not allowed. Detection confidence: ${generatedDetection.confidence}%`
  };
}

/**
 * Validate card input for submission eligibility
 * Returns validation state with reasons for blocking
 * @param {object} processResult - Result from processCardInput
 * @returns {{canSubmit: boolean, reason: string|null, errorType: 'no_valid_cards'|'generated_cards'|null}}
 */
export function validateForSubmission(processResult) {
  if (!processResult) {
    return { canSubmit: false, reason: 'No cards provided', errorType: 'no_valid_cards' };
  }

  if (processResult.validCount === 0) {
    return { canSubmit: false, reason: 'No valid cards to process', errorType: 'no_valid_cards' };
  }

  if (processResult.isGenerated) {
    return { 
      canSubmit: false, 
      reason: processResult.generatedDetection?.message || 'Generated cards detected',
      errorType: 'generated_cards'
    };
  }

  return { canSubmit: true, reason: null, errorType: null };
}

/**
 * Drop empty lines from card input while preserving cursor-friendly behavior.
 * Removes consecutive empty lines and trailing empty lines, keeps single newline at end for typing.
 * @param {string} input - Raw card input string
 * @returns {string} Cleaned input with empty lines removed
 */
export function dropEmptyLines(input) {
  if (!input) return input;
  
  // Split into lines and filter out empty ones
  const lines = input.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  
  // If input ends with newline(s), preserve one for typing continuation
  const endsWithNewline = input.endsWith('\n');
  
  // Join non-empty lines
  let result = nonEmptyLines.join('\n');
  
  // Add back single newline if user was at end of line (allows typing next card)
  if (endsWithNewline && result.length > 0) {
    result += '\n';
  }
  
  return result;
}
