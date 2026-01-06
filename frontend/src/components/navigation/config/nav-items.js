import { 
  CreditCard, 
  TreeDeciduous, 
  Zap,
  Shield,
  Wallet,
  ShoppingBag,
  Target,
  Layers,
  Key,
  MapPin,
  SquareStack,
  LayoutDashboard,
} from 'lucide-react';

/**
 * Default user data - null when no user is authenticated
 * Real user data should be passed from AuthContext
 */
export const defaultUser = null;

/**
 * Navigation menu items configuration
 * Each item can have children for dropdown menus
 */
export const navItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
  },
  { 
    id: 'stripe', 
    label: 'Stripe', 
    icon: CreditCard,
    children: [
      { id: 'stripe-auth', label: 'Auth', icon: Shield, desc: 'Authorization check' },
      { id: 'stripe-charge', label: 'Charge', icon: Zap, desc: 'Payment check' },
      { id: 'stripe-skbased', label: 'SKBased', icon: Key, desc: 'SKBased check' },
    ]
  },
  { 
    id: 'braintree', 
    label: 'Braintree', 
    icon: TreeDeciduous,
    children: [
      { id: 'braintree-auth', label: 'Auth', icon: Shield, desc: 'Authentication' },
      { id: 'braintree-charge', label: 'Charge', icon: Zap, desc: 'Payment check' },
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
    children: [
      { id: 'adyen-auth', label: 'Auth', icon: Shield, desc: 'Authentication' },
      { id: 'adyen-charge', label: 'Charge', icon: Zap, desc: 'Payment check' },
    ]
  },
  { 
    id: 'shopify', 
    label: 'Shopify', 
    icon: ShoppingBag,
    children: [
      { id: 'shopify-charge', label: 'Charge', icon: Zap, desc: 'Payment check' },
    ]
  },
  { 
    id: 'target', 
    label: 'Target', 
    icon: Target,
    children: [
      { id: 'target-charge', label: 'Charge', icon: Zap, desc: 'Payment check' },
    ]
  },
  { 
    id: 'other-gate', 
    label: 'Others', 
    icon: Layers,
    children: [
      { id: 'other-sk-key-check', label: 'SK Key Check', icon: Key, desc: 'Check SK keys validity' },
      { id: 'other-charge-avs', label: 'Charge AVS', icon: MapPin, desc: 'Address verification' },
      { id: 'other-square-charge', label: 'Square Charge', icon: SquareStack, desc: 'Square payment check' },
    ]
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





