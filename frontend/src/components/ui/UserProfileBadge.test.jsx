import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfileBadge, tierConfig } from './user-profile-badge';

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

describe('UserProfileBadge', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    credits: 1500,
    tier: 'gold',
  };

  describe('Credits Display', () => {
    it('should display credits count with formatting', () => {
      render(<UserProfileBadge user={mockUser} />);
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('should display zero credits when credits is 0', () => {
      const zeroCreditsUser = { ...mockUser, credits: 0 };
      render(<UserProfileBadge user={zeroCreditsUser} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large credit numbers with formatting', () => {
      const largeCreditsUser = { ...mockUser, credits: 1000000 };
      render(<UserProfileBadge user={largeCreditsUser} />);
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should handle undefined credits gracefully', () => {
      const noCreditsUser = { ...mockUser, credits: undefined };
      render(<UserProfileBadge user={noCreditsUser} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Render', () => {
    it('should render the profile button', () => {
      render(<UserProfileBadge user={mockUser} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with undefined user', () => {
      render(<UserProfileBadge user={undefined} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

describe('tierConfig', () => {
  it('should have all required tier configurations', () => {
    const requiredTiers = ['bronze', 'silver', 'gold', 'diamond'];
    
    requiredTiers.forEach(tier => {
      expect(tierConfig[tier]).toBeDefined();
      expect(tierConfig[tier].label).toBeDefined();
      expect(tierConfig[tier].icon).toBeDefined();
      expect(tierConfig[tier].className).toBeDefined();
    });
  });

  it('should have correct labels for each tier', () => {
    expect(tierConfig.bronze.label).toBe('Bronze');
    expect(tierConfig.silver.label).toBe('Silver');
    expect(tierConfig.gold.label).toBe('Gold');
    expect(tierConfig.diamond.label).toBe('Diamond');
  });
});
