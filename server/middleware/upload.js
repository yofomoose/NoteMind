/**
 * Middleware для загрузки файлов
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/default');
const { HTTP_STATUS } = require('../../shared/constants');

// Создаем директорию для загрузки, если она не существует
const uploadDir = path.join(__dirname, '..', config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = config.upload.allowedFileTypes;
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Неподдерживаемый тип файла. Разрешены только: ${allowedFileTypes.join(', ')}`), false);
  }
};

// Инициализация Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize // Максимальный размер файла
  }
});

// Middleware для обработки ошибок загрузки
const handleUploadErrors = (req, res, next) => {
  return (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Файл слишком большой. Максимальный размер: ${config.upload.maxFileSize / 1000000} МБ`
        });
      }
    }
    
    if (err) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  };
};

module.exports = {
  upload,
  handleUploadErrors
};