import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from '../components/sidebar/Sidebar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, uploadAvatar, deleteAvatar } = useAuth();
  const { success, error } = useToast();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const fileInputRef = useRef(null);
  
  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Сброс ошибок при изменении поля
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      errors.username = 'Имя пользователя должно содержать минимум 3 символа';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateProfile(formData);
      success('Профиль успешно обновлен');
    } catch (err) {
      error(err.message || 'Ошибка при обновлении профиля');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Обработчик клика на кнопку загрузки аватара
  const handleAvatarButtonClick = () => {
    fileInputRef.current.click();
  };
  
  // Обработчик загрузки аватара
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      error('Пожалуйста, выберите изображение');
      return;
    }
    
    // Проверка размера файла (макс. 2 МБ)
    if (file.size > 2 * 1024 * 1024) {
      error('Размер файла не должен превышать 2 МБ');
      return;
    }
    
    setIsUploadingAvatar(true);
    
    try {
      await uploadAvatar(file);
      success('Аватар успешно загружен');
    } catch (err) {
      error(err.message || 'Ошибка при загрузке аватара');
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
      // Сброс значения поля ввода файла
      fileInputRef.current.value = '';
    }
  };
  
  // Обработчик удаления аватара
  const handleDeleteAvatar = async () => {
    if (!user.avatar) return;
    
    if (window.confirm('Вы уверены, что хотите удалить аватар?')) {
      try {
        await deleteAvatar();
        success('Аватар успешно удален');
      } catch (err) {
        error(err.message || 'Ошибка при удалении аватара');
        console.error(err);
      }
    }
  };
  
  // Возврат на главную страницу
  const handleBack = () => {
    navigate('/');
  };
  
  return (
    <div className="profile-page">
      <Sidebar />
      
      <main className="profile-page-main">
        <div className="profile-page-header">
          <Button 
            variant="text" 
            onClick={handleBack}
          >
            ← Назад
          </Button>
          <h1>Настройки профиля</h1>
        </div>
        
        <div className="profile-page-content">
          <div className="profile-card">
            <div className="avatar-section">
              <div className="avatar-container">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {isUploadingAvatar && (
                  <div className="avatar-loading">
                    <div className="avatar-loading-spinner"></div>
                  </div>
                )}
              </div>
              
              <div className="avatar-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarButtonClick}
                  disabled={isUploadingAvatar}
                >
                  Изменить аватар
                </Button>
                {user.avatar && (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            </div>
            
            <form className="profile-form" onSubmit={handleSubmit}>
              <Input
                label="Имя пользователя"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={formErrors.username}
                required
              />
              
              <Input
                label="Имя"
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              
              <Input
                label="Фамилия"
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
              
              <div className="profile-form-footer">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdating}
                  isLoading={isUpdating}
                >
                  Сохранить изменения
                </Button>
              </div>
            </form>
          </div>
          
          <div className="profile-info">
            <div className="profile-info-group">
              <label>Email</label>
              <div className="profile-info-value">{user.email}</div>
            </div>
            
            <div className="profile-info-group">
              <label>Дата регистрации</label>
              <div className="profile-info-value">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="profile-actions">
              <Button
                variant="secondary"
                onClick={() => navigate('/settings')}
              >
                Настройки аккаунта
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;