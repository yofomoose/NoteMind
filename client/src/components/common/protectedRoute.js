import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loader from './Loader';

/**
 * Компонент для защиты маршрутов, требующих аутентификации
 */
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // Показываем индикатор загрузки, пока проверяем аутентификацию
  if (isLoading) {
    return <Loader fullScreen />;
  }
  
  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Если пользователь аутентифицирован, отображаем защищенный контент
  return children;
};

export default ProtectedRoute;