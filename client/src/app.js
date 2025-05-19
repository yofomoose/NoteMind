import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Страницы
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/Dashboard';
import NotePage from './pages/NotePage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';

// Компоненты
import ProtectedRoute from './components/common/ProtectedRoute';
import Toast from './components/common/Toast';

// Стили
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Защищенные маршруты */}
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/notes/:id" element={<ProtectedRoute><NotePage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              
              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toast />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;