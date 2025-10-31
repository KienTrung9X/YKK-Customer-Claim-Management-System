import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from './Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5" />,
    error: <XCircleIcon className="w-5 h-5" />,
    info: <AlertTriangleIcon className="w-5 h-5" />
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${styles[type]} min-w-[300px] max-w-md`}>
        {icons[type]}
        <span className="flex-1 font-medium">{message}</span>
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="hover:opacity-80">
          <XCircleIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </>
  );
};
