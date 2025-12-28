import { useState, useCallback, useRef } from 'react';
import { parseFile, MAX_CARDS_LIMIT, processInChunks, DEFAULT_CHUNK_SIZE } from '@/lib/utils/file-utils';
import { processCardInput } from '@/lib/utils/card-parser';

/**
 * Error messages for import operations
 */
const ImportErrors = {
  FILE_TOO_LARGE: 'File exceeds maximum size (5MB)',
  INVALID_FORMAT: 'File format not supported. Use CSV or TXT.',
  PARSE_ERROR: 'Failed to parse file. Check format.',
  NO_VALID_CARDS: 'No valid cards found in file.',
  MEMORY_LIMIT: 'File too large to process. Try a smaller file.',
  READ_ERROR: 'Failed to read file. Please try again.',
  EXCEEDS_TIER_LIMIT: 'Imported cards exceed your tier limit.',
};

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Threshold for showing progress indicator (1000 cards)
 */
const PROGRESS_THRESHOLD = 1000;

/**
 * Number of sample cards to show in preview
 */
const SAMPLE_SIZE = 5;

/**
 * useFileImport Hook
 * 
 * Handles file import for CSV and TXT card files.
 * Integrates with existing card parsing utilities and applies
 * deduplication and expiry filtering.
 * 
 * @returns {object} Hook return value
 * @property {function} importFile - Import a file and parse cards
 * @property {boolean} isImporting - Whether import is in progress
 * @property {number} progress - Import progress (0-100)
 * @property {string|null} error - Error message if import failed
 * @property {function} reset - Reset hook state
 */
export function useFileImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Ref to track if import was cancelled
  const cancelledRef = useRef(false);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setIsImporting(false);
    setProgress(0);
    setError(null);
    cancelledRef.current = false;
  }, []);

  /**
   * Read file content using FileReader API
   * @param {File} file - File to read
   * @returns {Promise<string>} File content as string
   */
  const readFileContent = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error(ImportErrors.READ_ERROR));
      };
      
      reader.readAsText(file);
    });
  }, []);

  /**
   * Validate file before processing
   * @param {File} file - File to validate
   * @returns {object} Validation result { valid, error }
   */
  const validateFile = useCallback((file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: ImportErrors.FILE_TOO_LARGE };
    }

    // Check file extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'txt'].includes(ext)) {
      return { valid: false, error: ImportErrors.INVALID_FORMAT };
    }

    return { valid: true, error: null };
  }, []);

  /**
   * Import a file and parse cards
   * 
   * @param {File} file - File to import
   * @param {object} options - Import options
   * @param {boolean} options.removeDuplicates - Remove duplicate cards (default: true)
   * @param {boolean} options.removeExpired - Remove expired cards (default: true)
   * @returns {Promise<object>} Import result
   */
  const importFile = useCallback(async (file, options = {}) => {
    const {
      removeDuplicates = true,
      removeExpired = true,
    } = options;

    // Reset state
    reset();
    cancelledRef.current = false;
    setIsImporting(true);
    setProgress(0);

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        setIsImporting(false);
        return { success: false, error: validation.error };
      }

      // Read file content
      setProgress(10);
      const content = await readFileContent(file);
      
      if (cancelledRef.current) {
        return { success: false, error: 'Import cancelled' };
      }

      // Parse file content
      setProgress(30);
      const parseResult = parseFile(content, file.name, { maxCards: MAX_CARDS_LIMIT });

      if (parseResult.errors && parseResult.errors.length > 0) {
        const errorMsg = parseResult.errors[0] || ImportErrors.PARSE_ERROR;
        setError(errorMsg);
        setIsImporting(false);
        return { success: false, error: errorMsg };
      }

      if (!parseResult.cards || parseResult.cards.length === 0) {
        setError(ImportErrors.NO_VALID_CARDS);
        setIsImporting(false);
        return { success: false, error: ImportErrors.NO_VALID_CARDS };
      }

      if (cancelledRef.current) {
        return { success: false, error: 'Import cancelled' };
      }

      // Convert parsed cards to raw format for processCardInput
      setProgress(50);
      const rawLines = parseResult.cards.map(card => card.raw);
      const rawInput = rawLines.join('\n');

      // Apply deduplication, expiry filtering, and Luhn validation using existing logic
      // Requirements 6.1, 6.2: Apply same format validation and Luhn validation as manual input
      // For large files, process in chunks to prevent UI blocking
      let processedResult;
      
      if (parseResult.cards.length > PROGRESS_THRESHOLD) {
        // Process in chunks for large files
        const chunks = [];
        const chunkSize = DEFAULT_CHUNK_SIZE;
        
        for (let i = 0; i < rawLines.length; i += chunkSize) {
          chunks.push(rawLines.slice(i, i + chunkSize));
        }

        let allCleanedLines = [];
        let totalDuplicates = 0;
        let totalExpired = 0;
        let totalInvalid = 0;
        let totalLuhnFailed = 0;
        const seenCards = new Set();

        for (let i = 0; i < chunks.length; i++) {
          if (cancelledRef.current) {
            return { success: false, error: 'Import cancelled' };
          }

          const chunkInput = chunks[i].join('\n');
          const chunkResult = processCardInput(chunkInput, {
            removeDuplicates,
            removeExpired,
            removeInvalidFormat: true,
            removeLuhnInvalid: true, // Requirement 6.2: Apply Luhn validation
          });

          // Filter out cards we've already seen across chunks
          if (removeDuplicates) {
            const uniqueLines = [];
            for (const line of chunkResult.cleanedLines) {
              // Create a simple key from the line for deduplication
              const key = line.trim().toLowerCase();
              if (!seenCards.has(key)) {
                seenCards.add(key);
                uniqueLines.push(line);
              } else {
                totalDuplicates++;
              }
            }
            allCleanedLines.push(...uniqueLines);
          } else {
            allCleanedLines.push(...chunkResult.cleanedLines);
          }

          totalDuplicates += chunkResult.duplicatesRemoved;
          totalExpired += chunkResult.expiredRemoved;
          totalInvalid += chunkResult.invalidFormatRemoved || chunkResult.invalidLines.length;
          totalLuhnFailed += chunkResult.luhnFailedRemoved || 0;

          // Update progress (50-90% for processing)
          const chunkProgress = 50 + Math.round(((i + 1) / chunks.length) * 40);
          setProgress(chunkProgress);

          // Yield control to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        processedResult = {
          cleanedLines: allCleanedLines,
          cleanedInput: allCleanedLines.join('\n'),
          duplicatesRemoved: totalDuplicates,
          expiredRemoved: totalExpired,
          invalidFormatRemoved: totalInvalid,
          luhnFailedRemoved: totalLuhnFailed,
          invalidLines: [],
          validCount: allCleanedLines.length,
          originalCount: parseResult.cards.length,
          hasChanges: totalDuplicates > 0 || totalExpired > 0 || totalInvalid > 0 || totalLuhnFailed > 0,
        };
      } else {
        // Process all at once for smaller files
        // Requirement 6.1, 6.2: Apply same validation rules as manual input
        processedResult = processCardInput(rawInput, {
          removeDuplicates,
          removeExpired,
          removeInvalidFormat: true,
          removeLuhnInvalid: true, // Requirement 6.2: Apply Luhn validation
        });
      }

      setProgress(95);

      // Build final result
      const cards = processedResult.cleanedLines;
      const sampleCards = cards.slice(0, SAMPLE_SIZE);

      const stats = {
        totalParsed: parseResult.stats.totalParsed,
        duplicatesRemoved: processedResult.duplicatesRemoved,
        expiredRemoved: processedResult.expiredRemoved,
        invalidRows: parseResult.stats.invalidRows,
        invalidFormatRemoved: processedResult.invalidFormatRemoved || 0,
        luhnFailedRemoved: processedResult.luhnFailedRemoved || 0, // Requirement 6.2: Track Luhn failures
        truncated: parseResult.stats.truncated,
        truncatedCount: parseResult.stats.truncatedCount || 0,
        finalCount: cards.length,
      };

      setProgress(100);
      setIsImporting(false);

      return {
        success: true,
        cards,
        stats,
        sampleCards,
        rawInput: processedResult.cleanedInput,
      };

    } catch (err) {
      const errorMsg = err.message || ImportErrors.PARSE_ERROR;
      setError(errorMsg);
      setIsImporting(false);
      return { success: false, error: errorMsg };
    }
  }, [reset, validateFile, readFileContent]);

  /**
   * Cancel ongoing import
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsImporting(false);
    setProgress(0);
  }, []);

  return {
    importFile,
    isImporting,
    progress,
    error,
    reset,
    cancel,
  };
}

export default useFileImport;
