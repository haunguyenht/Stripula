import { useState, useCallback } from 'react';

export function useDailyClaimModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState(0);

  const show = useCallback(() => setIsOpen(true), []);
  const hide = useCallback(() => setIsOpen(false), []);
  
  const handleClaim = useCallback((amount) => {
    setClaimAmount(amount);
  }, []);

  return {
    isOpen,
    setIsOpen,
    show,
    hide,
    claimAmount,
    onClaim: handleClaim
  };
}

export default useDailyClaimModal;
