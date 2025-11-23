import React, { useEffect } from 'react';

export default function ToastNotification({ message, type = 'info', visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const baseStyles = 'fixed right-4 top-4 max-w-xs w-full p-4 rounded shadow-md flex items-center space-x-3 z-50';
  const typeStyles = {
    success: 'bg-green-100 text-green-800 border border-green-400',
    error: 'bg-red-100 text-red-800 border border-red-400',
    info: 'bg-blue-100 text-blue-800 border border-blue-400',
  };

  return (
    <div className={baseStyles + ' ' + (typeStyles[type] || typeStyles.info)} role="alert">
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={onClose}
        className="font-bold text-xl focus:outline-none"
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
}
