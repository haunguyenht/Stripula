import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
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
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * UsersList Component
 * Admin table for viewing and managing users
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

const TIER_ICONS = {
  free: User,
  bronze: Shield,
  silver: Award,
  gold: Crown,
  diamond: Gem,
};

const TIER_COLORS = {
  free: 'text-slate-500',
  bronze: 'text-amber-600 dark:text-amber-400',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  diamond: 'text-sky-500',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            Flag User
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Flagging <span className="font-medium">{user.username || user.firstName}</span> will restrict their account access.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for flagging</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Suspicious activity, Terms violation"
              maxLength={200}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !reason.trim()} 
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Flag User'}
            </Button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Adjust Credits</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Adjusting credits for <span className="font-medium">{user.username || user.firstName}</span>
          <br />
          Current balance: <span className="font-medium">{user.creditBalance?.toLocaleString() || 0}</span>
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (positive to add, negative to remove)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAmount(prev => String((parseInt(prev) || 0) - 100))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAmount(prev => String((parseInt(prev) || 0) + 100))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Compensation for issue"
              maxLength={200}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
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
      } else {
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  }, [page, search, tierFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, search ? 300 : 0);
    
    return () => clearTimeout(debounce);
  }, [page, search, tierFilter]); // Don't include fetchUsers to avoid infinite loop

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
   * Unflag a user (flagging uses modal)
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
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Users
              {total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {total}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32">
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

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tier</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Credits</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const tier = user.tier || 'free';
                    const TierIcon = TIER_ICONS[tier] || User;
                    const isFlagged = user.flagged || user.is_flagged;
                    const createdAt = user.createdAt || user.created_at;
                    
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/30 transition-colors",
                          isFlagged && "bg-red-500/5"
                        )}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            {user.photoUrl || user.photo_url ? (
                              <img 
                                src={user.photoUrl || user.photo_url} 
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {user.firstName || user.first_name || 'Unknown'}
                                {user.lastName || user.last_name ? ` ${user.lastName || user.last_name}` : ''}
                              </p>
                              {user.username && (
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {editingTier === user.id ? (
                            <div className="flex items-center gap-1">
                              <Select 
                                defaultValue={tier}
                                onValueChange={(v) => handleUpdateTier(user.id, v)}
                              >
                                <SelectTrigger className="h-7 w-24 text-xs">
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
                                className="h-6 w-6"
                                onClick={() => setEditingTier(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingTier(user.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                                "hover:bg-muted/50 transition-colors",
                                TIER_COLORS[tier]
                              )}
                            >
                              <TierIcon className="h-3.5 w-3.5" />
                              <span className="capitalize text-xs font-medium">{tier}</span>
                              <Edit2 className="h-3 w-3 opacity-50" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => setCreditsModal(user)}
                            className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            <Coins className="h-3.5 w-3.5" />
                            <span className="font-medium">
                              {(user.creditBalance ?? user.credit_balance ?? 0).toLocaleString()}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-2">
                          {isFlagged ? (
                            <div className="group relative">
                              <Badge variant="destructive" className="text-xs cursor-help">
                                <Flag className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                              {(user.flagReason || user.flag_reason) && (
                                <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block">
                                  <div className="bg-popover text-popover-foreground text-xs rounded-md border shadow-md p-2 max-w-[200px]">
                                    <p className="font-medium mb-1">Reason:</p>
                                    <p className="text-muted-foreground">{user.flagReason || user.flag_reason}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="success" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">
                          {formatDate(createdAt)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {(() => {
                            const isSelf = currentUser?.id === user.id;
                            const isTargetAdmin = user.isAdmin || user.is_admin;
                            const canFlag = !isSelf && !isTargetAdmin;
                            
                            if (!canFlag) {
                              return (
                                <span className="text-xs text-muted-foreground px-2">
                                  {isSelf ? 'You' : 'Admin'}
                                </span>
                              );
                            }
                            
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-7",
                                  isFlagged 
                                    ? "text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10" 
                                    : "text-amber-600 hover:text-amber-600 hover:bg-amber-500/10"
                                )}
                                onClick={() => isFlagged ? handleUnflag(user) : setFlagModal(user)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isFlagged ? (
                                  <>
                                    <FlagOff className="h-3.5 w-3.5 mr-1" />
                                    Unflag
                                  </>
                                ) : (
                                  <>
                                    <Flag className="h-3.5 w-3.5 mr-1" />
                                    Flag
                                  </>
                                )}
                              </Button>
                            );
                          })()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits Modal */}
      {creditsModal && (
        <CreditsModal
          user={creditsModal}
          onClose={() => setCreditsModal(null)}
          onSave={fetchUsers}
        />
      )}

      {/* Flag Modal */}
      {flagModal && (
        <FlagModal
          user={flagModal}
          onClose={() => setFlagModal(null)}
          onSave={fetchUsers}
        />
      )}
    </>
  );
}

export default UsersList;
