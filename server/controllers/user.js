/**
 * Контроллер для работы с пользователями
 */
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Note = require('../models/Note');
const { HTTP_STATUS } = require('../../shared/constants');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const config = require('../config/default');

/**
 * @desc    Получение профиля пользователя
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Пользователь не найден');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

/**
 * @desc    Обновление профиля пользователя
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, username } = req.body;
  
  // Проверка, если пользователь хочет изменить username
  if (username && username !== req.user.username) {
    const usernameExists = await User.findOne({ username });
    
    if (usernameExists) {
      res.status(HTTP_STATUS.CONFLICT);
      throw new Error('Пользователь с таким именем уже существует');
    }
  }
  
  // Обновление профиля
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        username: username || req.user.username
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!updatedUser) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Пользователь не найден');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      avatar: updatedUser.avatar,
      role: updatedUser.role
    }
  });
});

/**
 * @desc    Получение статистики пользователя
 * @route   GET /api/users/stats
 * @access  Private
 */
const getUserStats = asyncHandler(async (req, res) => {
  // Получение количества заметок пользователя
  const notesCount = await Note.countDocuments({ userId: req.user._id });
  
  // Получение количества активных заметок
  const activeNotesCount = await Note.countDocuments({ userId: req.user._id, status: 'active' });
  
  // Получение количества заметок в корзине
  const trashedNotesCount = await Note.countDocuments({ userId: req.user._id, status: 'trashed' });
  
  // Получение количества заметок, к которым предоставлен общий доступ
  const sharedByMeCount = await Note.countDocuments({ 
    userId: req.user._id,
    'shared.0': { $exists: true }
  });
  
  // Получение количества заметок, к которым пользователь имеет доступ
  const sharedWithMeCount = await Note.countDocuments({ 
    'shared.userId': req.user._id
  });
  
  // Получение размера всех заметок (приблизительно)
  const notesSize = await Note.aggregate([
    { 
      $match: { userId: req.user._id } 
    },
    {
      $project: {
        contentSize: { $strLenCP: '$content' }
      }
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$contentSize' }
      }
    }
  ]);
  
  const totalNotesSize = notesSize.length > 0 ? notesSize[0].totalSize : 0;
  
  // Получение даты создания самой старой заметки
  const oldestNote = await Note.findOne({ userId: req.user._id })
    .sort({ createdAt: 1 })
    .limit(1);
  
  // Получение даты создания самой новой заметки
  const newestNote = await Note.findOne({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(1);
  
  // Получение количества тегов
  const tags = await Note.aggregate([
    { 
      $match: { userId: req.user._id } 
    },
    {
      $unwind: '$tags'
    },
    {
      $group: {
        _id: '$tags'
      }
    },
    {
      $count: 'tagsCount'
    }
  ]);
  
  const tagsCount = tags.length > 0 ? tags[0].tagsCount : 0;
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      notesCount,
      activeNotesCount,
      trashedNotesCount,
      sharedByMeCount,
      sharedWithMeCount,
      totalNotesSize,
      firstNoteDate: oldestNote ? oldestNote.createdAt : null,
      lastNoteDate: newestNote ? newestNote.createdAt : null,
      tagsCount
    }
  });
});

/**
 * @desc    Загрузка аватара пользователя
 * @route   POST /api/users/avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Пожалуйста, загрузите изображение');
  }
  
  // Создаем папку для аватаров, если она не существует
  const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }
  
  // Формирование имени файла
  const fileName = `avatar-${req.user._id}-${Date.now()}${path.extname(req.file.originalname)}`;
  const filePath = path.join(avatarDir, fileName);
  
  try {
    // Обработка изображения (изменение размера и оптимизация)
    await sharp(req.file.buffer)
      .resize(200, 200)
      .jpeg({ quality: 90 })
      .toFile(filePath);
    
    // Удаление старого аватара, если он существует
    const user = await User.findById(req.user._id);
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar.replace(/^\//, ''));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Обновление пути к аватару в базе данных
    const avatarUrl = `/uploads/avatars/${fileName}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    // Удаляем загруженный файл в случае ошибки
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    throw new Error(`Ошибка при обработке изображения: ${error.message}`);
  }
});

/**
 * @desc    Удаление аватара пользователя
 * @route   DELETE /api/users/avatar
 * @access  Private
 */
const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Пользователь не найден');
  }
  
  // Проверка, есть ли аватар
  if (!user.avatar) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Аватар отсутствует');
  }
  
  // Удаление файла аватара
  const avatarPath = path.join(__dirname, '..', user.avatar.replace(/^\//, ''));
  if (fs.existsSync(avatarPath)) {
    fs.unlinkSync(avatarPath);
  }
  
  // Обновление пользователя в базе данных
  await User.findByIdAndUpdate(req.user._id, { avatar: null });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Аватар успешно удален'
  });
});

/**
 * @desc    Поиск пользователей для совместного доступа к заметкам
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { query, limit = 10 } = req.query;
  
  if (!query) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Поисковый запрос обязателен');
  }
  
  // Поиск пользователей по имени пользователя или email
  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } }, // Исключаем текущего пользователя
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .limit(parseInt(limit))
  .select('_id username email avatar'); // Выбираем только нужные поля
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: users
  });
});

/**
 * @desc    Получение списка пользователей, с которыми есть общий доступ
 * @route   GET /api/users/collaborators
 * @access  Private
 */
const getCollaborators = asyncHandler(async (req, res) => {
  // Находим все заметки, к которым текущий пользователь предоставил доступ
  const sharedNotes = await Note.find({
    userId: req.user._id,
    'shared.0': { $exists: true }
  })
  .select('shared');
  
  // Извлекаем уникальные ID пользователей
  const userIds = new Set();
  
  sharedNotes.forEach(note => {
    note.shared.forEach(share => {
      userIds.add(share.userId.toString());
    });
  });
  
  // Получаем информацию о пользователях
  const collaborators = await User.find({ _id: { $in: Array.from(userIds) } })
    .select('_id username email avatar');
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: collaborators
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  uploadAvatar,
  deleteAvatar,
  searchUsers,
  getCollaborators
};