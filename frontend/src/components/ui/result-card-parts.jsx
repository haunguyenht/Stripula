import { memo, forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  Copy, 
  Check, 
  Clock, 
  Building2, 
  ShieldCheck, 
  ShieldX, 
  ShieldAlert,
  Globe
} from "lucide-react";
import { Button } from "./button";

/**
 * Shared components for ResultCard premium redesign
 * These components provide consistent styling across all validation panels
 */

// Card brand icons mapping
const BRAND_ICONS = {
  visa: (
    <svg viewBox="0 0 24 24" className="w-5 h-3.5" fill="currentColor">
      <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102h2.037zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.013 1.08.963 1.683 1.7 2.042.756.368 1.01.604 1.006.933-.005.504-.602.727-1.16.735-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.375-2.569zm5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488l.233 1.12zm-2.166-2.656l1.02-2.815.588 2.815h-1.608zm-8.17-4.84l-1.603 7.496H8.34l1.605-7.496h1.925z"/>
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 24 24" className="w-5 h-3.5" fill="currentColor">
      <circle cx="7" cy="12" r="7" fill="#EB001B" opacity="0.9"/>
      <circle cx="17" cy="12" r="7" fill="#F79E1B" opacity="0.9"/>
      <path d="M12 5.83a7 7 0 000 12.34 7 7 0 000-12.34z" fill="#FF5F00"/>
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 24 24" className="w-5 h-3.5" fill="currentColor">
      <rect width="24" height="24" rx="2" fill="#006FCF"/>
      <path d="M12 6l-1.5 3.5H7l3.5 2.5-1.5 4 3.5-2.5 3.5 2.5-1.5-4 3.5-2.5h-3.5L12 6z" fill="white"/>
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 24 24" className="w-5 h-3.5" fill="currentColor">
      <rect width="24" height="24" rx="2" fill="#FF6000"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  ),
};

/**
 * BrandIcon Component
 * Displays card brand icon (Visa, Mastercard, etc.)
 */
const BrandIcon = memo(function BrandIcon({ scheme, className }) {
  const schemeLower = scheme?.toLowerCase() || '';
  
  const icon = BRAND_ICONS[schemeLower] || (
    <div className={cn(
      "w-5 h-3.5 rounded bg-neutral-200 dark:bg-white/10",
      "flex items-center justify-center",
      "text-[8px] font-bold text-neutral-500 dark:text-white/50"
    )}>
      {schemeLower.substring(0, 2).toUpperCase()}
    </div>
  );

  return (
    <span className={cn(
      "inline-flex items-center justify-center",
      "text-neutral-700 dark:text-white/80",
      className
    )}>
      {icon}
    </span>
  );
});

/**
 * Convert country code to flag emoji
 * @param {string} countryCode - Two-letter country code (e.g., 'US', 'GB')
 * @returns {string} Flag emoji or empty string
 */
function countryCodeToEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  const code = countryCode.toUpperCase();
  const offset = 0x1F1E6 - 65; // 'A' = 65, regional indicator A = 0x1F1E6
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
}

/**
 * BINDataDisplay Component
 * Unified display for BIN information (brand, type, category, country, bank, funding)
 */
const BINDataDisplay = memo(forwardRef(function BINDataDisplay({ 
  binData, 
  brand,
  type,
  category,
  country,
  countryFlag,
  countryEmoji,
  bank,
  funding,
  className,
  ...props 
}, ref) {
  // Support both nested binData and flat fields
  const effectiveBrand = binData?.scheme || brand;
  const effectiveType = binData?.type || type;
  const effectiveCategory = binData?.category || category;
  const effectiveFunding = binData?.funding || funding;
  
  // Get country code from various sources
  const effectiveCountryCode = binData?.countryCode || country;
  
  // Get emoji from various sources, or generate from country code as fallback
  let effectiveCountry = binData?.countryEmoji || countryEmoji || countryFlag;
  if (!effectiveCountry && effectiveCountryCode) {
    effectiveCountry = countryCodeToEmoji(effectiveCountryCode);
  }
  
  const effectiveCountryName = binData?.country || country;
  const effectiveBank = binData?.bank || bank;

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  // Get funding type styling
  const getFundingStyle = (fundingType) => {
    const f = fundingType?.toLowerCase();
    if (f === 'prepaid') {
      return "bg-violet-100/80 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400";
    }
    if (f === 'debit') {
      return "bg-blue-100/80 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
    }
    if (f === 'credit') {
      return "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
    }
    return "bg-neutral-100/80 text-neutral-600 dark:bg-white/5 dark:text-white/60";
  };

  const hasData = effectiveBrand || effectiveType || effectiveCategory || effectiveFunding || effectiveCountry || effectiveBank;
  
  if (!hasData) return null;

  return (
    <div 
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
      {...props}
    >
      {/* Brand icon */}
      {effectiveBrand && (
        <span title={toTitleCase(effectiveBrand)}>
          <BrandIcon scheme={effectiveBrand} />
        </span>
      )}
      
      {/* Card type pill */}
      {effectiveType && (
        <span className={cn(
          "inline-flex items-center",
          "px-2 py-0.5 rounded-md",
          "text-[10px] font-medium",
          "bg-neutral-100/80 text-neutral-600",
          "dark:bg-white/5 dark:text-white/60"
        )}>
          {toTitleCase(effectiveType)}
        </span>
      )}
      
      {/* Funding type pill (prepaid/debit/credit) */}
      {effectiveFunding && (
        <span className={cn(
          "inline-flex items-center",
          "px-2 py-0.5 rounded-md",
          "text-[10px] font-medium",
          getFundingStyle(effectiveFunding)
        )}>
          {toTitleCase(effectiveFunding)}
        </span>
      )}
      
      {/* Category pill */}
      {effectiveCategory && (
        <span className={cn(
          "inline-flex items-center",
          "px-2 py-0.5 rounded-md",
          "text-[10px] font-medium",
          "bg-neutral-100/80 text-neutral-600",
          "dark:bg-white/5 dark:text-white/60"
        )}>
          {toTitleCase(effectiveCategory)}
        </span>
      )}
      
      {/* Country flag */}
      {effectiveCountry && (
        <span 
          className="text-sm leading-none"
          title={effectiveCountryName || effectiveCountryCode}
        >
          {effectiveCountry}
        </span>
      )}
      
      {/* Bank name */}
      {effectiveBank && effectiveBank.toLowerCase() !== 'unknown' && (
        <span className={cn(
          "inline-flex items-center gap-1",
          "text-[10px] font-medium",
          "text-neutral-400 dark:text-white/40",
          "truncate max-w-[140px]"
        )}>
          <Building2 className="h-3 w-3 shrink-0" />
          {toTitleCase(effectiveBank)}
        </span>
      )}
    </div>
  );
}));

/**
 * SecurityIndicators Component
 * Displays security check badges (Risk, CVC, AVS)
 */
const SecurityIndicators = memo(forwardRef(function SecurityIndicators({
  riskLevel,
  riskScore,
  cvcCheck,
  avsCheck,
  className,
  ...props
}, ref) {
  const hasData = (riskLevel && riskLevel !== 'unknown') || 
                  (cvcCheck && cvcCheck !== 'unknown') || 
                  (avsCheck && avsCheck !== 'unknown');
  
  if (!hasData) return null;

  const isRiskElevated = riskLevel && !['normal', 'low', 'unknown'].includes(riskLevel.toLowerCase());
  const isCvcPass = cvcCheck && ['pass', 'match'].includes(cvcCheck.toLowerCase());
  const isAvsPass = avsCheck && ['pass', 'match'].includes(avsCheck.toLowerCase());

  return (
    <div 
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-3",
        className
      )}
      {...props}
    >
      {/* Risk level */}
      {riskLevel && riskLevel !== 'unknown' && (
        <span className={cn(
          "inline-flex items-center gap-1.5",
          "text-[10px] font-medium",
          isRiskElevated 
            ? "text-amber-600 dark:text-amber-400" 
            : "text-neutral-500 dark:text-white/50"
        )}>
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Risk: {riskLevel}</span>
          {riskScore != null && (
            <span className="opacity-60">({riskScore})</span>
          )}
        </span>
      )}
      
      {/* CVC check */}
      {cvcCheck && cvcCheck !== 'unknown' && (
        <span className={cn(
          "inline-flex items-center gap-1.5",
          "text-[10px] font-medium",
          isCvcPass 
            ? "text-emerald-600 dark:text-emerald-400" 
            : "text-rose-500 dark:text-rose-400"
        )}>
          {isCvcPass ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : (
            <ShieldX className="h-3.5 w-3.5" />
          )}
          <span>CVC: {cvcCheck}</span>
        </span>
      )}
      
      {/* AVS check */}
      {avsCheck && avsCheck !== 'unknown' && (
        <span className={cn(
          "inline-flex items-center gap-1.5",
          "text-[10px] font-medium",
          isAvsPass 
            ? "text-emerald-600 dark:text-emerald-400" 
            : "text-rose-500 dark:text-rose-400"
        )}>
          {isAvsPass ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : (
            <ShieldX className="h-3.5 w-3.5" />
          )}
          <span>AVS: {avsCheck}</span>
        </span>
      )}
    </div>
  );
}));

/**
 * DurationDisplay Component
 * Elegant duration indicator
 */
const DurationDisplay = memo(function DurationDisplay({ 
  duration, 
  className,
  showIcon = true 
}) {
  if (!duration && duration !== 0) return null;

  // Support both milliseconds (number > 100) and seconds (number or string)
  let seconds;
  if (typeof duration === 'number') {
    seconds = duration > 100 ? (duration / 1000).toFixed(1) : duration.toFixed(1);
  } else {
    seconds = duration;
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1",
      "text-[10px] font-medium tabular-nums",
      "text-neutral-400 dark:text-white/40",
      className
    )}>
      {showIcon && <Clock className="h-3 w-3" />}
      {seconds}s
    </span>
  );
});

/**
 * ThreeDSIndicator Component
 * Displays 3D Secure status badge
 */
const ThreeDSIndicator = memo(function ThreeDSIndicator({
  threeDs,
  className
}) {
  if (!threeDs || threeDs === 'unknown' || threeDs === 'none') return null;

  const isPassed = ['passed', 'authenticated', 'success', 'yes'].includes(threeDs.toLowerCase());
  const isFailed = ['failed', 'rejected', 'no'].includes(threeDs.toLowerCase());
  const isRequired = ['required', 'pending'].includes(threeDs.toLowerCase());

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5",
      "text-[10px] font-medium",
      isPassed && "text-emerald-600 dark:text-emerald-400",
      isFailed && "text-rose-500 dark:text-rose-400",
      isRequired && "text-amber-600 dark:text-amber-400",
      !isPassed && !isFailed && !isRequired && "text-neutral-500 dark:text-white/50",
      className
    )}>
      {isPassed ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : isFailed ? (
        <ShieldX className="h-3.5 w-3.5" />
      ) : (
        <ShieldAlert className="h-3.5 w-3.5" />
      )}
      <span>3DS: {threeDs}</span>
    </span>
  );
});

/**
 * AmountDisplay Component
 * Displays charge amount with currency
 */
const AmountDisplay = memo(function AmountDisplay({
  amount,
  currency = 'USD',
  className
}) {
  if (!amount && amount !== 0) return null;

  // Currency symbols
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    INR: '₹',
    BRL: 'R$',
    CHF: 'CHF ',
    MYR: 'RM',
    JPY: '¥',
  };

  // Convert cents to dollars if amount > 100 (likely in cents)
  const displayAmount = amount > 100 ? (amount / 100).toFixed(2) : amount.toFixed(2);
  const symbol = currencySymbols[currency?.toUpperCase()] || currency?.toUpperCase() + ' ';

  return (
    <span className={cn(
      "inline-flex items-center gap-1",
      "px-2 py-0.5 rounded-md",
      "text-[10px] font-semibold tabular-nums",
      "bg-emerald-100/80 text-emerald-700",
      "dark:bg-emerald-500/15 dark:text-emerald-400",
      className
    )}>
      {symbol}{displayAmount}
    </span>
  );
});

/**
 * CreditsBadge Component
 * Displays credits deducted for a card validation
 */
const CreditsBadge = memo(function CreditsBadge({
  credits,
  className
}) {
  if (!credits && credits !== 0) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1",
      "px-1.5 py-0.5 rounded-md",
      "text-[9px] font-medium tabular-nums",
      "bg-amber-100/80 text-amber-700",
      "dark:bg-amber-500/15 dark:text-amber-400",
      className
    )}
    title={`${credits} credit${credits !== 1 ? 's' : ''} deducted`}
    >
      -{credits}💰
    </span>
  );
});

/**
 * CopyButton Component
 * Premium copy button with feedback
 */
const CopyButton = memo(function CopyButton({ 
  value, 
  isCopied, 
  onCopy, 
  className,
  size = 'sm',
  title = 'Copy'
}) {
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(value);
    } else if (value) {
      navigator.clipboard.writeText(value);
    }
  }, [value, onCopy]);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        "shrink-0",
        "text-neutral-400 hover:text-neutral-600",
        "dark:text-white/40 dark:hover:text-white/70",
        "hover:bg-neutral-100/80 dark:hover:bg-white/10",
        "transition-all duration-200",
        className
      )}
      onClick={handleClick}
      title={title}
    >
      {isCopied ? (
        <Check className={cn(iconSizes[size], "text-emerald-500")} />
      ) : (
        <Copy className={iconSizes[size]} />
      )}
    </Button>
  );
});

/**
 * CardNumber Component
 * Styled card number display
 */
const CardNumber = memo(function CardNumber({ 
  card, 
  className,
  truncate = true 
}) {
  return (
    <span className={cn(
      "font-mono text-[11px] tracking-tight",
      "text-neutral-600 dark:text-white/70",
      // Only truncate on larger screens, wrap on mobile
      truncate && "sm:truncate break-all sm:break-normal",
      className
    )}>
      {card}
    </span>
  );
});

/**
 * Gateway ID to friendly label mapping
 */
const GATEWAY_LABELS = {
  // Auth gateways
  'auth-1': 'Auth 1',
  'auth-2': 'Auth 2',
  'auth-3': 'Auth 3',
  // Charge gateways
  'charge-1': 'Charge 1',
  'charge-2': 'Charge 2',
  'charge-3': 'Charge 3',
  // SK-Based gateways
  'skbased-auth-1': 'SK Auth 1',
  'skbased-auth': 'SK Auth',
  'skbased-1': 'SK Charge 1',
  'skbased-charge-1': 'SK Charge',
  'sk-based-charge': 'SK Charge',
  'skbased': 'SK Based',
  // Auto Shopify
  'auto-shopify-1': 'Auto Shopify',
  // Braintree gateways
  'braintree-auth-1': 'BT Auth 1',
  'braintree-auth-2': 'BT Auth 2',
  'braintree-auth-3': 'BT Auth 3',
  'braintree-charge-1': 'BT Charge 1',
  'braintree-charge-2': 'BT Charge 2',
  'braintree-charge-3': 'BT Charge 3',
  // PayPal gateways
  'paypal-charge-1': 'PayPal 1',
  'paypal-charge-2': 'PayPal 2',
  'paypal-charge-3': 'PayPal 3',
  // Other gateways
  'charge-avs-1': 'AVS Charge 1',
  'square-charge-1': 'Square 1',
};

/**
 * Get friendly label for gateway ID
 */
const getGatewayLabel = (gatewayId) => {
  if (!gatewayId) return null;
  return GATEWAY_LABELS[gatewayId] || gatewayId;
};

/**
 * GatewayBadge Component
 * Subtle gateway/site indicator with friendly labels
 */
const GatewayBadge = memo(function GatewayBadge({ 
  gateway, 
  site,
  className 
}) {
  const rawLabel = gateway || site;
  if (!rawLabel) return null;
  
  const label = getGatewayLabel(rawLabel);

  return (
    <span className={cn(
      "inline-flex items-center gap-1",
      "text-[10px] font-medium",
      "text-neutral-400 dark:text-white/40",
      className
    )}>
      <Globe className="h-3 w-3" />
      {label}
    </span>
  );
});

/**
 * toTitleCase utility
 * Converts string to title case
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export {
  BrandIcon,
  BINDataDisplay,
  SecurityIndicators,
  DurationDisplay,
  ThreeDSIndicator,
  AmountDisplay,
  CreditsBadge,
  CopyButton,
  CardNumber,
  GatewayBadge,
  getGatewayLabel,
  toTitleCase,
};
