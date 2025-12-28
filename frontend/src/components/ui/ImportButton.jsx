import React, { useRef, useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileImport } from '@/hooks/useFileImport';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * ImportButton Component
 * 
 * Provides file import functionality for CSV and TXT card files.
 * Shows progress for large files and displays errors via toast.
 * 
 * Requirements: 1.1, 5.2, 1.6
 * 
 * @param {Object} props
 * @param {function} props.onImport - Callback when import completes: (cards, stats, rawInput) => void
 * @param {function} props.onPreview - Optional callback to show preview dialog: (result) => void
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {number} props.maxCards - Maximum cards to import (default: 10000)
 * @param {string} props.variant - Button variant (default: 'outline')
 * @param {string} props.size - Button size (default: 'sm')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabel - Whether to show text label (default: true)
 */
export function ImportButton({
  onImport,
  onPreview,
  disabled = false,
  maxCards = 10000,
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
}) {
  const fileInputRef = useRef(null);
  const { importFile, isImporting, progress, error, reset } = useFileImport();
  const { success, error: toastError, warning, info } = useToast();
  const [showProgress, setShowProgress] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input for re-selection of same file
    event.target.value = '';

    // Show progress for large files
    const estimatedCards = Math.ceil(file.size / 30); // ~30 bytes per card line
    if (estimatedCards > 1000) {
      setShowProgress(true);
      info(`Importing ${file.name}...`);
    }

    try {
      const result = await importFile(file, {
        removeDuplicates: true,
        removeExpired: true,
      });

      setShowProgress(false);

      if (!result.success) {
        // Requirement 1.6: Display error message with specific parsing issue
        toastError(result.error || 'Failed to import file');
        return;
      }

      // Show import summary
      const { stats, cards, sampleCards, rawInput } = result;
      
      // Build summary message
      const summaryParts = [`Imported ${cards.length} cards`];
      if (stats.duplicatesRemoved > 0) {
        summaryParts.push(`${stats.duplicatesRemoved} duplicates removed`);
      }
      if (stats.expiredRemoved > 0) {
        summaryParts.push(`${stats.expiredRemoved} expired removed`);
      }
      if (stats.invalidRows > 0) {
        summaryParts.push(`${stats.invalidRows} invalid rows skipped`);
      }
      if (stats.truncated) {
        warning(`File truncated to ${maxCards} cards (${stats.truncatedCount} cards skipped)`);
      }

      success(summaryParts.join(', '));

      // If preview callback provided, show preview dialog
      if (onPreview) {
        onPreview({
          cards,
          stats,
          sampleCards,
          rawInput,
        });
      } else if (onImport) {
        // Otherwise, directly call onImport
        onImport(cards, stats, rawInput);
      }

    } catch (err) {
      setShowProgress(false);
      toastError(err.message || 'Import failed');
    }
  }, [importFile, onImport, onPreview, maxCards, success, toastError, warning, info]);

  /**
   * Trigger file picker
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isDisabled = disabled || isImporting;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Import cards from file"
      />

      {/* Import button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "gap-1.5",
          className
        )}
        title="Import cards from CSV or TXT file"
      >
        {isImporting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {showLabel && showProgress && (
              <span className="text-xs">{progress}%</span>
            )}
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            {showLabel && <span>Import</span>}
          </>
        )}
      </Button>
    </>
  );
}

export default ImportButton;
