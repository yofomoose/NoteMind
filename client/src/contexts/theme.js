import React, { createContext, useState, useContext, useEffect } from 'react';

// Создание контекста
const ThemeContext = createContext();

// Хук для использования контекста
export const useTheme = () => {
  return useContext(ThemeContext);
};

// Провайдер контекста
export const ThemeProvider = ({ children }) => {
  // Получаем сохраненную тему из localStorage или используем 'light' по умолчанию
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  
  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Функция для переключения темы
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode: theme === 'dark'
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};