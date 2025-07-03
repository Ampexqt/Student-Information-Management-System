/**
 * Toast Component - Notification System
 * 
 * This component provides a toast notification system for displaying
 * temporary messages to users. It supports multiple toast types and
 * automatic dismissal with staggered timing.
 * 
 * Key Features:
 * - Multiple toast types (success, error, warning, info)
 * - Automatic dismissal after 3 seconds
 * - Staggered timing for multiple toasts (300ms delay between each)
 * - Modal and non-modal display modes
 * - Stacked display for multiple notifications
 * - Smooth animations and transitions
 * 
 * Toast Types:
 * - success: Green notification for successful actions
 * - error: Red notification for error messages
 * - warning: Yellow notification for warnings
 * - info: Blue notification for informational messages
 * 
 * Usage:
 * <Toast 
 *   toasts={[{ id: '1', message: 'Success!', type: 'success' }]} 
 *   onClose={(id) => removeToast(id)} 
 * />
 */

import React, { useEffect } from 'react';
import './Toast.css';

/**
 * Toast notification component
 * @param {Array} toasts - Array of toast objects with id, message, and optional type
 * @param {Function} onClose - Callback function to remove a toast by ID
 * @param {boolean} modal - Whether toasts should be displayed in modal mode
 */
const Toast = ({ toasts, onClose, modal }) => {
  /**
   * Effect hook to handle automatic toast dismissal
   * Sets timers for each toast with staggered timing to prevent overlap
   */
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;
    
    // Set timers for each toast with staggered timing
    toasts.forEach((toast, idx) => {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, 3000 + idx * 300); // 3 seconds base + 300ms delay between each toast
      
      // Cleanup timer on unmount or dependency change
      return () => clearTimeout(timer);
    });
  }, [toasts, onClose]);

  // Don't render anything if no toasts
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={modal ? 'modal-toast-stack' : 'toast-stack'}>
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast-notification${toast.type ? ` toast-${toast.type}` : ''}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
