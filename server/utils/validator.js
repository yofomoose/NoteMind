/**
 * Утилита для валидации данных
 */

/**
 * Валидация email
 * @param {string} email - Адрес электронной почты
 * @returns {boolean} - Результат валидации
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Валидация пароля
 * Пароль должен содержать минимум 6 символов, включая хотя бы одну цифру,
 * одну заглавную и одну строчную букву
 * @param {string} password - Пароль
 * @returns {boolean} - Результат валидации
 */
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
  return passwordRegex.test(password);
};

/**
 * Валидация имени пользователя
 * Имя пользователя должно содержать только буквы, цифры и символы подчеркивания
 * @param {string} username - Имя пользователя
 * @returns {boolean} - Результат валидации
 */
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Валидация MongoDB ID
 * @param {string} id - ID для проверки
 * @returns {boolean} - Результат валидации
 */
const isValidMongoId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
  return mongoIdRegex.test(id);
};

/**
 * Валидация заголовка заметки
 * @param {string} title - Заголовок заметки
 * @param {number} maxLength - Максимальная длина (по умолчанию 100)
 * @returns {boolean} - Результат валидации
 */
const isValidNoteTitle = (title, maxLength = 100) => {
  return title && title.trim().length > 0 && title.length <= maxLength;
};

/**
 * Проверка массива тегов
 * @param {string[]} tags - Массив тегов
 * @param {number} maxCount - Максимальное количество тегов
 * @returns {boolean} - Результат валидации
 */
const isValidTags = (tags, maxCount = 10) => {
  if (!Array.isArray(tags)) {
    return false;
  }
  
  if (tags.length > maxCount) {
    return false;
  }
  
  // Проверка каждого тега
  return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0);
};

/**
 * Проверка URL изображения
 * @param {string} url - URL изображения
 * @returns {boolean} - Результат валидации
 */
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Проверка на локальный URL изображения
  if (url.startsWith('/uploads/')) {
    return true;
  }
  
  // Проверка на внешний URL
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    return validProtocols.includes(urlObj.protocol);
  } catch (e) {
    return false;
  }
};

/**
 * Очистка и экранирование пользовательского ввода для предотвращения XSS
 * @param {string} input - Пользовательский ввод
 * @returns {string} - Очищенная строка
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidMongoId,
  isValidNoteTitle,
  isValidTags,
  isValidImageUrl,
  sanitizeInput
};