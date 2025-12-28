import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * TelegramLoginButton Component
 * Integrates official Telegram Login Widget for SSO authentication
 * 
 * Requirements: 1.1
 * 
 * @param {Object} props
 * @param {string} props.botName - Telegram bot username (without @)
 * @param {string} props.buttonSize - Widget size: 'large' | 'medium' | 'small'
 * @param {boolean} props.cornerRadius - Button corner radius (0-20)
 * @param {boolean} props.requestAccess - Request write access to user
 * @param {string} props.referralCode - Optional referral code for new users
 * @param {Function} props.onSuccess - Callback on successful login
 * @param {Function} props.onError - Callback on login error
 */
export function TelegramLoginButton({
  botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'your_bot',
  buttonSize = 'large',
  cornerRadius = 10,
  requestAccess = 'write',
  referralCode = null,
  onSuccess,
  onError
}) {
  const containerRef = useRef(null);
  const { login, isLoading } = useAuth();

  // Handle Telegram auth callback
  const handleTelegramAuth = useCallback(async (authData) => {
    try {
      const result = await login(authData, referralCode);
      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.error);
      }
    } catch (error) {
      onError?.(error.message || 'Authentication failed');
    }
  }, [login, referralCode, onSuccess, onError]);

  useEffect(() => {
    // Expose callback to window for Telegram widget
    window.onTelegramAuth = handleTelegramAuth;

    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', requestAccess);

    // Clear container and append script
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      delete window.onTelegramAuth;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, handleTelegramAuth]);

  return (
    <div 
      ref={containerRef} 
      className="telegram-login-container flex items-center justify-center"
      data-loading={isLoading}
    >
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          <span>Authenticating...</span>
        </div>
      )}
    </div>
  );
}

export default TelegramLoginButton;
