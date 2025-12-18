import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Loader2, AlertTriangle, Wifi, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isStaticProxy, parseProxy } from '@/utils/proxy';
import { useToast } from '@/hooks/useToast';
import { Input } from './input';
import { Button } from './button';

/**
 * ProxyInput - Input with check button and static IP detection
 * Exposes checkProxy() via ref for auto-check before validation
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
            const response = await fetch('/api/stripe-own/check-proxy', {
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
                setLastCheckedValue(value);
                onProxyCheck?.({ valid: false, message: data.message });
                return { valid: false, isStatic: false };
            }
        } catch {
            // Fallback to local validation if endpoint unavailable
            const appearsStatic = isStaticProxy(value);
            if (appearsStatic) {
                setProxyStatus('static');
                if (showToast) warning('Static IP detected. Rotating proxies work better with Stripe.');
            } else {
                setProxyStatus('valid');
                if (showToast) success('Proxy Live');
            }
            setLastCheckedValue(value);
            onProxyCheck?.({ valid: true, isStatic: appearsStatic });
            return { valid: true, isStatic: appearsStatic };
        } finally {
            setIsChecking(false);
        }
    }, [value, lastCheckedValue, proxyStatus, success, warning, toastError, onProxyCheck]);

    // Expose checkProxy to parent via ref
    useImperativeHandle(ref, () => ({
        checkProxy,
        isChecking,
        proxyStatus,
    }), [checkProxy, isChecking, proxyStatus]);

    const getStatusIcon = () => {
        if (isChecking) return <Loader2 size={12} className="animate-spin text-primary" />;
        if (proxyStatus === 'valid') return <CheckCircle2 size={12} className="text-emerald-500" />;
        if (proxyStatus === 'static') return <AlertTriangle size={12} className="text-amber-500" />;
        if (proxyStatus === 'invalid') return <AlertTriangle size={12} className="text-destructive" />;
        return <Wifi size={12} className="text-muted-foreground" />;
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
                    "h-8 pr-16 font-mono text-xs",
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
                className="absolute right-1 h-6 px-2 text-[10px]"
                title="Check proxy"
            >
                {getStatusIcon()}
            </Button>
        </div>
    );
});
