import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileBadge, TierBadge, CreditsBadge, tierConfig } from './UserProfileBadge';

// Mock framer-motion to avoid animation issues in tests
// Filter out framer-motion specific props to prevent React warnings
const filterMotionProps = (props) => {
  const {
    whileHover,
    whileTap,
    whileFocus,
    whileDrag,
    whileInView,
    initial,
    animate,
    exit,
    transition,
    variants,
    layout,
    layoutId,
    drag,
    dragConstraints,
    dragElastic,
    dragMomentum,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationComplete,
    ...filteredProps
  } = props;
  return filteredProps;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...filterMotionProps(props)}>{children}</div>,
    button: ({ children, ...props }) => <button {...filterMotionProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('UserProfileBadge', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    credits: 1500,
    tier: 'gold',
  };

  describe('Tier Badge Rendering (in dropdown)', () => {
    it('should render bronze tier in dropdown with correct styling', () => {
      const bronzeUser = { ...mockUser, tier: 'bronze' };
      render(<UserProfileBadge user={bronzeUser} />);
      
      // Open dropdown to see tier badge
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Bronze')).toBeInTheDocument();
      expect(screen.getByText('Bronze').closest('div')).toHaveClass('text-amber-700');
    });

    it('should render silver tier in dropdown with correct styling', () => {
      const silverUser = { ...mockUser, tier: 'silver' };
      render(<UserProfileBadge user={silverUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Silver')).toBeInTheDocument();
      expect(screen.getByText('Silver').closest('div')).toHaveClass('text-gray-600');
    });

    it('should render gold tier in dropdown with correct styling', () => {
      const goldUser = { ...mockUser, tier: 'gold' };
      render(<UserProfileBadge user={goldUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Gold').closest('div')).toHaveClass('text-yellow-700');
    });

    it('should render diamond tier in dropdown with correct styling', () => {
      const diamondUser = { ...mockUser, tier: 'diamond' };
      render(<UserProfileBadge user={diamondUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Diamond')).toBeInTheDocument();
      expect(screen.getByText('Diamond').closest('div')).toHaveClass('text-cyan-700');
    });

    it('should default to bronze tier when tier is invalid', () => {
      const invalidUser = { ...mockUser, tier: 'invalid' };
      render(<UserProfileBadge user={invalidUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Bronze')).toBeInTheDocument();
    });

    it('should default to bronze tier when user is undefined', () => {
      render(<UserProfileBadge user={undefined} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Bronze')).toBeInTheDocument();
    });
  });


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

  describe('Dropdown Menu Interaction', () => {
    it('should open dropdown when profile button is clicked', () => {
      render(<UserProfileBadge user={mockUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      render(<UserProfileBadge user={mockUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should call onSettingsClick when Settings is clicked', () => {
      const onSettingsClick = vi.fn();
      render(<UserProfileBadge user={mockUser} onSettingsClick={onSettingsClick} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      fireEvent.click(screen.getByText('Settings'));
      
      expect(onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('should call onHelpClick when Help is clicked', () => {
      const onHelpClick = vi.fn();
      render(<UserProfileBadge user={mockUser} onHelpClick={onHelpClick} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      fireEvent.click(screen.getByText('Help'));
      
      expect(onHelpClick).toHaveBeenCalledTimes(1);
    });

    it('should call onLogoutClick when Logout is clicked', () => {
      const onLogoutClick = vi.fn();
      render(<UserProfileBadge user={mockUser} onLogoutClick={onLogoutClick} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      fireEvent.click(screen.getByText('Logout'));
      
      expect(onLogoutClick).toHaveBeenCalledTimes(1);
    });

    it('should close dropdown after menu item is clicked', () => {
      const onSettingsClick = vi.fn();
      render(<UserProfileBadge user={mockUser} onSettingsClick={onSettingsClick} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      fireEvent.click(screen.getByText('Settings'));
      
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('User Info Display (in dropdown)', () => {
    it('should display user name in dropdown', () => {
      render(<UserProfileBadge user={mockUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display default name when user name is undefined', () => {
      const noNameUser = { ...mockUser, name: undefined };
      render(<UserProfileBadge user={noNameUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should display email in dropdown when provided', () => {
      render(<UserProfileBadge user={mockUser} />);
      
      const profileButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});


describe('TierBadge', () => {
  it('should render all tier types correctly', () => {
    const tiers = ['bronze', 'silver', 'gold', 'diamond'];
    
    tiers.forEach(tier => {
      const { unmount } = render(<TierBadge tier={tier} />);
      expect(screen.getByText(tierConfig[tier].label)).toBeInTheDocument();
      unmount();
    });
  });

  it('should apply correct size classes', () => {
    const { rerender } = render(<TierBadge tier="gold" size="sm" />);
    expect(screen.getByText('Gold').closest('div')).toHaveClass('text-[8px]');
    
    rerender(<TierBadge tier="gold" size="default" />);
    expect(screen.getByText('Gold').closest('div')).toHaveClass('text-[10px]');
    
    rerender(<TierBadge tier="gold" size="lg" />);
    expect(screen.getByText('Gold').closest('div')).toHaveClass('text-xs');
  });

  it('should default to bronze when invalid tier provided', () => {
    render(<TierBadge tier="invalid" />);
    expect(screen.getByText('Bronze')).toBeInTheDocument();
  });
});

describe('CreditsBadge', () => {
  it('should display formatted credits', () => {
    render(<CreditsBadge credits={1234567} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should display zero when credits is 0', () => {
    render(<CreditsBadge credits={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { rerender } = render(<CreditsBadge credits={100} size="sm" />);
    expect(screen.getByText('100').closest('div')).toHaveClass('text-[10px]');
    
    rerender(<CreditsBadge credits={100} size="default" />);
    expect(screen.getByText('100').closest('div')).toHaveClass('text-xs');
    
    rerender(<CreditsBadge credits={100} size="lg" />);
    expect(screen.getByText('100').closest('div')).toHaveClass('text-sm');
  });
});

describe('tierConfig', () => {
  it('should have all required tier configurations', () => {
    const requiredTiers = ['bronze', 'silver', 'gold', 'diamond'];
    
    requiredTiers.forEach(tier => {
      expect(tierConfig[tier]).toBeDefined();
      expect(tierConfig[tier].label).toBeDefined();
      expect(tierConfig[tier].icon).toBeDefined();
      expect(tierConfig[tier].bgColor).toBeDefined();
      expect(tierConfig[tier].textColor).toBeDefined();
      expect(tierConfig[tier].borderColor).toBeDefined();
      expect(tierConfig[tier].iconColor).toBeDefined();
    });
  });

  it('should have correct icons for each tier', () => {
    expect(tierConfig.bronze.icon.displayName || tierConfig.bronze.icon.name).toBeDefined();
    expect(tierConfig.silver.icon.displayName || tierConfig.silver.icon.name).toBeDefined();
    expect(tierConfig.gold.icon.displayName || tierConfig.gold.icon.name).toBeDefined();
    expect(tierConfig.diamond.icon.displayName || tierConfig.diamond.icon.name).toBeDefined();
  });
});
