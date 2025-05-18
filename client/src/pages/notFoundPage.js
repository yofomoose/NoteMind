import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Страница не найдена</h2>
        
        <p className="not-found-message">
          Упс! Страница, которую вы ищете, не существует или была перемещена.
        </p>
        
        <div className="not-found-actions">
          <Button
            variant="primary"
            as={Link}
            to={user ? '/' : '/login'}
          >
            {user ? 'Вернуться на главную' : 'Вернуться на страницу входа'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;