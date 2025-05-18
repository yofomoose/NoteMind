import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

// Создание контекста
const AuthContext = createContext();

// Хук для использования контекста
export const useAuth = () => {
  return useContext(AuthContext);
};

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Устанавливаем токен для всех запросов axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Проверка наличия токена и получение данных пользователя при загрузке
  useEffect(() => {
    const checkUserAuthenticated = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error('Ошибка аутентификации:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    
    checkUserAuthenticated();
  }, [token]);
  
  // Регистрация пользователя
  const register = async (username, email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('token', response.data.data.token);
      setToken(response.data.data.token);
      setUser(response.data.data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при регистрации';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Вход пользователя
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.data.token);
      setToken(response.data.data.token);
      setUser(response.data.data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при входе';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Выход пользователя
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };
  
  // Запрос на сброс пароля
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при запросе сброса пароля';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Сброс пароля
  const resetPassword = async (resetToken, password) => {
    setError(null);
    try {
      const response = await api.put(`/auth/reset-password/${resetToken}`, { password });
      localStorage.setItem('token', response.data.data.token);
      setToken(response.data.data.token);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при сбросе пароля';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Обновление профиля пользователя
  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await api.put('/users/profile', userData);
      setUser(prevUser => ({ ...prevUser, ...response.data.data }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при обновлении профиля';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Изменение пароля
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при изменении пароля';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Загрузка аватара
  const uploadAvatar = async (file) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUser(prevUser => ({ ...prevUser, avatar: response.data.data.avatar }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при загрузке аватара';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Удаление аватара
  const deleteAvatar = async () => {
    setError(null);
    try {
      const response = await api.delete('/users/avatar');
      setUser(prevUser => ({ ...prevUser, avatar: null }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при удалении аватара';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Получение статистики пользователя
  const getUserStats = async () => {
    setError(null);
    try {
      const response = await api.get('/users/stats');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при получении статистики';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const value = {
    user,
    token,
    isLoading,
    error,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    getUserStats
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};