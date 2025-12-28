import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfileBadge, tierConfig } from './user-profile-badge';
import { AuthProvider } from '@/contexts/AuthContext';

// Helper to filter out motion props
const filterMotionProps = (props) => {
  const motionProps = ['whileHover', 'whileTap', 'initial', 'animate', 'exit', 'transition', 'variants'];
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !motionProps.includes(key))
  );
};

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...filterMotionProps(props)}>{children}</div>,
    button: ({ children, ...props }) => <button {...filterMotionProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock fetch for AuthContext
global.fetch = vi.fn(() => Promise.resolve({
  ok: false,
  json: () => Promise.resolve({ error: 'Not authenticated' })
}));

// Wrapper component with AuthProvider
const TestWrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('UserProfileBadge', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    credits: 1500,
    tier: 'gold',
  };

  describe('Render', () => {
    it('should render the profile button', () => {
      render(<UserProfileBadge user={mockUser} />, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with undefined user', () => {
      render(<UserProfileBadge user={undefined} />, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

describe('tierConfig', () => {
  it('should have all required tier configurations', () => {
    const requiredTiers = ['free', 'bronze', 'silver', 'gold', 'diamond'];
    
    requiredTiers.forEach(tier => {
      expect(tierConfig[tier]).toBeDefined();
      expect(tierConfig[tier].label).toBeDefined();
      expect(tierConfig[tier].icon).toBeDefined();
      expect(tierConfig[tier].color).toBeDefined();
    });
  });

  it('should have correct labels for each tier', () => {
    expect(tierConfig.free.label).toBe('Free');
    expect(tierConfig.bronze.label).toBe('Bronze');
    expect(tierConfig.silver.label).toBe('Silver');
    expect(tierConfig.gold.label).toBe('Gold');
    expect(tierConfig.diamond.label).toBe('Diamond');
  });
});
