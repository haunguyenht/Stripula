/**
 * File Import/Export Utilities
 * 
 * Handles CSV and TXT file parsing for card import,
 * and result formatting for export.
 */

import { parseCardLine } from './card-parser';

// Supported CSV column headers (case-insensitive)
const COLUMN_MAPPINGS = {
  number: ['card_number', 'number', 'cc', 'card', 'cardnumber', 'card_no', 'pan'],
  expMonth: ['exp_month', 'month', 'mm', 'expmonth', 'exp_mm', 'expiry_month'],
  expYear: ['exp_year', 'year', 'yy', 'yyyy', 'expyear', 'exp_yy', 'expiry_year'],
  cvv: ['cvv', 'cvc', 'security_code', 'cvv2', 'cvc2', 'securitycode', 'cv2'],
  combinedExp: ['exp', 'expiry', 'expiration', 'exp_date', 'expiry_date'],
};

/**
 * Detect column mapping from CSV headers
 * @param {string[]} headers - Array of header strings
 * @returns {object} Column mapping with indices
 */
export function detectCSVColumns(headers) {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));
  
  const mapping = {
    numberIndex: -1,
    expMonthIndex: -1,
    expYearIndex: -1,
    cvvIndex: -1,
    combinedExpIndex: -1,
    hasHeaders: false,
  };

  // Try to find each column type
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i];
    
    if (mapping.numberIndex === -1 && COLUMN_MAPPINGS.number.includes(header)) {
      mapping.numberIndex = i;
      mapping.hasHeaders = true;
    }
    if (mapping.expMonthIndex === -1 && COLUMN_MAPPINGS.expMonth.includes(header)) {
      mapping.expMonthIndex = i;
      mapping.hasHeaders = true;
    }
    if (mapping.expYearIndex === -1 && COLUMN_MAPPINGS.expYear.includes(header)) {
      mapping.expYearIndex = i;
      mapping.hasHeaders = true;
    }
    if (mapping.cvvIndex === -1 && COLUMN_MAPPINGS.cvv.includes(header)) {
      mapping.cvvIndex = i;
      mapping.hasHeaders = true;
    }
    if (mapping.combinedExpIndex === -1 && COLUMN_MAPPINGS.combinedExp.includes(header)) {
      mapping.combinedExpIndex = i;
      mapping.hasHeaders = true;
    }
  }

  return mapping;
}

/**
 * Check if a row looks like card data (numeric patterns)
 * Used for headerless CSV detection
 * @param {string[]} row - Array of cell values
 * @returns {boolean} True if row appears to be card data
 */
export function isCardDataRow(row) {
  if (!row || row.length < 3) return false;
  
  // First column should be a card number (13-19 digits)
  const firstCell = row[0].replace(/\D/g, '');
  if (firstCell.length < 13 || firstCell.length > 19) return false;
  
  // Should have at least one more numeric field
  const numericCount = row.filter(cell => /^\d+$/.test(cell.trim())).length;
  return numericCount >= 2;
}

/**
 * Infer column mapping for headerless CSV
 * @param {string[]} row - First data row
 * @returns {object} Inferred column mapping
 */
export function inferColumnMapping(row) {
  const mapping = {
    numberIndex: -1,
    expMonthIndex: -1,
    expYearIndex: -1,
    cvvIndex: -1,
    combinedExpIndex: -1,
    hasHeaders: false,
  };

  for (let i = 0; i < row.length; i++) {
    const cell = row[i].trim();
    const numericOnly = cell.replace(/\D/g, '');
    
    // Card number: 13-19 digits
    if (mapping.numberIndex === -1 && numericOnly.length >= 13 && numericOnly.length <= 19) {
      mapping.numberIndex = i;
      continue;
    }
    
    // Combined expiry: MMYY or MM/YY format
    if (mapping.combinedExpIndex === -1 && mapping.expMonthIndex === -1) {
      if (/^\d{4}$/.test(cell) || /^\d{2}\/\d{2}$/.test(cell) || /^\d{2}-\d{2}$/.test(cell)) {
        mapping.combinedExpIndex = i;
        continue;
      }
    }
    
    // Month: 1-2 digits, value 1-12
    if (mapping.expMonthIndex === -1 && mapping.combinedExpIndex === -1) {
      const monthVal = parseInt(cell, 10);
      if (/^\d{1,2}$/.test(cell) && monthVal >= 1 && monthVal <= 12) {
        mapping.expMonthIndex = i;
        continue;
      }
    }
    
    // Year: 2 or 4 digits
    if (mapping.expYearIndex === -1 && mapping.combinedExpIndex === -1) {
      if (/^\d{2}$/.test(cell) || /^\d{4}$/.test(cell)) {
        mapping.expYearIndex = i;
        continue;
      }
    }
    
    // CVV: 3-4 digits
    if (mapping.cvvIndex === -1 && /^\d{3,4}$/.test(cell)) {
      mapping.cvvIndex = i;
    }
  }

  return mapping;
}


/**
 * Parse combined expiry format (MMYY, MM/YY, MMYYYY)
 * @param {string} expiry - Combined expiry string
 * @returns {object|null} { month, year } or null if invalid
 */
export function parseCombinedExpiry(expiry) {
  if (!expiry) return null;
  
  const cleaned = expiry.trim();
  
  // MM/YY or MM-YY format
  if (/^\d{2}[\/\-]\d{2}$/.test(cleaned)) {
    const [month, year] = cleaned.split(/[\/\-]/);
    return { month, year };
  }
  
  // MMYY format (4 digits)
  if (/^\d{4}$/.test(cleaned)) {
    return {
      month: cleaned.substring(0, 2),
      year: cleaned.substring(2, 4),
    };
  }
  
  // MMYYYY format (6 digits)
  if (/^\d{6}$/.test(cleaned)) {
    return {
      month: cleaned.substring(0, 2),
      year: cleaned.substring(4, 6),
    };
  }
  
  return null;
}

/**
 * Map a CSV row to card data using column mapping
 * @param {string[]} row - Array of cell values
 * @param {object} mapping - Column mapping from detectCSVColumns
 * @returns {object|null} Card data or null if invalid
 */
export function mapCSVRow(row, mapping) {
  if (!row || !mapping) return null;
  
  // Extract card number
  const numberCell = mapping.numberIndex >= 0 ? row[mapping.numberIndex] : null;
  if (!numberCell) return null;
  
  const number = numberCell.replace(/\D/g, '');
  if (number.length < 13 || number.length > 19) return null;
  
  let expMonth, expYear;
  
  // Handle combined expiry
  if (mapping.combinedExpIndex >= 0) {
    const combined = parseCombinedExpiry(row[mapping.combinedExpIndex]);
    if (combined) {
      expMonth = combined.month;
      expYear = combined.year;
    }
  }
  
  // Handle separate month/year
  if (!expMonth && mapping.expMonthIndex >= 0) {
    expMonth = row[mapping.expMonthIndex]?.trim().padStart(2, '0');
  }
  if (!expYear && mapping.expYearIndex >= 0) {
    expYear = row[mapping.expYearIndex]?.trim();
    // Normalize 4-digit year to 2-digit
    if (expYear && expYear.length === 4) {
      expYear = expYear.substring(2);
    }
  }
  
  // Validate month
  const monthNum = parseInt(expMonth, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;
  
  // Validate year
  if (!expYear || !/^\d{2}$/.test(expYear)) return null;
  
  // Extract CVV (optional but expected)
  let cvv = '';
  if (mapping.cvvIndex >= 0 && row[mapping.cvvIndex]) {
    cvv = row[mapping.cvvIndex].replace(/\D/g, '');
  }
  
  return {
    number,
    expMonth: expMonth.padStart(2, '0'),
    expYear,
    cvv,
    raw: `${number}|${expMonth}|${expYear}|${cvv}`,
  };
}

/**
 * Parse CSV row from a line (handles quoted fields)
 * @param {string} line - CSV line
 * @returns {string[]} Array of cell values
 */
export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current.trim());
  return result;
}


/**
 * Parse CSV content into card data
 * @param {string} content - CSV file content
 * @param {object} options - Parse options
 * @param {number} options.maxCards - Maximum cards to parse (default: 10000)
 * @returns {object} Parse result with cards, stats, and errors
 */
export function parseCSV(content, options = {}) {
  const { maxCards = 10000 } = options;
  
  const result = {
    cards: [],
    stats: {
      totalParsed: 0,
      invalidRows: 0,
      truncated: false,
      truncatedCount: 0,
    },
    errors: [],
  };
  
  if (!content || typeof content !== 'string') {
    result.errors.push('Empty or invalid content');
    return result;
  }
  
  // Split into lines and filter empty
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    result.errors.push('No data found in file');
    return result;
  }
  
  // Parse first row to detect headers
  const firstRow = parseCSVLine(lines[0]);
  let mapping = detectCSVColumns(firstRow);
  let startIndex = 0;
  
  // If no headers detected, check if first row is card data
  if (!mapping.hasHeaders) {
    if (isCardDataRow(firstRow)) {
      // Headerless CSV - infer mapping from first row
      mapping = inferColumnMapping(firstRow);
      startIndex = 0; // Include first row as data
    } else {
      // Try treating as headers anyway with positional mapping
      mapping = {
        numberIndex: 0,
        expMonthIndex: 1,
        expYearIndex: 2,
        cvvIndex: 3,
        combinedExpIndex: -1,
        hasHeaders: false,
      };
      startIndex = 1;
    }
  } else {
    startIndex = 1; // Skip header row
  }
  
  // Validate we have minimum required columns
  const hasNumber = mapping.numberIndex >= 0;
  const hasExpiry = (mapping.expMonthIndex >= 0 && mapping.expYearIndex >= 0) || mapping.combinedExpIndex >= 0;
  
  if (!hasNumber || !hasExpiry) {
    result.errors.push('Could not detect required columns (card number, expiry)');
    return result;
  }
  
  // Parse data rows
  for (let i = startIndex; i < lines.length; i++) {
    // Check truncation limit
    if (result.cards.length >= maxCards) {
      result.stats.truncated = true;
      result.stats.truncatedCount = lines.length - startIndex - result.cards.length;
      break;
    }
    
    const row = parseCSVLine(lines[i]);
    const card = mapCSVRow(row, mapping);
    
    if (card) {
      result.cards.push(card);
      result.stats.totalParsed++;
    } else {
      result.stats.invalidRows++;
    }
  }
  
  return result;
}

/**
 * Parse TXT content into card data
 * Uses existing parseCardLine logic for consistency
 * @param {string} content - TXT file content
 * @param {object} options - Parse options
 * @param {number} options.maxCards - Maximum cards to parse (default: 10000)
 * @returns {object} Parse result with cards, stats, and errors
 */
export function parseTXT(content, options = {}) {
  const { maxCards = 10000 } = options;
  
  const result = {
    cards: [],
    stats: {
      totalParsed: 0,
      invalidRows: 0,
      truncated: false,
      truncatedCount: 0,
    },
    errors: [],
  };
  
  if (!content || typeof content !== 'string') {
    result.errors.push('Empty or invalid content');
    return result;
  }
  
  // Split into lines and filter empty
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    result.errors.push('No data found in file');
    return result;
  }
  
  // Parse each line using existing parseCardLine
  for (const line of lines) {
    // Check truncation limit
    if (result.cards.length >= maxCards) {
      result.stats.truncated = true;
      result.stats.truncatedCount = lines.length - result.cards.length - result.stats.invalidRows;
      break;
    }
    
    const card = parseCardLine(line);
    
    if (card) {
      result.cards.push(card);
      result.stats.totalParsed++;
    } else {
      result.stats.invalidRows++;
    }
  }
  
  return result;
}

/**
 * Detect file type from content
 * @param {string} content - File content
 * @param {string} filename - Original filename
 * @returns {'csv'|'txt'} Detected file type
 */
export function detectFileType(content, filename = '') {
  // Check extension first
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'csv') return 'csv';
  if (ext === 'txt') return 'txt';
  
  // Detect from content
  const firstLine = content.split(/\r?\n/)[0] || '';
  
  // If contains commas and looks like CSV structure
  if (firstLine.includes(',') && firstLine.split(',').length >= 3) {
    return 'csv';
  }
  
  return 'txt';
}

/**
 * Parse file content (auto-detect format)
 * @param {string} content - File content
 * @param {string} filename - Original filename
 * @param {object} options - Parse options
 * @returns {object} Parse result
 */
export function parseFile(content, filename = '', options = {}) {
  const fileType = detectFileType(content, filename);
  
  if (fileType === 'csv') {
    return parseCSV(content, options);
  }
  
  return parseTXT(content, options);
}

// ============================================================================
// EXPORT FORMATTING UTILITIES
// ============================================================================

/**
 * Default columns available for export
 */
export const EXPORT_COLUMNS = {
  card: { label: 'Card', key: 'card' },
  status: { label: 'Status', key: 'status' },
  message: { label: 'Message', key: 'message' },
  duration: { label: 'Duration (ms)', key: 'duration' },
  brand: { label: 'Brand', key: 'binData.scheme' },
  type: { label: 'Type', key: 'binData.type' },
  country: { label: 'Country', key: 'binData.country' },
  bank: { label: 'Bank', key: 'binData.bank' },
  riskLevel: { label: 'Risk Level', key: 'riskLevel' },
  riskScore: { label: 'Risk Score', key: 'riskScore' },
};

/**
 * Default column selection for export
 */
export const DEFAULT_EXPORT_COLUMNS = ['card', 'status', 'message', 'duration'];

/**
 * Escape a value for CSV output
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV value
 */
export function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // If contains comma, quote, newline, or leading/trailing whitespace, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str !== str.trim()) {
    // Escape quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Get nested property value from object using dot notation
 * @param {object} obj - Source object
 * @param {string} path - Dot-notation path (e.g., 'binData.scheme')
 * @returns {*} Value at path or undefined
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Extract card string from result
 * @param {object} result - Validation result
 * @returns {string} Card string in number|mm|yy|cvv format
 */
export function extractCardString(result) {
  // Try fullCard first (most complete)
  if (result.fullCard) return result.fullCard;
  
  // Try card field
  if (result.card) {
    // If card is already in pipe format, return as-is
    if (result.card.includes('|')) return result.card;
    
    // Otherwise, it's just the number - try to reconstruct
    return result.card;
  }
  
  return '';
}

/**
 * Get column value from a result object
 * @param {object} result - Validation result
 * @param {string} columnKey - Column key from EXPORT_COLUMNS
 * @returns {*} Column value
 */
export function getColumnValue(result, columnKey) {
  const column = EXPORT_COLUMNS[columnKey];
  if (!column) return '';
  
  // Special handling for card column
  if (columnKey === 'card') {
    return extractCardString(result);
  }
  
  // Use dot notation path for nested values
  const value = getNestedValue(result, column.key);
  return value !== undefined ? value : '';
}

/**
 * Format validation results as CSV
 * @param {object[]} results - Array of validation results
 * @param {string[]} columns - Array of column keys to include
 * @returns {string} CSV formatted string
 */
export function formatCSV(results, columns = DEFAULT_EXPORT_COLUMNS) {
  if (!results || results.length === 0) return '';
  
  // Validate columns
  const validColumns = columns.filter(col => EXPORT_COLUMNS[col]);
  if (validColumns.length === 0) {
    validColumns.push(...DEFAULT_EXPORT_COLUMNS);
  }
  
  // Build header row
  const headers = validColumns.map(col => EXPORT_COLUMNS[col].label);
  const headerRow = headers.map(escapeCSVValue).join(',');
  
  // Build data rows
  const dataRows = results.map(result => {
    const values = validColumns.map(col => {
      const value = getColumnValue(result, col);
      return escapeCSVValue(value);
    });
    return values.join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Format validation results as plain text
 * One result per line: card | status | message
 * @param {object[]} results - Array of validation results
 * @returns {string} Plain text formatted string
 */
export function formatTXT(results) {
  if (!results || results.length === 0) return '';
  
  return results.map(result => {
    const card = extractCardString(result);
    const status = result.status || '';
    const message = result.message || '';
    
    return `${card} | ${status} | ${message}`;
  }).join('\n');
}

/**
 * Format validation results as JSON
 * @param {object[]} results - Array of validation results
 * @param {object} options - Format options
 * @param {boolean} options.pretty - Pretty print JSON (default: true)
 * @returns {string} JSON formatted string
 */
export function formatJSON(results, options = {}) {
  const { pretty = true } = options;
  
  if (!results || results.length === 0) return '[]';
  
  // Clean results for JSON export (remove circular refs, functions, etc.)
  const cleanResults = results.map(result => ({
    card: extractCardString(result),
    status: result.status,
    message: result.message,
    duration: result.duration,
    binData: result.binData || null,
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    declineCode: result.declineCode,
  }));
  
  return pretty 
    ? JSON.stringify(cleanResults, null, 2)
    : JSON.stringify(cleanResults);
}

/**
 * Format results as cards only (for re-processing)
 * @param {object[]} results - Array of validation results
 * @returns {string} Cards in number|mm|yy|cvv format, one per line
 */
export function formatCardsOnly(results) {
  if (!results || results.length === 0) return '';
  
  return results
    .map(result => extractCardString(result))
    .filter(card => card) // Remove empty cards
    .join('\n');
}

/**
 * Generate a timestamped filename for export
 * @param {string} prefix - Filename prefix (e.g., 'results', 'cards')
 * @param {string} filter - Active filter (e.g., 'approved', 'declined', 'error', 'all')
 * @param {string} format - File format ('csv', 'txt', 'json')
 * @returns {string} Generated filename
 */
export function generateFilename(prefix = 'results', filter = 'all', format = 'csv') {
  const now = new Date();
  
  // Format: YYYY-MM-DD_HH-MM-SS
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-') + '_' + [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('-');
  
  // Include filter in filename if not 'all'
  const filterPart = filter && filter !== 'all' ? `_${filter}` : '';
  
  return `${prefix}${filterPart}_${timestamp}.${format}`;
}

/**
 * Get MIME type for export format
 * @param {string} format - Export format ('csv', 'txt', 'json')
 * @returns {string} MIME type
 */
export function getMimeType(format) {
  const mimeTypes = {
    csv: 'text/csv;charset=utf-8',
    txt: 'text/plain;charset=utf-8',
    json: 'application/json;charset=utf-8',
  };
  
  return mimeTypes[format] || 'text/plain;charset=utf-8';
}

/**
 * Trigger file download in browser
 * @param {string} content - File content
 * @param {string} filename - Filename for download
 * @param {string} mimeType - MIME type (optional, auto-detected from filename)
 */
export function downloadFile(content, filename, mimeType) {
  // Auto-detect MIME type from filename if not provided
  if (!mimeType) {
    const ext = filename.split('.').pop()?.toLowerCase();
    mimeType = getMimeType(ext);
  }
  
  // Create blob and download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// CHUNKED PROCESSING UTILITIES
// ============================================================================

/**
 * Maximum number of cards allowed for import
 */
export const MAX_CARDS_LIMIT = 10000;

/**
 * Default chunk size for processing
 */
export const DEFAULT_CHUNK_SIZE = 500;

/**
 * Generator function that yields chunks of an array
 * @param {T[]} array - Array to split into chunks
 * @param {number} chunkSize - Size of each chunk (default: 500)
 * @yields {T[]} Chunk of the array
 * @template T
 */
export function* chunkArray(array, chunkSize = DEFAULT_CHUNK_SIZE) {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return;
  }
  
  const size = Math.max(1, Math.floor(chunkSize));
  
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}

/**
 * Process items in chunks with progress callback
 * Prevents UI blocking by yielding control between chunks
 * 
 * @param {T[]} items - Array of items to process
 * @param {function(T[]): Promise<R[]>} processor - Async function to process each chunk
 * @param {number} chunkSize - Size of each chunk (default: 500)
 * @param {function(number): void} onProgress - Progress callback (0-100)
 * @returns {Promise<R[]>} Combined results from all chunks
 * @template T, R
 */
export async function processInChunks(items, processor, chunkSize = DEFAULT_CHUNK_SIZE, onProgress) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    if (onProgress) onProgress(100);
    return [];
  }
  
  if (typeof processor !== 'function') {
    throw new Error('Processor must be a function');
  }
  
  const results = [];
  const totalItems = items.length;
  let processedCount = 0;
  
  for (const chunk of chunkArray(items, chunkSize)) {
    // Process the chunk
    const chunkResults = await processor(chunk);
    
    // Collect results
    if (Array.isArray(chunkResults)) {
      results.push(...chunkResults);
    }
    
    // Update progress
    processedCount += chunk.length;
    if (onProgress) {
      const progress = Math.round((processedCount / totalItems) * 100);
      onProgress(progress);
    }
    
    // Yield control to prevent UI blocking
    // Using setTimeout with 0ms allows the event loop to process other tasks
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Truncate an array to the maximum allowed limit
 * @param {T[]} items - Array to truncate
 * @param {number} maxLimit - Maximum number of items (default: 10000)
 * @returns {object} { items: T[], truncated: boolean, truncatedCount: number }
 * @template T
 */
export function truncateToLimit(items, maxLimit = MAX_CARDS_LIMIT) {
  if (!items || !Array.isArray(items)) {
    return { items: [], truncated: false, truncatedCount: 0 };
  }
  
  if (items.length <= maxLimit) {
    return { items, truncated: false, truncatedCount: 0 };
  }
  
  return {
    items: items.slice(0, maxLimit),
    truncated: true,
    truncatedCount: items.length - maxLimit,
  };
}

/**
 * Check if file size exceeds the streaming threshold
 * Files larger than this should use chunked/streaming parsing
 * @param {number} sizeInBytes - File size in bytes
 * @param {number} threshold - Threshold in bytes (default: 5MB)
 * @returns {boolean} True if file should use streaming
 */
export function shouldUseStreaming(sizeInBytes, threshold = 5 * 1024 * 1024) {
  return sizeInBytes > threshold;
}

/**
 * Estimate the number of cards in a file based on size
 * Assumes average line length of ~30 characters for card data
 * @param {number} sizeInBytes - File size in bytes
 * @returns {number} Estimated card count
 */
export function estimateCardCount(sizeInBytes) {
  const avgLineLength = 30; // number|mm|yy|cvv ≈ 25-35 chars
  return Math.ceil(sizeInBytes / avgLineLength);
}

/**
 * Export results to file with specified format and options
 * @param {object[]} results - Array of validation results
 * @param {object} options - Export options
 * @param {string} options.format - Export format ('csv', 'txt', 'json')
 * @param {string[]} options.columns - Columns to include (for CSV)
 * @param {string} options.filter - Active filter for filename
 * @param {boolean} options.cardsOnly - Export only card data
 * @param {boolean} options.includeBinData - Include BIN data columns
 * @param {string} options.prefix - Filename prefix
 * @returns {object} Export result { success, filename, error }
 */
export function exportResults(results, options = {}) {
  const {
    format = 'csv',
    columns = DEFAULT_EXPORT_COLUMNS,
    filter = 'all',
    cardsOnly = false,
    includeBinData = false,
    prefix = 'results',
  } = options;
  
  try {
    if (!results || results.length === 0) {
      return { success: false, error: 'No results to export' };
    }
    
    let content;
    let actualFormat = format;
    
    if (cardsOnly) {
      // Cards-only export always uses TXT format
      content = formatCardsOnly(results);
      actualFormat = 'txt';
    } else {
      // Determine columns to use
      let exportColumns = [...columns];
      
      // Add BIN data columns if requested
      if (includeBinData && !exportColumns.includes('brand')) {
        exportColumns.push('brand', 'type', 'country', 'bank');
      }
      
      // Format based on selected format
      switch (format) {
        case 'csv':
          content = formatCSV(results, exportColumns);
          break;
        case 'txt':
          content = formatTXT(results);
          break;
        case 'json':
          content = formatJSON(results);
          break;
        default:
          content = formatCSV(results, exportColumns);
          actualFormat = 'csv';
      }
    }
    
    // Generate filename
    const filename = generateFilename(
      cardsOnly ? 'cards' : prefix,
      filter,
      actualFormat
    );
    
    // Trigger download
    downloadFile(content, filename);
    
    return { success: true, filename };
  } catch (err) {
    return { success: false, error: err.message || 'Export failed' };
  }
}
