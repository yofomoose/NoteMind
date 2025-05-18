import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Создание контекста
const ToastContext = createContext();

// Хук для использования контекста
export const useToast = () => {
  return useContext(ToastContext);
};

// Провайдер контекста
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  // Добавление нового уведомления
  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = uuidv4();
    
    const newToast = {
      id,
      message,
      type,
      duration
    };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    // Автоматическое удаление уведомления после истечения времени
    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);
  
  // Удаление уведомления
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);
  
  // Добавление уведомления об успехе
  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);
  
  // Добавление уведомления об ошибке
  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);
  
  // Добавление информационного уведомления
  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);
  
  // Добавление предупреждающего уведомления
  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);
  
  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  };
  
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};