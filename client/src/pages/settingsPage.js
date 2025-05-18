import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from '../components/sidebar/Sidebar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { changePassword, getUserStats, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Загрузка статистики пользователя
  const loadUserStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      error('Ошибка при загрузке статистики');
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // Загрузка статистики при монтировании компонента
  React.useEffect(() => {
    loadUserStats();
  }, []);
  
  // Обработчик изменения полей формы
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Сброс ошибок при изменении поля
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };
  
  // Валидация формы смены пароля
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Текущий пароль обязателен';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Новый пароль обязателен';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Обработчик изменения пароля
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      success('Пароль успешно изменен');
      
      // Сброс формы
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      error(err.message || 'Ошибка при изменении пароля');
      console.error(err);
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Обработчик выхода из системы
  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      try {
        await logout();
        navigate('/login');
      } catch (err) {
        error('Ошибка при выходе из системы');
        console.error(err);
      }
    }
  };
  
  // Возврат на главную страницу
  const handleBack = () => {
    navigate('/');
  };
  
  return (
    <div className="settings-page">
      <Sidebar />
      
      <main className="settings-page-main">
        <div className="settings-page-header">
          <Button 
            variant="text" 
            onClick={handleBack}
          >
            ← Назад
          </Button>
          <h1>Настройки</h1>
        </div>
        
        <div className="settings-page-content">
          <div className="settings-section">
            <h2>Персонализация</h2>
            <div className="settings-option">
              <div className="settings-option-info">
                <h3>Тема</h3>
                <p>Переключение между светлой и темной темой интерфейса.</p>
              </div>
              <div className="settings-option-action">
                <Button 
                  variant="outline"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Безопасность</h2>
            <div className="settings-option">
              <div className="settings-option-info">
                <h3>Изменение пароля</h3>
                <p>Регулярно меняйте пароль для повышения безопасности аккаунта.</p>
              </div>
              <div className="settings-option-form">
                <form onSubmit={handleChangePassword}>
                  <Input
                    label="Текущий пароль"
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.currentPassword}
                    required
                  />
                  
                  <Input
                    label="Новый пароль"
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.newPassword}
                    required
                  />
                  
                  <Input
                    label="Подтверждение нового пароля"
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.confirmPassword}
                    required
                  />
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isChangingPassword}
                    isLoading={isChangingPassword}
                  >
                    Изменить пароль
                  </Button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Статистика использования</h2>
            <div className="settings-stats">
              {isLoadingStats ? (
                <div className="settings-stats-loading">Загрузка статистики...</div>
              ) : stats ? (
                <div className="settings-stats-grid">
                  <div className="settings-stat-card">
                    <div className="settings-stat-value">{stats.notesCount || 0}</div>
                    <div className="settings-stat-label">Заметок</div>
                  </div>
                  
                  <div className="settings-stat-card">
                    <div className="settings-stat-value">{stats.tagsCount || 0}</div>
                    <div className="settings-stat-label">Тегов</div>
                  </div>
                  
                  <div className="settings-stat-card">
                    <div className="settings-stat-value">{stats.sharedByMeCount || 0}</div>
                    <div className="settings-stat-label">Общих заметок</div>
                  </div>
                  
                  <div className="settings-stat-card">
                    <div className="settings-stat-value">{stats.sharedWithMeCount || 0}</div>
                    <div className="settings-stat-label">Доступно от других</div>
                  </div>
                </div>
              ) : (
                <div className="settings-stats-error">Не удалось загрузить статистику</div>
              )}
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Аккаунт</h2>
            <div className="settings-option">
              <div className="settings-option-info">
                <h3>Управление профилем</h3>
                <p>Изменение личной информации и настройка профиля.</p>
              </div>
              <div className="settings-option-action">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  Перейти к профилю
                </Button>
              </div>
            </div>
            
            <div className="settings-option">
              <div className="settings-option-info">
                <h3>Выход из системы</h3>
                <p>Безопасно завершить текущую сессию.</p>
              </div>
              <div className="settings-option-action">
                <Button 
                  variant="secondary"
                  onClick={handleLogout}
                >
                  Выйти
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;