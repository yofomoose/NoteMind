/**
 * Обработчик ошибок для Express
 */
const { HTTP_STATUS } = require('../../shared/constants');
const logger = require('../utils/logger');

/**
 * Middleware для обработки ошибок
 */
const errorHandler = (err, req, res, next) => {
  // Логирование ошибки
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  
  // Определение статус-кода ошибки
  const statusCode = res.statusCode === 200 ? HTTP_STATUS.INTERNAL_SERVER_ERROR : res.statusCode;
  
  // Проверка ошибок MongoDB
  let message = err.message;
  let errors = null;
  
  // Обработка ошибки дубликата (например, email)
  if (err.code === 11000) {
    message = 'Обнаружен дубликат значения уникального поля';
    errors = {
      [Object.keys(err.keyPattern)[0]]: 'Это значение уже используется'
    };
    res.status(HTTP_STATUS.CONFLICT);
  }
  
  // Обработка ошибок валидации Mongoose
  if (err.name === 'ValidationError') {
    message = 'Ошибка валидации данных';
    errors = {};
    
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    
    res.status(HTTP_STATUS.BAD_REQUEST);
  }
  
  // Обработка ошибок CastError MongoDB (например, неверный ID)
  if (err.name === 'CastError') {
    message = `Ресурс с ID ${err.value} не найден`;
    res.status(HTTP_STATUS.NOT_FOUND);
  }
  
  // Обработка ошибок JWT
  if (err.name === 'JsonWebTokenError') {
    message = 'Недействительный токен';
    res.status(HTTP_STATUS.UNAUTHORIZED);
  }
  
  if (err.name === 'TokenExpiredError') {
    message = 'Срок действия токена истек';
    res.status(HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Формирование ответа
  const errorResponse = {
    success: false,
    statusCode: statusCode,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  };
  
  res.status(statusCode).json(errorResponse);
};

module.exports = { errorHandler };