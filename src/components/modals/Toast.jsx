import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ toasts, onClose }) => {
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;
    // Set timers for each toast
    toasts.forEach((toast, idx) => {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, 3000 + idx * 300); // 300ms delay between each toast
      return () => clearTimeout(timer);
    });
  }, [toasts, onClose]);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-notification${toast.type ? ` toast-${toast.type}` : ''}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
