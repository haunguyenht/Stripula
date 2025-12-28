import { useEffect } from 'react';
import { toast } from 'sonner';
import { useUserNotifications } from '@/hooks/useUserNotifications';

/**
 * UserNotificationListener
 * Listens for real-time user notifications and shows toasts.
 * Must be placed inside AuthProvider.
 */
export function UserNotificationListener() {
    const { isConnected } = useUserNotifications({
        onCreditChange: (data) => {
            const { balance, change, reason } = data;
            const formattedChange = change > 0 ? `+${change}` : change;
            
            if (change > 0) {
                toast.success(`Credits Updated: ${formattedChange}`, {
                    description: reason || `New balance: ${balance.toFixed(1)}`
                });
            } else if (change < 0) {
                toast.info(`Credits Adjusted: ${formattedChange}`, {
                    description: reason || `New balance: ${balance.toFixed(1)}`
                });
            }
        },
        onTierChange: (data) => {
            const { tier, previousTier } = data;
            const isUpgrade = getTierLevel(tier) > getTierLevel(previousTier);
            
            if (isUpgrade) {
                toast.success(`Tier Upgraded!`, {
                    description: `You are now ${tier.toUpperCase()}`
                });
            } else {
                toast.info(`Tier Changed`, {
                    description: `Your tier is now ${tier}`
                });
            }
        }
    });

    return null;
}

function getTierLevel(tier) {
    const levels = { free: 0, bronze: 1, silver: 2, gold: 3, diamond: 4 };
    return levels[tier?.toLowerCase()] || 0;
}

export default UserNotificationListener;
