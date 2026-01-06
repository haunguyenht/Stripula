import { useState, useCallback, useMemo } from 'react';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFileExport, filterResultsByStatus } from '@/hooks/useFileExport';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * ExportButton Component
 * 
 * Provides export functionality with format selection, column customization,
 * BIN data inclusion, and cards-only export options.
 * 
 * Requirements: 3.1, 8.1, 8.3, 8.4
 * 
 * @param {Object} props
 * @param {Object[]} props.results - Array of validation results to export
 * @param {string} props.filter - Current filter ('all', 'approved', 'declined', 'error')
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.variant - Button variant (default: 'outline')
 * @param {string} props.size - Button size (default: 'sm')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabel - Whether to show text label (default: true)
 * @param {string} props.prefix - Filename prefix (default: 'results')
 */
export function ExportButton({
  results = [],
  filter = 'all',
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
  prefix = 'results',
}) {
  const {
    exportResults,
    isExporting,
    selectedColumns,
  } = useFileExport();
  const { success, error: toastError, warning } = useToast();

  // Local state for export options
  const [includeBinData, setIncludeBinData] = useState(false);
  const [cardsOnly, setCardsOnly] = useState(false);

  // Get filtered results count
  const filteredCount = useMemo(() => {
    return filterResultsByStatus(results, filter).length;
  }, [results, filter]);

  // Check if there are results to export
  const hasResults = filteredCount > 0;

  /**
   * Handle export with specified format
   */
  const handleExport = useCallback((format) => {
    if (!hasResults) {
      warning('No results to export');
      return;
    }

    const result = exportResults(results, {
      format,
      filter,
      columns: selectedColumns,
      includeBinData,
      cardsOnly,
      prefix,
    });

    if (result.success) {
      success(`Exported ${result.exportedCount} results to ${result.filename}`);
    } else {
      toastError(result.error || 'Export failed');
    }
  }, [results, filter, selectedColumns, includeBinData, cardsOnly, prefix, hasResults, exportResults, success, toastError, warning]);

  const isDisabled = disabled || isExporting || !hasResults;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className={cn("gap-1 sm:gap-1.5", className)}
          title={hasResults ? `Export ${filteredCount} results` : 'No results to export'}
        >
          <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {showLabel && <span className="hidden sm:inline">Export</span>}
          {hasResults && (
            <span className="text-[9px] sm:text-[10px] opacity-70">({filteredCount})</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Format Selection - Requirement 3.1 */}
        <DropdownMenuLabel className="text-xs">Export Format</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span>CSV</span>
          <span className="ml-auto text-[10px] text-muted-foreground">.csv</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('txt')} className="gap-2">
          <FileText className="h-4 w-4" />
          <span>Plain Text</span>
          <span className="ml-auto text-[10px] text-muted-foreground">.txt</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2">
          <FileJson className="h-4 w-4" />
          <span>JSON</span>
          <span className="ml-auto text-[10px] text-muted-foreground">.json</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Export Options - Requirements 8.3, 8.4 */}
        <DropdownMenuLabel className="text-xs">Options</DropdownMenuLabel>
        
        {/* BIN Data Toggle - Requirement 8.3 */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <Label htmlFor="include-bin" className="text-xs cursor-pointer">
            Include BIN data
          </Label>
          <Switch
            id="include-bin"
            checked={includeBinData}
            onCheckedChange={setIncludeBinData}
            className="scale-75"
          />
        </div>

        {/* Cards Only Toggle - Requirement 8.4 */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <Label htmlFor="cards-only" className="text-xs cursor-pointer">
            Cards only (no metadata)
          </Label>
          <Switch
            id="cards-only"
            checked={cardsOnly}
            onCheckedChange={setCardsOnly}
            className="scale-75"
          />
        </div>

        {/* Filter indicator */}
        {filter !== 'all' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
              Exporting {filter} results only
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
