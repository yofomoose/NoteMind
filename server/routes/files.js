/**
 * Маршруты для работы с файлами
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadImage,
  deleteImage,
  processImage
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

// Настройка multer для загрузки изображений
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения'), false);
    }
  },
  storage: multer.memoryStorage()
});

// Все маршруты требуют аутентификации
router.use(protect);

// Маршруты для загрузки и управления изображениями
router.post('/upload', upload.single('image'), uploadImage);
router.delete('/:fileName', deleteImage);
router.put('/process', processImage);

module.exports = router;