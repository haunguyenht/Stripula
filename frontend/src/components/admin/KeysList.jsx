import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Key, 
  Loader2, 
  Copy, 
  Check, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Clock,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { spring } from '@/lib/motion';

/**
 * KeysList Component
 * Admin table for viewing and managing redeem keys
 * 
 * Requirements: 4.7, 4.8
 */

const API_BASE = '/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'unused', label: 'Unused' },
  { value: 'used', label: 'Used' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'credits', label: 'Credits' },
  { value: 'tier', label: 'Tier' },
];

/**
 * Get status badge variant and label
 */
function getKeyStatus(key) {
  if (key.revokedAt || key.revoked_at) {
    return { status: 'revoked', label: 'Revoked', variant: 'destructive' };
  }
  
  const expiresAt = key.expiresAt || key.expires_at;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { status: 'expired', label: 'Expired', variant: 'warning' };
  }
  
  const currentUses = key.currentUses ?? key.current_uses ?? 0;
  const maxUses = key.maxUses ?? key.max_uses ?? 1;
  
  if (currentUses >= maxUses) {
    return { status: 'used', label: 'Used', variant: 'secondary' };
  }
  
  return { status: 'unused', label: 'Unused', variant: 'success' };
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function KeysList({ refreshTrigger }) {
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  
  const { success, error } = useToast();
  const limit = 10;

  /**
   * Fetch keys from API
   */
  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`${API_BASE}/admin/keys?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setKeys(data.keys || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      } else {
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    fetchKeys();
  }, [page, typeFilter, statusFilter, refreshTrigger]); // Don't include fetchKeys to avoid infinite loop

  /**
   * Revoke a key
   */
  const handleRevoke = useCallback(async (keyId) => {
    setRevokingId(keyId);
    
    try {
      const response = await fetch(`${API_BASE}/admin/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        success('Key revoked successfully');
        fetchKeys();
      } else {
        error(data.message || 'Failed to revoke key');
      }
    } catch (err) {
      error('Network error. Please try again.');
    } finally {
      setRevokingId(null);
    }
  }, [fetchKeys, success, error]);

  /**
   * Copy key code to clipboard
   */
  const handleCopy = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      error('Failed to copy');
    }
  }, [error]);

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            Redeem Keys
            {total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {total}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchKeys} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Keys Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No keys found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Value</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Uses</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Created</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key, index) => {
                  const { status, label, variant } = getKeyStatus(key);
                  const currentUses = key.currentUses ?? key.current_uses ?? 0;
                  const maxUses = key.maxUses ?? key.max_uses ?? 1;
                  const createdAt = key.createdAt || key.created_at;
                  
                  return (
                    <motion.tr
                      key={key.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {key.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(key.code)}
                          >
                            {copiedCode === key.code ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-2 capitalize">{key.type}</td>
                      <td className="py-3 px-2">
                        {key.type === 'credits' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {key.value} credits
                          </span>
                        ) : (
                          <span className="capitalize font-medium">{key.value}</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={cn(
                          currentUses >= maxUses && "text-muted-foreground"
                        )}>
                          {currentUses}/{maxUses}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={variant} className="text-xs">
                          {label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {formatDate(createdAt)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {status === 'unused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevoke(key.id)}
                            disabled={revokingId === key.id}
                          >
                            {revokingId === key.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Revoke
                              </>
                            )}
                          </Button>
                        )}
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
  );
}

export default KeysList;
