import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const { error, success } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Обработчик изменения email
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError('');
  };
  
  // Валидация email
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email обязателен');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Некорректный формат email');
      return false;
    }
    return true;
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await forgotPassword(email);
      success('Инструкции по восстановлению пароля отправлены на ваш email');
      setEmailSent(true);
    } catch (err) {
      error(err.message || 'Ошибка при запросе сброса пароля');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Если email отправлен, показываем соответствующее сообщение
  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Проверьте вашу почту</h1>
            <p className="auth-subtitle">
              Мы отправили инструкции по восстановлению пароля на адрес {email}.
              Пожалуйста, проверьте вашу электронную почту.
            </p>
          </div>
          
          <div className="auth-form">
            <div className="auth-success">
              Если вы не получили письмо, проверьте папку "Спам" или запросите 
              восстановление пароля ещё раз.
            </div>
            
            <Button
              variant="outline"
              fullWidth
              onClick={() => setEmailSent(false)}
            >
              Запросить ещё раз
            </Button>
          </div>
          
          <div className="auth-footer">
            <p>
              Вспомнили пароль? <Link to="/login">Войти</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Форма запроса восстановления пароля
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Восстановление пароля</h1>
          <p className="auth-subtitle">
            Введите ваш email, и мы отправим вам инструкции для сброса пароля.
          </p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Введите ваш email"
            error={emailError}
            required
          />
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            isLoading={isLoading}
          >
            Восстановить пароль
          </Button>
        </form>
        
        <div className="auth-footer">
          <p>
            Вспомнили пароль? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;