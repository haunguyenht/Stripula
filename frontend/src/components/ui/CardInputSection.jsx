import React from 'react';
import { Trash2, AlertTriangle, ShieldX } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ImportButton } from '@/components/ui/ImportButton';
import { cn } from '@/lib/utils';

/**
 * Shared card input section used across validation panels.
 * Includes textarea, card count badge, import/clear/start buttons, and warning messages.
 */
export function CardInputSection({
  cards,
  onCardsChange,
  onCardsBlur,
  onImport,
  onClear,
  onStart,
  onStop,
  isLoading = false,
  cardCount = 0,
  limitStatus = {},
  cardValidation = {},
  userTier = 'free',
  isGatewayAvailable = true,
  isStartDisabled: isStartDisabledProp,
  startButtonTitle: startButtonTitleProp,
  startButtonLabel = 'Start Check',
  placeholder = "Enter cards (one per line)\n4111111111111111|01|25|123",
  progressBar = null,
  className,
}) {
  const defaultIsStartDisabled = 
    limitStatus.isError || 
    cardCount === 0 || 
    cardValidation.isGenerated || 
    !isGatewayAvailable;

  const isStartDisabled = isStartDisabledProp ?? defaultIsStartDisabled;

  const getDefaultStartButtonTitle = () => {
    if (!isGatewayAvailable) return 'Gateway is unavailable';
    if (cardValidation.isGenerated) return 'Generated cards not allowed';
    if (limitStatus.isError) return `Exceeds ${userTier} tier limit of ${limitStatus.limit} cards`;
    return undefined;
  };
  
  const startButtonTitle = startButtonTitleProp ?? getDefaultStartButtonTitle();

  return (
    <div className={cn("space-y-2 sm:space-y-3", className)}>
      {/* Card Input Container */}
      <div className={cn(
        "rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200",
        "bg-white border border-[rgb(230,225,223)] shadow-sm",
        "focus-within:border-[rgb(255,64,23)]/40 focus-within:ring-2 focus-within:ring-[rgb(255,64,23)]/10",
        "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
        "dark:focus-within:border-white/20 dark:focus-within:ring-primary/20"
      )}>
        <Textarea
          className={cn(
            "font-mono text-[10px] sm:text-xs min-h-[60px] sm:min-h-[80px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "bg-transparent dark:bg-transparent p-2 sm:p-3",
            isLoading && "opacity-50"
          )}
          placeholder={placeholder}
          value={cards}
          onChange={(e) => onCardsChange(e.target.value)}
          onBlur={onCardsBlur}
          disabled={isLoading}
        />

        {/* Footer with count and actions */}
        <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-t border-[rgb(237,234,233)] dark:border-white/10 bg-[rgb(250,249,249)] dark:bg-white/5">
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge
              variant={limitStatus.isError ? "destructive" : limitStatus.isWarning ? "warning" : "secondary"}
              className={cn(
                "text-[9px] sm:text-[10px] h-5 sm:h-6 px-1.5 sm:px-2",
                limitStatus.isError && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                limitStatus.isWarning && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              )}
            >
              {cardCount}/{limitStatus.limit}
              {limitStatus.isWarning && <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" />}
            </Badge>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <ImportButton
              onImport={onImport}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              showLabel={false}
              className="h-6 w-6 sm:h-8 sm:w-8"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-8 sm:w-8"
              onClick={onClear}
              disabled={isLoading}
              title="Clear cards"
            >
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
            {isLoading ? (
              <Button variant="destructive" size="sm" className="h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs" onClick={onStop}>
                Stop
              </Button>
            ) : isStartDisabled && startButtonTitle ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      size="sm"
                      className="h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs pointer-events-none"
                      disabled
                    >
                      <span className="hidden xs:inline">{startButtonLabel}</span>
                      <span className="xs:hidden">Start</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{startButtonTitle}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                size="sm"
                className="h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                onClick={onStart}
                disabled={isStartDisabled}
              >
                <span className="hidden xs:inline">{startButtonLabel}</span>
                <span className="xs:hidden">Start</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Generated cards warning */}
      {cardValidation.isGenerated && (
        <Alert variant="destructive" className="text-xs py-2.5">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Generated cards detected ({cardValidation.generatedDetection?.confidence}% confidence). 
            BIN-generated cards are not allowed.
          </AlertDescription>
        </Alert>
      )}

      {/* Tier limit exceeded warning */}
      {limitStatus.isError && !cardValidation.isGenerated && (
        <Alert variant="destructive" className="text-xs py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {cardCount} cards but your {userTier} tier limit is {limitStatus.limit}.
            Please remove {limitStatus.excess} card{limitStatus.excess > 1 ? 's' : ''} to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress bar slot */}
      <AnimatePresence mode="wait">
        {progressBar}
      </AnimatePresence>
    </div>
  );
}
