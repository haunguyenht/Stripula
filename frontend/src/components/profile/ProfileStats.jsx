import { motion } from 'motion/react';
import { Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Single stat pill component
 */
function StatPill({ icon: Icon, label, value, iconColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        // Light mode
        "bg-gray-50 border border-gray-100",
        // Dark mode
        "dark:bg-white/[0.03] dark:border-white/[0.06]"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-7 h-7 rounded-lg",
        "bg-gradient-to-br",
        iconColor
      )}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground truncate">
          {value}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * ProfileStats Component
 * 
 * Displays horizontal stat pills showing key user metrics.
 * 
 * @param {Object} props
 * @param {Object} props.profile - User profile data from API
 * @param {Object} props.dailyUsage - Daily usage stats { cardsUsed }
 * @param {string} props.className - Additional CSS classes
 */
export function ProfileStats({ profile, dailyUsage, className }) {
  const cardsUsed = dailyUsage?.cardsUsed ?? 0;
  const memberSince = profile?.createdAt ? formatDate(profile.createdAt) : 'N/A';

  return (
    <Card 
      variant="elevated" 
      className={cn(
        // Light mode
        "bg-white border-gray-100",
        // Dark mode
        "dark:bg-white/[0.02] dark:border-white/[0.06]",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatPill
            icon={Calendar}
            label="Member Since"
            value={memberSince}
            iconColor="from-blue-500 to-blue-600"
            delay={0}
          />
          <StatPill
            icon={CreditCard}
            label="Cards Today"
            value={cardsUsed.toLocaleString()}
            iconColor="from-violet-500 to-purple-600"
            delay={0.05}
          />
          <div className="col-span-2 sm:col-span-1">
            <StatPill
              icon={TrendingUp}
              label="Status"
              value="Active"
              iconColor="from-emerald-500 to-green-600"
              delay={0.1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileStats;
