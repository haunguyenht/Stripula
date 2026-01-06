import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Loader2, AlertTriangle, Wifi, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isStaticProxy, parseProxy } from '@/utils/proxy';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * ProxyInput - Input with check button and static IP detection
 * Exposes checkProxy() and checkStripeAccess() via ref for auto-check before validation
 */
export const ProxyInput = forwardRef(function ProxyInput({
    value,
    onChange,
    disabled,
    placeholder = "Proxy (host:port:user:pass)",
    className,
    onProxyCheck,
}, ref) {
    const [isChecking, setIsChecking] = useState(false);
    const [proxyStatus, setProxyStatus] = useState(null);
    const [lastCheckedValue, setLastCheckedValue] = useState(null);
    const { success, warning, error: toastError } = useToast();

    const checkProxy = useCallback(async (showToast = true) => {
        if (!value?.trim()) {
            if (showToast) warning('Please enter a proxy first');
            return { valid: false, isStatic: false };
        }

        // Skip if already checked this exact value
        if (lastCheckedValue === value && proxyStatus) {
            const isStatic = proxyStatus === 'static';
            if (isStatic && showToast) {
                warning('This looks like a static IP. Try a rotating proxy for better results.');
            }
            return { valid: proxyStatus !== 'invalid', isStatic };
        }

        const parsed = parseProxy(value);
        if (!parsed) {
            if (showToast) toastError('Proxy format not recognized. Try: host:port:user:pass');
            setProxyStatus('invalid');
            return { valid: false, isStatic: false };
        }

        setIsChecking(true);
        setProxyStatus(null);

        try {
            const appearsStatic = isStaticProxy(value);
            const response = await fetch('/api/proxy/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxy: parsed })
            });
            const data = await response.json();

            if (data.success) {
                const isStatic = appearsStatic || data.isStatic;
                if (isStatic) {
                    setProxyStatus('static');
                    if (showToast) warning('Static IP detected. Rotating proxies work better with Stripe.');
                } else {
                    setProxyStatus('valid');
                    if (showToast) success('Proxy Live' + (data.ip ? ' • ' + data.ip : ''));
                }
                setLastCheckedValue(value);
                onProxyCheck?.({ valid: true, isStatic, ip: data.ip });
                return { valid: true, isStatic };
            } else {
                setProxyStatus('invalid');
                if (showToast) toastError(data.message || 'Proxy Dead - Could not connect');
                setLastCheckedValue(null); // Allow retry on failure
                onProxyCheck?.({ valid: false, message: data.message });
                return { valid: false, isStatic: false };
            }
        } catch (err) {
            // Server unavailable - cannot verify proxy
            setProxyStatus('invalid');
            if (showToast) toastError('Cannot verify proxy - server unavailable');
            setLastCheckedValue(null); // Allow retry
            onProxyCheck?.({ valid: false, message: 'Server unavailable' });
            return { valid: false, isStatic: false };
        } finally {
            setIsChecking(false);
        }
    }, [value, lastCheckedValue, proxyStatus, success, warning, toastError, onProxyCheck]);

    /**
     * Check if proxy can reach Stripe's API
     * Some proxies block financial/payment APIs
     * NOTE: This does NOT modify proxyStatus - it's a separate check
     */
    const checkStripeAccess = useCallback(async (showToast = true) => {
        if (!value?.trim()) {
            if (showToast) warning('Please enter a proxy first');
            return { canAccessStripe: false };
        }

        const parsed = parseProxy(value);
        if (!parsed) {
            if (showToast) toastError('Proxy format not recognized');
            return { canAccessStripe: false };
        }

        setIsChecking(true);

        try {
            const response = await fetch('/api/proxy/check-stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxy: parsed })
            });
            const data = await response.json();

            if (data.success) {
                if (showToast) success('Stripe API accessible');
                return { canAccessStripe: true, responseTime: data.responseTime };
            } else {
                // Don't set proxyStatus here - this is a separate Stripe-specific check
                if (showToast) {
                    if (data.blocked) {
                        toastError('Proxy blocked from Stripe API. Try a different proxy provider.');
                    } else {
                        toastError(data.message || 'Cannot reach Stripe API through this proxy');
                    }
                }
                return { canAccessStripe: false, blocked: data.blocked, message: data.message };
            }
        } catch (err) {
            // Don't set proxyStatus here - this is a separate Stripe-specific check
            if (showToast) toastError('Cannot verify Stripe access - server unavailable');
            return { canAccessStripe: false, message: 'Server unavailable' };
        } finally {
            setIsChecking(false);
        }
    }, [value, success, warning, toastError]);

    // Expose checkProxy and checkStripeAccess to parent via ref
    useImperativeHandle(ref, () => ({
        checkProxy,
        checkStripeAccess,
        isChecking,
        proxyStatus,
    }), [checkProxy, checkStripeAccess, isChecking, proxyStatus]);

    const getStatusIcon = () => {
        if (isChecking) return <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-primary dark:text-white" />;
        if (proxyStatus === 'valid') return <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500 dark:text-emerald-400" />;
        if (proxyStatus === 'static') return <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 dark:text-amber-400" />;
        if (proxyStatus === 'invalid') return <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />;
        return <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground dark:text-white/70" />;
    };

    const getInputVariantClass = () => {
        if (proxyStatus === 'valid') return 'border-emerald-500/30 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20';
        if (proxyStatus === 'static') return 'border-amber-500/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20';
        if (proxyStatus === 'invalid') return 'border-destructive/30 focus-visible:border-destructive/50 focus-visible:ring-destructive/20';
        return '';
    };

    const getButtonVariant = () => {
        if (proxyStatus === 'valid') return 'success';
        if (proxyStatus === 'static') return 'warning';
        if (proxyStatus === 'invalid') return 'destructive';
        return 'secondary';
    };

    return (
        <div className="relative flex items-center">
            <Input
                id="proxy-input"
                name="proxy-input"
                type="text"
                value={value || ''}
                onChange={(e) => {
                    onChange(e);
                    setProxyStatus(null);
                    setLastCheckedValue(null);
                }}
                disabled={disabled || isChecking}
                placeholder={placeholder}
                className={cn(
                    "h-7 sm:h-8 pr-12 sm:pr-16 font-mono text-[10px] sm:text-xs",
                    getInputVariantClass(),
                    className
                )}
            />
            <Button
                type="button"
                variant={getButtonVariant()}
                size="sm"
                onClick={() => checkProxy(true)}
                disabled={disabled || isChecking || !value?.trim()}
                className="absolute right-0.5 sm:right-1 h-5 sm:h-6 px-1.5 sm:px-2 text-[9px] sm:text-[10px]"
                title="Check proxy"
            >
                {getStatusIcon()}
            </Button>
        </div>
    );
});
