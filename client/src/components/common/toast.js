import React from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../contexts/ToastContext';
import './Toast.css';

/**
 * Компонент для отображения уведомлений
 */
const Toast = () => {
  const { toasts, removeToast } = useToast();
  
  // Если нет уведомлений, ничего не отображаем
  if (toasts.length === 0) {
    return null;
  }
  
  // Создаем портал для отображения уведомлений в конце DOM
  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type}`}
        >
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
          </div>
          <button 
            className="toast-close" 
            onClick={() => removeToast(toast.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>,
    document.getElementById('portal')
  );
};

export default Toast;