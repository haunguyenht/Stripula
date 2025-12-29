import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Loader2, 
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Shield,
  Award,
  Crown,
  Gem,
  User,
  Flag,
  FlagOff,
  Coins,
  Edit2,
  X,
  Check,
  Plus,
  Minus,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * UsersList Component
 * Admin table for viewing and managing users
 * Redesigned with OrangeAI (light) / OPUX (dark) design system
 * 
 * Requirements: 3.1, 3.2, 3.5
 */

const API_BASE = '/api';

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'diamond', label: 'Diamond' },
];

const TIER_CONFIG = {
  free: { icon: User, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  bronze: { icon: Shield, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  silver: { icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  gold: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  diamond: { icon: Gem, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Flag Reason Modal
 */
function FlagModal({ user, onClose, onSave }) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleSave = async () => {
    if (!reason.trim()) {
      error('Please provide a reason');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}/flag`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() })
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        success('User flagged successfully');
        onSave();
        onClose();
      } else {
        error(data.message || 'Failed to flag user');
      }
    } catch (err) {
      error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "w-full max-w-md mx-4 rounded-2xl overflow-hidden",
          "bg-white dark:bg-[rgba(30,41,59,0.95)]",
          "border border-[rgb(237,234,233)] dark:border-white/10",
          "shadow-xl dark:shadow-none"
        )}
      >
        <div className="p-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-[rgb(37,27,24)] dark:text-white">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Flag className="h-4 w-4 text-amber-500" />
              </div>
            Flag User
          </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
            Flagging <span className="font-medium text-foreground">{user.username || user.firstName}</span> will restrict their account access.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
              <Label className="text-xs font-medium">Reason for flagging</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Suspicious activity, Terms violation"
              maxLength={200}
                className="rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !reason.trim()} 
                className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Flag User'}
            </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Credits Adjustment Modal
 */
function CreditsModal({ user, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleSave = async () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount === 0) {
      error('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      error('Please provide a reason');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}/credits`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, reason: reason.trim() })
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        success(`Credits ${numAmount > 0 ? 'added' : 'removed'} successfully`);
        onSave();
        onClose();
      } else {
        error(data.message || 'Failed to update credits');
      }
    } catch (err) {
      error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "w-full max-w-md mx-4 rounded-2xl overflow-hidden",
          "bg-white dark:bg-[rgba(30,41,59,0.95)]",
          "border border-[rgb(237,234,233)] dark:border-white/10",
          "shadow-xl dark:shadow-none"
        )}
      >
        <div className="p-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-[rgb(37,27,24)] dark:text-white">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Coins className="h-4 w-4 text-amber-500" />
              </div>
              Adjust Credits
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
          <div className={cn(
            "p-3 rounded-xl mb-4",
            "bg-[rgb(250,247,245)] dark:bg-white/5",
            "border border-[rgb(237,234,233)] dark:border-white/10"
          )}>
            <p className="text-sm text-muted-foreground">
              Adjusting credits for <span className="font-medium text-foreground">{user.username || user.firstName}</span>
            </p>
            <p className="text-lg font-bold text-[rgb(37,27,24)] dark:text-white mt-1">
              Current balance: <span className="text-amber-600 dark:text-amber-400">{user.creditBalance?.toLocaleString() || 0}</span>
            </p>
          </div>

        <div className="space-y-4">
          <div className="space-y-2">
              <Label className="text-xs font-medium">Amount (positive to add, negative to remove)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAmount(prev => String((parseInt(prev) || 0) - 100))}
                  className="rounded-xl"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                  className="text-center rounded-xl"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAmount(prev => String((parseInt(prev) || 0) + 100))}
                  className="rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
              <Label className="text-xs font-medium">Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Compensation for issue"
              maxLength={200}
                className="rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
              <Button onClick={handleSave} disabled={isLoading} className="flex-1 rounded-xl">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * User Row Component
 */
function UserRow({ user, index, currentUser, onEditTier, onCredits, onFlag, onUnflag, editingTier, setEditingTier, handleUpdateTier, actionLoading }) {
  const tier = user.tier || 'free';
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;
  const isFlagged = user.flagged || user.is_flagged;
  const createdAt = user.createdAt || user.created_at;
  const isSelf = currentUser?.id === user.id;
  const isTargetAdmin = user.isAdmin || user.is_admin;
  const canFlag = !isSelf && !isTargetAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group p-4 rounded-xl transition-all duration-200",
        "bg-white dark:bg-white/[0.02]",
        "border border-[rgb(237,234,233)] dark:border-white/5",
        "hover:border-[rgb(255,64,23)]/20 dark:hover:border-white/10",
        "hover:shadow-sm dark:hover:bg-white/[0.04]",
        isFlagged && "border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {user.photoUrl || user.photo_url ? (
            <img 
              src={user.photoUrl || user.photo_url} 
              alt=""
              className="h-12 w-12 rounded-xl object-cover border border-[rgb(237,234,233)] dark:border-white/10"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-[rgb(250,247,245)] dark:bg-white/5 flex items-center justify-center border border-[rgb(237,234,233)] dark:border-white/10">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[rgb(37,27,24)] dark:text-white truncate">
              {user.firstName || user.first_name || 'Unknown'}
              {user.lastName || user.last_name ? ` ${user.lastName || user.last_name}` : ''}
            </p>
            {isFlagged && (
              <Badge variant="destructive" className="text-[10px] h-5">
                <Flag className="h-3 w-3 mr-1" />
                Flagged
              </Badge>
            )}
            {isTargetAdmin && (
              <Badge variant="outline" className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">
                Admin
              </Badge>
            )}
          </div>
          {user.username && (
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          )}
        </div>

        {/* Tier Badge */}
        <div className="hidden sm:block">
          {editingTier === user.id ? (
            <div className="flex items-center gap-1">
              <Select 
                defaultValue={tier}
                onValueChange={(v) => handleUpdateTier(user.id, v)}
              >
                <SelectTrigger className="h-8 w-28 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.filter(t => t.value !== 'all').map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditingTier(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTier(user.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                "transition-colors",
                tierConfig.bg,
                tierConfig.border,
                "border",
                "hover:opacity-80"
              )}
            >
              <TierIcon className={cn("h-3.5 w-3.5", tierConfig.color)} />
              <span className={cn("capitalize text-xs font-medium", tierConfig.color)}>{tier}</span>
              <Edit2 className="h-3 w-3 opacity-50 ml-1" />
            </button>
          )}
        </div>

        {/* Credits */}
        <button
          onClick={() => onCredits(user)}
          className={cn(
            "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            "bg-amber-500/10 border border-amber-500/20",
            "hover:bg-amber-500/15 transition-colors"
          )}
        >
          <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">
            {(user.creditBalance ?? user.credit_balance ?? 0).toLocaleString()}
          </span>
        </button>

        {/* Join Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(createdAt)}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onCredits(user)}>
              <Coins className="h-4 w-4 mr-2 text-amber-500" />
              Adjust Credits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingTier(user.id)}>
              <Crown className="h-4 w-4 mr-2 text-yellow-500" />
              Change Tier
            </DropdownMenuItem>
            {canFlag && (
              <>
                <DropdownMenuSeparator />
                {isFlagged ? (
                  <DropdownMenuItem 
                    onClick={() => onUnflag(user)}
                    disabled={actionLoading === user.id}
                    className="text-emerald-600"
                  >
                    <FlagOff className="h-4 w-4 mr-2" />
                    Unflag User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => onFlag(user)}
                    className="text-amber-600"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag User
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Flag Reason Tooltip */}
      {isFlagged && (user.flagReason || user.flag_reason) && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400">
            <span className="font-medium">Reason:</span> {user.flagReason || user.flag_reason}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export function UsersList() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingTier, setEditingTier] = useState(null);
  const [creditsModal, setCreditsModal] = useState(null);
  const [flagModal, setFlagModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();
  const limit = 10;

  /**
   * Fetch users from API
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (tierFilter !== 'all') {
        params.append('tier', tierFilter);
      }

      const response = await fetch(`${API_BASE}/admin/users?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [page, search, tierFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, search ? 300 : 0);
    
    return () => clearTimeout(debounce);
  }, [page, search, tierFilter]);

  /**
   * Update user tier
   */
  const handleUpdateTier = useCallback(async (userId, newTier) => {
    setActionLoading(userId);
    
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/tier`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        success('Tier updated successfully');
        setEditingTier(null);
        fetchUsers();
      } else {
        error(data.message || 'Failed to update tier');
      }
    } catch (err) {
      error('Network error');
    } finally {
      setActionLoading(null);
    }
  }, [fetchUsers, success, error]);

  /**
   * Unflag a user
   */
  const handleUnflag = useCallback(async (user) => {
    setActionLoading(user.id);
    
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}/flag`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        success('User unflagged');
        fetchUsers();
      } else {
        error(data.message || 'Failed to unflag user');
      }
    } catch (err) {
      error('Network error');
    } finally {
      setActionLoading(null);
    }
  }, [fetchUsers, success, error]);

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10 bg-gradient-to-br from-[rgb(250,247,245)] to-transparent dark:from-white/[0.02] dark:to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white flex items-center gap-2">
              Users
              {total > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {total.toLocaleString()}
                </Badge>
              )}
                </h2>
                <p className="text-xs text-muted-foreground">Manage user accounts and permissions</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUsers} 
              disabled={isLoading}
              className="rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-[rgb(237,234,233)] dark:border-white/10">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-[rgb(250,247,245)] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-[rgb(37,27,24)] dark:text-white mb-1">No users found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {users.map((user, index) => (
                  <UserRow
                        key={user.id}
                    user={user}
                    index={index}
                    currentUser={currentUser}
                    onEditTier={setEditingTier}
                    onCredits={setCreditsModal}
                    onFlag={setFlagModal}
                    onUnflag={handleUnflag}
                    editingTier={editingTier}
                    setEditingTier={setEditingTier}
                    handleUpdateTier={handleUpdateTier}
                    actionLoading={actionLoading}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

          {/* Pagination */}
          {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[rgb(237,234,233)] dark:border-white/10 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                className="rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Credits Modal */}
      <AnimatePresence>
      {creditsModal && (
        <CreditsModal
          user={creditsModal}
          onClose={() => setCreditsModal(null)}
          onSave={fetchUsers}
        />
      )}
      </AnimatePresence>

      {/* Flag Modal */}
      <AnimatePresence>
      {flagModal && (
        <FlagModal
          user={flagModal}
          onClose={() => setFlagModal(null)}
          onSave={fetchUsers}
        />
      )}
      </AnimatePresence>
    </>
  );
}

export default UsersList;
