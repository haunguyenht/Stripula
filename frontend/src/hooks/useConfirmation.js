import { useState, useCallback } from 'react';

/**
 * Hook for managing confirmation dialogs with promise-based API
 * 
 * @returns {{
 *   isOpen: boolean,
 *   config: object | null,
 *   confirm: (config: ConfirmationConfig) => Promise<boolean>,
 *   handleConfirm: () => void,
 *   handleCancel: () => void,
 *   setOpen: (open: boolean) => void,
 *   isLoading: boolean,
 *   setLoading: (loading: boolean) => void
 * }}
 * 
 * @typedef {Object} ConfirmationConfig
 * @property {string} title - Dialog title
 * @property {string} [description] - Dialog description
 * @property {React.ReactNode} [content] - Custom content to render
 * @property {string} [confirmText] - Confirm button text (default: "Confirm")
 * @property {string} [cancelText] - Cancel button text (default: "Cancel")
 * @property {boolean} [destructive] - Use destructive button style
 * 
 * @example
 * const { isOpen, config, confirm, handleConfirm, handleCancel, setOpen, isLoading, setLoading } = useConfirmation();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     description: 'Are you sure you want to delete this item?',
 *     destructive: true,
 *     confirmText: 'Delete'
 *   });
 *   
 *   if (confirmed) {
 *     // Perform delete action
 *   }
 * };
 * 
 * // In JSX:
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setOpen}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   isLoading={isLoading}
 *   {...config}
 * />
 */
export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((confirmConfig) => {
    return new Promise((resolve) => {
      setConfig({
        title: confirmConfig.title || 'Confirm Action',
        description: confirmConfig.description,
        content: confirmConfig.content,
        confirmText: confirmConfig.confirmText || 'Confirm',
        cancelText: confirmConfig.cancelText || 'Cancel',
        destructive: confirmConfig.destructive || false,
      });
      setResolveRef(() => resolve);
      setIsOpen(true);
      setIsLoading(false);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef) {
      resolveRef(true);
    }
    setIsOpen(false);
    setConfig(null);
    setResolveRef(null);
    setIsLoading(false);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    if (resolveRef) {
      resolveRef(false);
    }
    setIsOpen(false);
    setConfig(null);
    setResolveRef(null);
    setIsLoading(false);
  }, [resolveRef]);

  const setOpen = useCallback((open) => {
    if (!open && resolveRef) {
      resolveRef(false);
      setResolveRef(null);
    }
    setIsOpen(open);
    if (!open) {
      setConfig(null);
      setIsLoading(false);
    }
  }, [resolveRef]);

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel,
    setOpen,
    isLoading,
    setLoading: setIsLoading,
  };
}

export default useConfirmation;
