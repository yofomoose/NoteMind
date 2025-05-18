/**
 * Конфигурационный файл приложения
 */
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Настройки по умолчанию
const config = {
  // Настройки сервера
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'super_secret_key_change_in_production',
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Настройки базы данных
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/notemind',
  },

  // Настройки WebSocket
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  },

  // Настройки для загрузки файлов
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000, // 5MB по умолчанию
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // Redis-настройки (опционально)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // Настройки для AWS S3 (опционально для продакшена)
  s3: {
    accessKey: process.env.AWS_ACCESS_KEY,
    secretKey: process.env.AWS_SECRET_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
  },

  // Лимиты для API
  rateLimits: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // Лимит запросов на IP
  },

  // Ограничения для заметок
  noteSettings: {
    maxTitleLength: 100,
    maxTagsPerNote: 10,
  },
};

module.exports = config;