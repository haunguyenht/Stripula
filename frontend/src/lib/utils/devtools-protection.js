/**
 * DevTools Protection Utility
 * Prevents F12, right-click context menu, and DevTools access in production
 */

const isProduction = import.meta.env.PROD;

// Detection state
let devToolsOpen = false;
let checkInterval = null;

/**
 * Detect if DevTools is open using various methods
 */
function detectDevTools() {
  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  
  // Check using debugger timing
  const start = performance.now();
  debugger;
  const end = performance.now();
  const debuggerDetected = end - start > 100;
  
  return widthThreshold || heightThreshold || debuggerDetected;
}

/**
 * Handle DevTools detection
 */
function handleDevToolsDetection() {
  if (detectDevTools() && !devToolsOpen) {
    devToolsOpen = true;
    onDevToolsOpen();
  } else if (!detectDevTools() && devToolsOpen) {
    devToolsOpen = false;
  }
}

/**
 * Action when DevTools is detected
 */
function onDevToolsOpen() {
  // Clear sensitive data from console
  console.clear();
  
  // Show warning
}

/**
 * Disable keyboard shortcuts
 */
function disableKeyboardShortcuts(e) {
  // F12
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Ctrl+Shift+I (DevTools)
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Ctrl+Shift+J (Console)
  if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Ctrl+Shift+C (Inspect Element)
  if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Ctrl+U (View Source)
  if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Ctrl+S (Save Page)
  if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

/**
 * Disable right-click context menu
 */
function disableContextMenu(e) {
  e.preventDefault();
  return false;
}

/**
 * Disable text selection (optional - can be annoying for users)
 */
function disableSelection(e) {
  // Allow selection in input fields and textareas
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return true;
  }
  e.preventDefault();
  return false;
}

/**
 * Initialize DevTools protection
 * @param {Object} options - Configuration options
 * @param {boolean} options.disableRightClick - Disable right-click menu (default: true)
 * @param {boolean} options.disableKeys - Disable keyboard shortcuts (default: true)
 * @param {boolean} options.detectOpen - Detect DevTools open (default: false, can impact performance)
 * @param {boolean} options.disableTextSelect - Disable text selection (default: false)
 */
export function initDevToolsProtection(options = {}) {
  // Only run in production
  if (!isProduction) {
    return () => {};
  }
  
  const {
    disableRightClick = true,
    disableKeys = true,
    detectOpen = false,
    disableTextSelect = false,
  } = options;
  
  // Disable keyboard shortcuts
  if (disableKeys) {
    document.addEventListener('keydown', disableKeyboardShortcuts, { capture: true });
  }
  
  // Disable right-click
  if (disableRightClick) {
    document.addEventListener('contextmenu', disableContextMenu);
  }
  
  // Disable text selection
  if (disableTextSelect) {
    document.addEventListener('selectstart', disableSelection);
  }
  
  // Periodic DevTools detection (optional, can impact performance)
  if (detectOpen) {
    checkInterval = setInterval(handleDevToolsDetection, 1000);
  }
  
  // Console warning
  onDevToolsOpen();
  
  // Return cleanup function
  return () => {
    if (disableKeys) {
      document.removeEventListener('keydown', disableKeyboardShortcuts, { capture: true });
    }
    if (disableRightClick) {
      document.removeEventListener('contextmenu', disableContextMenu);
    }
    if (disableTextSelect) {
      document.removeEventListener('selectstart', disableSelection);
    }
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  };
}

export default initDevToolsProtection;
