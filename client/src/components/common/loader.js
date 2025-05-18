import React from 'react';
import './Loader.css';

/**
 * Компонент индикатора загрузки
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.fullScreen - Флаг для отображения на весь экран
 * @param {string} props.size - Размер индикатора ('small', 'medium', 'large')
 * @param {string} props.color - Цвет индикатора
 */
const Loader = ({ fullScreen = false, size = 'medium', color = 'primary' }) => {
  // Классы для разных размеров
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };
  
  // Классы для разных цветов
  const colorClasses = {
    primary: 'loader-primary',
    secondary: 'loader-secondary',
    white: 'loader-white'
  };
  
  // Формируем классы компонента
  const loaderClass = `loader ${sizeClasses[size] || 'loader-medium'} ${colorClasses[color] || 'loader-primary'}`;
  
  // Если нужен индикатор на весь экран
  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className={loaderClass}>
          <div className="loader-spinner"></div>
        </div>
      </div>
    );
  }
  
  // Обычный индикатор
  return (
    <div className={loaderClass}>
      <div className="loader-spinner"></div>
    </div>
  );
};

export default Loader;