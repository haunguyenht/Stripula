import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  formatCSV,
  formatTXT,
  formatJSON,
  formatCardsOnly,
  generateFilename,
  downloadFile,
  EXPORT_COLUMNS,
  DEFAULT_EXPORT_COLUMNS,
} from '@/lib/utils/file-utils';

/**
 * Error messages for export operations
 */
const ExportErrors = {
  NO_RESULTS: 'No results to export',
  DOWNLOAD_FAILED: 'Failed to download file',
  INVALID_FORMAT: 'Invalid export format',
};

/**
 * Storage key for column preferences
 */
const COLUMN_PREFS_KEY = 'exportColumnPreferences';

/**
 * BIN data columns that can be optionally included
 */
const BIN_DATA_COLUMNS = ['brand', 'type', 'country', 'bank'];

/**
 * Filter results by status
 * @param {object[]} results - Array of validation results
 * @param {string} filter - Filter type ('all', 'approved', 'declined', 'error')
 * @returns {object[]} Filtered results
 */
export function filterResultsByStatus(results, filter) {
  if (!results || !Array.isArray(results)) return [];
  if (!filter || filter === 'all') return results;

  return results.filter(result => {
    const status = result.status?.toLowerCase();
    
    switch (filter) {
      case 'approved':
        return status === 'approved' || status === 'live';
      case 'declined':
        return status === 'declined' || status === 'dead';
      case 'error':
        return status === 'error' || status === 'stripe_error';
      default:
        return true;
    }
  });
}

/**
 * useFileExport Hook
 * 
 * Handles exporting validation results to CSV, TXT, or JSON files.
 * Supports filtering by status, column selection, BIN data inclusion,
 * and cards-only export mode.
 * 
 * @returns {object} Hook return value
 * @property {function} exportResults - Export results with options
 * @property {boolean} isExporting - Whether export is in progress
 * @property {string|null} error - Error message if export failed
 * @property {string[]} selectedColumns - Currently selected columns
 * @property {function} setSelectedColumns - Update selected columns
 * @property {object} availableColumns - Available columns for export
 * @property {function} reset - Reset hook state
 */
export function useFileExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  
  // Persist column preferences in localStorage
  // Requirements: 8.2 - Remember user's column preferences
  const [selectedColumns, setSelectedColumns] = useLocalStorage(
    COLUMN_PREFS_KEY,
    DEFAULT_EXPORT_COLUMNS
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setIsExporting(false);
    setError(null);
  }, []);

  /**
   * Get available columns for export
   */
  const availableColumns = useMemo(() => EXPORT_COLUMNS, []);

  /**
   * Export validation results to a file
   * 
   * @param {object[]} results - Array of validation results
   * @param {object} options - Export options
   * @param {string} options.format - Export format ('csv', 'txt', 'json')
   * @param {string} options.filter - Status filter ('all', 'approved', 'declined', 'error')
   * @param {string[]} options.columns - Columns to include (for CSV)
   * @param {boolean} options.includeBinData - Include BIN data columns
   * @param {boolean} options.cardsOnly - Export only card data (no metadata)
   * @param {string} options.prefix - Filename prefix
   * @returns {object} Export result { success, filename, error, exportedCount }
   */
  const exportResults = useCallback((results, options = {}) => {
    const {
      format = 'csv',
      filter = 'all',
      columns = selectedColumns,
      includeBinData = false,
      cardsOnly = false,
      prefix = 'results',
    } = options;

    // Reset state
    setError(null);
    setIsExporting(true);

    try {
      // Validate results
      if (!results || !Array.isArray(results) || results.length === 0) {
        const errorMsg = ExportErrors.NO_RESULTS;
        setError(errorMsg);
        setIsExporting(false);
        return { success: false, error: errorMsg, exportedCount: 0 };
      }

      // Validate format
      if (!['csv', 'txt', 'json'].includes(format)) {
        const errorMsg = ExportErrors.INVALID_FORMAT;
        setError(errorMsg);
        setIsExporting(false);
        return { success: false, error: errorMsg, exportedCount: 0 };
      }

      // Apply status filter
      // Requirements: 3.6, 4.1, 4.2, 4.3, 4.4 - Filter by status
      const filteredResults = filterResultsByStatus(results, filter);

      if (filteredResults.length === 0) {
        const errorMsg = `No ${filter} results to export`;
        setError(errorMsg);
        setIsExporting(false);
        return { success: false, error: errorMsg, exportedCount: 0 };
      }

      let content;
      let actualFormat = format;

      // Handle cards-only export
      // Requirements: 8.4 - Export cards only without validation metadata
      if (cardsOnly) {
        content = formatCardsOnly(filteredResults);
        actualFormat = 'txt';
      } else {
        // Determine columns to use
        let exportColumns = [...columns];

        // Add BIN data columns if requested
        // Requirements: 8.3 - Optionally include BIN data
        if (includeBinData) {
          for (const binCol of BIN_DATA_COLUMNS) {
            if (!exportColumns.includes(binCol)) {
              exportColumns.push(binCol);
            }
          }
        }

        // Format based on selected format
        // Requirements: 3.2, 3.3, 3.4 - Support CSV, TXT, JSON formats
        switch (format) {
          case 'csv':
            content = formatCSV(filteredResults, exportColumns);
            break;
          case 'txt':
            content = formatTXT(filteredResults);
            break;
          case 'json':
            content = formatJSON(filteredResults);
            break;
          default:
            content = formatCSV(filteredResults, exportColumns);
            actualFormat = 'csv';
        }
      }

      // Generate filename with filter indication
      // Requirements: 4.5 - Indicate filter in filename
      const filename = generateFilename(
        cardsOnly ? 'cards' : prefix,
        filter,
        actualFormat
      );

      // Trigger download
      // Requirements: 3.5 - Download with timestamped filename
      downloadFile(content, filename);

      setIsExporting(false);

      return {
        success: true,
        filename,
        exportedCount: filteredResults.length,
      };

    } catch (err) {
      const errorMsg = err.message || ExportErrors.DOWNLOAD_FAILED;
      setError(errorMsg);
      setIsExporting(false);
      return { success: false, error: errorMsg, exportedCount: 0 };
    }
  }, [selectedColumns]);

  /**
   * Update column preferences
   * Persists to localStorage automatically via useLocalStorage
   * Requirements: 8.1, 8.2 - Column selection with persistence
   */
  const updateSelectedColumns = useCallback((columns) => {
    // Validate columns
    const validColumns = columns.filter(col => EXPORT_COLUMNS[col]);
    setSelectedColumns(validColumns.length > 0 ? validColumns : DEFAULT_EXPORT_COLUMNS);
  }, [setSelectedColumns]);

  /**
   * Toggle a column in the selection
   */
  const toggleColumn = useCallback((columnKey) => {
    setSelectedColumns(prev => {
      const current = Array.isArray(prev) ? prev : DEFAULT_EXPORT_COLUMNS;
      if (current.includes(columnKey)) {
        // Don't allow removing all columns
        if (current.length <= 1) return current;
        return current.filter(c => c !== columnKey);
      }
      return [...current, columnKey];
    });
  }, [setSelectedColumns]);

  /**
   * Reset columns to default
   */
  const resetColumns = useCallback(() => {
    setSelectedColumns(DEFAULT_EXPORT_COLUMNS);
  }, [setSelectedColumns]);

  /**
   * Check if BIN data columns are included
   */
  const hasBinDataColumns = useMemo(() => {
    const cols = Array.isArray(selectedColumns) ? selectedColumns : [];
    return BIN_DATA_COLUMNS.some(col => cols.includes(col));
  }, [selectedColumns]);

  return {
    exportResults,
    isExporting,
    error,
    selectedColumns: Array.isArray(selectedColumns) ? selectedColumns : DEFAULT_EXPORT_COLUMNS,
    setSelectedColumns: updateSelectedColumns,
    toggleColumn,
    resetColumns,
    availableColumns,
    hasBinDataColumns,
    reset,
    // Export utility functions for direct use
    filterResultsByStatus,
  };
}

export default useFileExport;
