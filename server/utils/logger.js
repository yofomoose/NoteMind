/**
 * Утилита для логирования
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Используем path.join для кросс-платформенных путей
const logDir = path.join(__dirname, '..', 'logs');

// Создаем директорию с правильными правами
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { 
    recursive: true,
    mode: 0o755 // Правильные права доступа для Linux
  });
}

// Настройка форматов для логов
const { format } = winston;
const logFormat = format.printf(
  ({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  }
);

// Создание логгера
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Вывод логов в консоль
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    // Сохранение логов в файлы
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

module.exports = logger;