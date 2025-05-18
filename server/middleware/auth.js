/**
 * Middleware для аутентификации и авторизации
 */
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const config = require('../config/default');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Защита маршрутов - проверка токена доступа
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Проверка наличия токена в заголовке Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];
      
      // Проверяем токен
      const decoded = jwt.verify(token, config.server.jwtSecret);
      
      // Находим пользователя по ID из токена, исключая пароль
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED);
        throw new Error('Пользователь не найден');
      }
      
      next();
    } catch (error) {
      res.status(HTTP_STATUS.UNAUTHORIZED);
      throw new Error('Не авторизован, токен недействителен');
    }
  }
  
  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED);
    throw new Error('Не авторизован, токен отсутствует');
  }
});

/**
 * Проверка роли пользователя
 * @param {string[]} roles - Массив разрешенных ролей
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED);
      throw new Error('Не авторизован');
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(HTTP_STATUS.FORBIDDEN);
      throw new Error('Недостаточно прав для выполнения действия');
    }
    
    next();
  };
};

/**
 * Проверка доступа пользователя к заметке
 */
const checkNoteAccess = asyncHandler(async (req, res, next) => {
  const noteId = req.params.id;
  const userId = req.user.id;
  
  // Здесь будет логика проверки доступа пользователя к заметке
  // Для реализации в будущем после создания модели Note
  
  next();
});

module.exports = {
  protect,
  authorize,
  checkNoteAccess,
};