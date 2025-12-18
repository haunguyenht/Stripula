import { Shield, Award, Crown, Gem, Settings, HelpCircle, LogOut, User, Coins, Mail, ChevronRight, ChevronDown, Menu } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

// Tier config
const tierConfig = {
  bronze: {
    label: 'Bronze',
    icon: Shield,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  silver: {
    label: 'Silver',
    icon: Award,
    color: 'text-slate-500 dark:text-slate-300',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
  },
  gold: {
    label: 'Gold',
    icon: Crown,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  diamond: {
    label: 'Diamond',
    icon: Gem,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
};

/**
 * UserProfileBadge - User avatar with dropdown menu
 */
export function UserProfileBadge({ 
  user,
  onSettingsClick,
  onHelpClick,
  onLogoutClick,
  className,
}) {
  const tier = tierConfig[user?.tier] || tierConfig.bronze;
  const TierIcon = tier.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-xl hover:bg-muted/50", className)}>
          <Menu className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-0">
        {/* User Info Header */}
        <div className="p-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
          
          {/* Tier Badge */}
          <div className={cn(
            "mt-3 flex items-center justify-between p-2 rounded-lg border",
            tier.bgColor,
            tier.borderColor
          )}>
            <div className="flex items-center gap-2">
              <TierIcon className={cn("h-4 w-4", tier.color)} />
              <span className={cn("text-sm font-medium", tier.color)}>{tier.label}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              <span className="font-medium">{(user?.credits ?? 0).toLocaleString()}</span>
              <span>credits</span>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="m-0" />
        
        {/* Menu Items */}
        <div className="p-1.5">
          <DropdownMenuItem onClick={onSettingsClick} className="gap-3 py-2.5 px-3 rounded-md cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Settings className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Settings</span>
              <p className="text-xs text-muted-foreground">Manage your account</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onHelpClick} className="gap-3 py-2.5 px-3 rounded-md cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Help & Support</span>
              <p className="text-xs text-muted-foreground">Get assistance</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="m-0" />
        
        {/* Logout */}
        <div className="p-1.5">
          <DropdownMenuItem 
            onClick={onLogoutClick} 
            className="gap-3 py-2.5 px-3 rounded-md cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 dark:text-red-400 dark:focus:text-red-400 dark:hover:text-red-400 dark:focus:bg-red-500/10 dark:hover:bg-red-500/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 dark:bg-red-500/15">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { tierConfig };

