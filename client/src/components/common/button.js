import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

/**
 * Универсальный компонент кнопки
 * @param {Object} props - Свойства компонента
 * @param {string} props.variant - Вариант кнопки ('primary', 'secondary', 'outline', 'text')
 * @param {string} props.size - Размер кнопки ('sm', 'md', 'lg')
 * @param {boolean} props.fullWidth - Флаг для растягивания на всю ширину
 * @param {boolean} props.disabled - Флаг отключения кнопки
 * @param {boolean} props.isLoading - Флаг отображения индикатора загрузки
 * @param {string} props.to - URL для Link (если нужна навигация)
 * @param {string} props.type - Тип кнопки для форм ('button', 'submit', 'reset')
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  to = null,
  type = 'button',
  className = '',
  onClick,
  ...rest
}) => {
  // Формируем классы для кнопки
  const buttonClass = `
    btn
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full-width' : ''}
    ${disabled || isLoading ? 'btn-disabled' : ''}
    ${className}
  `.trim();
  
  // Контент кнопки с учетом состояния загрузки
  const buttonContent = isLoading ? (
    <>
      <span className="btn-spinner"></span>
      <span className="btn-loading-text">{children}</span>
    </>
  ) : (
    children
  );
  
  // Если указан URL, рендерим как Link
  if (to) {
    return (
      <Link
        to={to}
        className={buttonClass}
        {...rest}
      >
        {buttonContent}
      </Link>
    );
  }
  
  // Иначе рендерим как обычную кнопку
  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...rest}
    >
      {buttonContent}
    </button>
  );
};

export default Button;