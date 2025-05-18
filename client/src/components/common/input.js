import React, { forwardRef } from 'react';
import './Input.css';

/**
 * Компонент поля ввода
 * @param {Object} props - Свойства компонента
 * @param {string} props.label - Метка поля
 * @param {string} props.type - Тип поля ввода
 * @param {string} props.id - Идентификатор поля
 * @param {string} props.name - Имя поля
 * @param {string} props.value - Значение поля
 * @param {function} props.onChange - Обработчик изменения
 * @param {string} props.placeholder - Текст-подсказка
 * @param {string} props.error - Текст ошибки
 * @param {boolean} props.required - Флаг обязательного поля
 * @param {boolean} props.disabled - Флаг отключения поля
 * @param {string} props.size - Размер поля ('sm', 'md', 'lg')
 * @param {string} props.className - Дополнительные классы
 */
const Input = forwardRef(({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  ...rest
}, ref) => {
  // Формируем классы для поля ввода
  const inputClass = `
    input
    input-${size}
    ${error ? 'input-error' : ''}
    ${disabled ? 'input-disabled' : ''}
    ${className}
  `.trim();
  
  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClass}
        {...rest}
      />
      
      {error && <div className="input-error-message">{error}</div>}
    </div>
  );
});

export default Input;