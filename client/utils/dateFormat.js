/**
 * Утилиты для работы с датами
 */
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирование даты в относительном виде
 * @param {string|Date} date - Дата для форматирования
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированная дата
 */
export const formatRelativeDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: ru,
    ...options
  });
};

/**
 * Форматирование даты в заданном формате
 * @param {string|Date} date - Дата для форматирования
 * @param {string} formatStr - Строка формата
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированная дата
 */
export const formatDate = (date, formatStr = 'dd.MM.yyyy', options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return format(dateObj, formatStr, {
    locale: ru,
    ...options
  });
};

/**
 * Форматирование даты и времени
 * @param {string|Date} date - Дата для форматирования
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированная дата и время
 */
export const formatDateTime = (date, options = {}) => {
  return formatDate(date, 'dd.MM.yyyy HH:mm', options);
};

/**
 * Простое форматирование даты (день, месяц, год)
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} - Отформатированная дата
 */
export const formatSimpleDate = (date) => {
  return formatDate(date, 'dd MMM yyyy');
};

/**
 * Преобразование строки ISO даты в объект Date
 * @param {string} isoString - Строка с датой в формате ISO
 * @returns {Date} - Объект Date
 */
export const fromISOString = (isoString) => {
  if (!isoString) return null;
  return parseISO(isoString);
};

/**
 * Проверка, истек ли срок действия даты
 * @param {string|Date} date - Дата для проверки
 * @returns {boolean} - Флаг истечения срока
 */
export const isExpired = (date) => {
  if (!date) return true;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
};