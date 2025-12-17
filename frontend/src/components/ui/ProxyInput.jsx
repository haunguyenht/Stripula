import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Loader2, AlertTriangle, Wifi, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { isStaticProxy, parseProxy } from '../../utils/proxy.js';
import { useToast } from '../../hooks/useToast.js';

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
        if (isChecking) return <Loader2 size={12} className="animate-spin text-luma-coral" />;
        if (proxyStatus === 'valid') return <CheckCircle2 size={12} className="text-emerald-500" />;
        if (proxyStatus === 'static') return <AlertTriangle size={12} className="text-amber-500" />;
        if (proxyStatus === 'invalid') return <AlertTriangle size={12} className="text-rose-500" />;
        return <Wifi size={12} className="text-gray-400" />;
    };

    const getBorderClass = () => {
        if (proxyStatus === 'valid') return 'border-emerald-500/30 focus:border-emerald-500/50';
        if (proxyStatus === 'static') return 'border-amber-500/30 focus:border-amber-500/50';
        if (proxyStatus === 'invalid') return 'border-rose-500/30 focus:border-rose-500/50';
        return 'border-luma-coral-15 focus:border-luma-coral-40';
    };

    const getBtnClass = () => {
        if (proxyStatus === 'valid') return 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20';
        if (proxyStatus === 'static') return 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20';
        if (proxyStatus === 'invalid') return 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20';
        return 'bg-luma-coral-10 text-luma-coral hover:bg-luma-coral-20';
    };

    return (
        <div className="relative flex items-center">
            <input
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
                    "floating-input rounded-apple",
                    "flex h-7 md:h-8 w-full pl-3 pr-16",
                    "text-[10px] font-mono text-luma",
                    "placeholder:text-luma-muted",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    "focus:outline-none focus:ring-2 focus:ring-luma-coral-20",
                    "transition-all duration-200",
                    getBorderClass(),
                    className
                )}
            />
            <button
                type="button"
                onClick={() => checkProxy(true)}
                disabled={disabled || isChecking || !value?.trim()}
                className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2",
                    "flex items-center gap-1 px-2 py-1 rounded-lg",
                    "text-[9px] font-medium transition-all duration-200",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    getBtnClass()
                )}
                title="Check proxy"
            >
                {getStatusIcon()}
            </button>
        </div>
    );
});

export default ProxyInput;
