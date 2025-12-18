import { 
  CreditCard, 
  TreeDeciduous, 
  HelpCircle, 
  Zap,
  Shield,
  Sparkles,
  Wallet,
  ShoppingBag,
  Target,
  Crosshair,
  Hash,
  KeyRound,
  ShoppingCart,
} from 'lucide-react';

/**
 * Default user data for when no user is provided
 */
export const defaultUser = {
  name: 'User',
  email: 'user@example.com',
  credits: 100,
  tier: 'gold',
};

/**
 * Navigation menu items configuration
 * Each item can have children for dropdown menus
 */
export const navItems = [
  { 
    id: 'stripe', 
    label: 'Stripe', 
    icon: CreditCard,
    children: [
      { id: 'stripe-auth', label: 'Auth', icon: Shield, desc: 'Key validation' },
      { id: 'stripe-charge-1', label: 'SK Based Charge', icon: Zap, desc: 'Standard check' },
      { id: 'stripe-charge-2', label: 'Charge v2', icon: Sparkles, desc: 'Advanced check' },
    ]
  },
  { 
    id: 'braintree', 
    label: 'Braintree', 
    icon: TreeDeciduous,
    children: [
      { id: 'braintree-auth', label: 'Auth', icon: Shield, desc: 'Authentication' },
    ]
  },
  { 
    id: 'paypal', 
    label: 'PayPal', 
    icon: Wallet,
    children: [
      { id: 'paypal-charge', label: 'Charge', icon: Zap, desc: 'Payment check' },
    ]
  },
  { 
    id: 'adyen',
    label: 'Adyen', 
    icon: Wallet,
    comingSoon: true,
    children: [
      { id: 'adyen-auth', label: 'Auth', icon: Shield, desc: 'Authentication', comingSoon: true },
      { id: 'adyen-charge', label: 'Charge', icon: Zap, desc: 'Payment check', comingSoon: true },
    ]
  },
  { 
    id: 'shopify', 
    label: 'Shopify', 
    icon: ShoppingBag,
    comingSoon: true,
    children: [
      { id: 'shopify-auth', label: 'Auth', icon: Shield, desc: 'Authentication', comingSoon: true },
      { id: 'shopify-charge', label: 'Charge', icon: Zap, desc: 'Payment check', comingSoon: true },
    ]
  },
  { 
    id: 'target', 
    label: 'Target', 
    icon: Target,
    comingSoon: true,
    children: [
      { id: 'target-charge', label: 'Charge', icon: Zap, desc: 'Payment check', comingSoon: true },
    ]
  },
  { 
    id: 'co-hitter', 
    label: 'CO Hitter', 
    icon: Crosshair,
    comingSoon: true,
    children: [
      { id: 'co-inbuilt-ccn', label: 'Inbuilt CCN', icon: Hash, desc: 'Card number gen', comingSoon: true },
      { id: 'co-inbuilt-ccv', label: 'Inbuilt CCV', icon: KeyRound, desc: 'CVV generator', comingSoon: true },
      { id: 'co-checkout', label: 'Checkout', icon: ShoppingCart, desc: 'Checkout flow', comingSoon: true },
    ]
  },
  { 
    id: 'help', 
    label: 'Help', 
    icon: HelpCircle,
  },
];

/**
 * Helper to check if a nav group is active
 */
export function isGroupActive(item, activeRoute) {
  if (item.children) {
    return item.children.some(child => child.id === activeRoute);
  }
  return activeRoute === item.id;
}

/**
 * Helper to find the active nav item and its parent
 */
export function findActiveNavItem(activeRoute) {
  for (const item of navItems) {
    if (item.children) {
      const activeChild = item.children.find(child => child.id === activeRoute);
      if (activeChild) {
        return { parent: item, child: activeChild };
      }
    } else if (item.id === activeRoute) {
      return { parent: item, child: null };
    }
  }
  return { parent: navItems[0], child: null };
}





