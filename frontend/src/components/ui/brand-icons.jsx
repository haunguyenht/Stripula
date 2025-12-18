/**
 * Credit Card Brand Icons
 * 
 * Wrapper components for credit card brand icons with consistent sizing
 */

import { 
  VisaFlatRoundedIcon, 
  MastercardFlatRoundedIcon, 
  AmericanExpressFlatRoundedIcon, 
  DiscoverFlatRoundedIcon, 
  JCBFlatRoundedIcon, 
  UnionPayFlatRoundedIcon, 
  DinersClubFlatRoundedIcon, 
  GenericFlatRoundedIcon 
} from 'react-svg-credit-card-payment-icons';

// Default icon dimensions
const DEFAULT_ICON_PROPS = { width: 28, height: 18 };

/**
 * Map of brand names to icon components
 */
const BRAND_ICONS = {
  visa: VisaFlatRoundedIcon,
  mastercard: MastercardFlatRoundedIcon,
  amex: AmericanExpressFlatRoundedIcon,
  'american express': AmericanExpressFlatRoundedIcon,
  discover: DiscoverFlatRoundedIcon,
  jcb: JCBFlatRoundedIcon,
  unionpay: UnionPayFlatRoundedIcon,
  'union pay': UnionPayFlatRoundedIcon,
  diners: DinersClubFlatRoundedIcon,
  'diners club': DinersClubFlatRoundedIcon,
};

/**
 * Get the appropriate brand icon component for a card scheme
 * @param {string} scheme - Card scheme/brand name
 * @param {object} props - Additional props to pass to icon
 * @returns {JSX.Element} Icon component
 */
export function BrandIcon({ scheme, ...props }) {
  const normalizedScheme = scheme?.toLowerCase() || '';
  const IconComponent = BRAND_ICONS[normalizedScheme] || GenericFlatRoundedIcon;
  
  return <IconComponent {...DEFAULT_ICON_PROPS} {...props} />;
}

// Re-export individual icons for direct use if needed
export {
  VisaFlatRoundedIcon,
  MastercardFlatRoundedIcon,
  AmericanExpressFlatRoundedIcon,
  DiscoverFlatRoundedIcon,
  JCBFlatRoundedIcon,
  UnionPayFlatRoundedIcon,
  DinersClubFlatRoundedIcon,
  GenericFlatRoundedIcon,
};
