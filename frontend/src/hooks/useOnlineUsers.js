import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { dashboardSSE } from '@/lib/services/dashboardSSE';

/**
 * useOnlineUsers Hook
 * Fetches and maintains paginated list of online users with real-time SSE updates.
 * 
 * Requirements: 6.1, 6.2, 6.3, 9.2
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Users per page (default 10)
 * @returns {Object} - Online users data, pagination state, and methods
 */

const API_BASE = '/api';

export function useOnlineUsers(options = {}) {
  const { limit = 10 } = options;
  const subscriberId = useId();
  
  // Online users state (Requirement: 6.1)
  const [users, setUsers] = useState([]);
  
  // Pagination state (Requirement: 6.3)
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Fetch online users from API
   * Requirement: 6.1 - Paginated list of online users
   */
  const fetchOnlineUsers = useCallback(async (pageNum = page) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE}/dashboard/online-users?page=${pageNum}&limit=${limit}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setUsers(data.users || []);
          setPagination(data.pagination || {
            page: pageNum,
            limit,
            total: 0,
            totalPages: 0
          });
          setLastUpdate(new Date(data.timestamp));
          setError(null);
          return { success: true };
        }
      }

      setError('Failed to fetch online users');
      return { success: false, error: 'Failed to fetch online users' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  /**
   * Handle SSE events for online user updates
   * Requirement: 9.2 - Update online users list automatically
   */
  const handleSSEEvent = useCallback((data) => {
    switch (data.type) {
      case 'userOnline':
        // Requirement: 9.2 - New user came online
        // Add to list if on first page and not already present
        if (page === 1) {
          setUsers(prev => {
            // Check if user already in list
            if (prev.some(u => u.userId === data.userId)) {
              return prev;
            }
            // Add new user at the beginning (most recently active)
            const newUser = {
              userId: data.userId,
              username: data.username,
              firstName: data.firstName || '',
              tier: data.tier || 'free',
              lastActiveAt: data.timestamp,
              avatarUrl: data.avatarUrl || data.photoUrl || null
            };
            // Keep list within limit
            const updated = [newUser, ...prev];
            if (updated.length > limit) {
              updated.pop();
            }
            return updated;
          });
          // Update total count
          setPagination(prev => ({
            ...prev,
            total: prev.total + 1,
            totalPages: Math.ceil((prev.total + 1) / limit)
          }));
        }
        setLastUpdate(new Date(data.timestamp));
        break;
        
      case 'userOffline':
        // Requirement: 6.4 - User went offline
        setUsers(prev => prev.filter(u => u.userId !== data.userId));
        // Update total count
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          totalPages: Math.ceil(Math.max(0, prev.total - 1) / limit)
        }));
        setLastUpdate(new Date(data.timestamp));
        break;
        
      case 'globalStatsUpdate':
        // Online count changed, might need to refresh
        if (data.global?.onlineCount !== undefined) {
          setPagination(prev => ({
            ...prev,
            total: data.global.onlineCount,
            totalPages: Math.ceil(data.global.onlineCount / limit)
          }));
        }
        break;
        
      default:
        break;
    }
  }, [page, limit]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    const unsubscribe = dashboardSSE.subscribe(subscriberId, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, handleSSEEvent]);

  // Fetch online users when page changes
  useEffect(() => {
    fetchOnlineUsers(page);
  }, [page, fetchOnlineUsers]);

  /**
   * Go to specific page
   * Requirement: 6.3 - Pagination controls
   */
  const goToPage = useCallback((pageNum) => {
    if (pageNum >= 1 && pageNum <= pagination.totalPages) {
      setPage(pageNum);
    }
  }, [pagination.totalPages]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (page < pagination.totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, pagination.totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  /**
   * Manually refresh online users
   */
  const refresh = useCallback(async () => {
    return fetchOnlineUsers(page);
  }, [fetchOnlineUsers, page]);

  // Derived state
  const hasNextPage = page < pagination.totalPages;
  const hasPrevPage = page > 1;

  return useMemo(() => ({
    // Online users data (Requirement: 6.1, 6.2)
    users,
    
    // Pagination state (Requirement: 6.3)
    page,
    totalPages: pagination.totalPages,
    total: pagination.total,
    limit: pagination.limit,
    hasNextPage,
    hasPrevPage,
    
    // Loading and error state
    isLoading,
    error,
    lastUpdate,
    
    // Pagination methods (Requirement: 6.3)
    setPage: goToPage,
    nextPage,
    prevPage,
    
    // Actions
    refresh
  }), [
    users,
    page,
    pagination,
    hasNextPage,
    hasPrevPage,
    isLoading,
    error,
    lastUpdate,
    goToPage,
    nextPage,
    prevPage,
    refresh
  ]);
}

export default useOnlineUsers;
