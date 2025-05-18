import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Страницы
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import NotePage from './pages/NotePage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Компоненты
import Loader from './components/common/Loader';
import Toast from './components/common/Toast';

// Стили
import './App.css';

function App() {
  const { isLoading, user } = useAuth();
  const { theme } = useTheme();
  
  // Установка темы для всего документа
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  if (isLoading) {
    return <Loader fullScreen />;
  }
  
  return (
    <div className="app">
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPasswordPage />} />
        <Route path="/reset-password/:resetToken" element={user ? <Navigate to="/" /> : <ResetPasswordPage />} />
        
        {/* Защищенные маршруты */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/notes/:noteId" element={<ProtectedRoute><NotePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        
        {/* Страница 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Глобальный компонент для уведомлений */}
      <Toast />
    </div>
  );
}

export default App;