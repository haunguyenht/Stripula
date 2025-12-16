import { useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastContext } from '../../contexts/ToastContext';
import { Toast } from './Toast';

/**
 * ToastContainer Component
 * Renders all active toasts in a fixed position container
 * 
 * Features:
 * - Fixed position in top-right corner
 * - Stacks toasts vertically with consistent spacing
 * - Uses AnimatePresence for smooth enter/exit animations
 * - aria-live="polite" for screen reader announcements
 * 
 * @param {Object} props
 * @param {('top-right'|'top-left'|'bottom-right'|'bottom-left')} [props.position='top-right'] - Container position
 * 
 * Requirements: 2.3, 6.1
 */
export function ToastContainer({ position = 'top-right' }) {
  const context = useContext(ToastContext);

  // If no context, render nothing (provider not mounted yet)
  if (!context) {
    return null;
  }

  const { toasts, dismiss } = context;

  // Position classes mapping
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const positionClass = positionClasses[position] || positionClasses['top-right'];

  return (
    <div
      className={`fixed ${positionClass} z-50 flex flex-col gap-3 pointer-events-none`}
      aria-live="polite"
      aria-atomic="false"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onDismiss={dismiss}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
