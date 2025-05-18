/**
 * Маршруты для работы с пользователями
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  uploadAvatar,
  deleteAvatar,
  searchUsers,
  getCollaborators
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Настройка multer для загрузки аватаров
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 2 // 2MB
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

// Маршруты для работы с профилем
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Маршруты для аватара
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);

// Маршруты для статистики
router.get('/stats', getUserStats);

// Маршруты для поиска и списка соавторов
router.get('/search', searchUsers);
router.get('/collaborators', getCollaborators);

module.exports = router;