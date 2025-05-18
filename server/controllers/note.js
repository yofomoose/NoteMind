/**
 * Контроллер для работы с заметками
 */
const asyncHandler = require('express-async-handler');
const Note = require('../models/Note');
const User = require('../models/User');
const { HTTP_STATUS, NOTE_STATUS, NOTE_ACCESS_ROLES } = require('../../shared/constants');
const mongoose = require('mongoose');
const { io } = require('../services/webSocketService');

/**
 * @desc    Получение всех заметок пользователя
 * @route   GET /api/notes
 * @access  Private
 */
const getNotes = asyncHandler(async (req, res) => {
  // Параметры запроса (фильтрация, сортировка, пагинация)
  const { status, type, tag, parent, search, sortBy = 'updatedAt', sortDir = 'desc', page = 1, limit = 20 } = req.query;
  
  // Базовый фильтр - только заметки текущего пользователя или с общим доступом
  const filter = {
    $or: [
      { userId: req.user._id },
      { 'shared.userId': req.user._id }
    ]
  };
  
  // Фильтр по статусу
  if (status) {
    filter.status = status;
  } else {
    // По умолчанию возвращаем только активные заметки
    filter.status = NOTE_STATUS.ACTIVE;
  }
  
  // Фильтр по типу
  if (type) {
    filter.type = type;
  }
  
  // Фильтр по тегу
  if (tag) {
    filter.tags = tag;
  }
  
  // Фильтр по родительской заметке (для иерархии)
  if (parent) {
    filter.parent = parent === 'null' ? null : parent;
  }
  
  // Поиск по тексту
  if (search) {
    filter.$text = { $search: search };
  }
  
  // Настройка сортировки
  const sort = {};
  sort[sortBy] = sortDir === 'asc' ? 1 : -1;
  
  // Пагинация
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  
  // Получение общего количества заметок
  const total = await Note.countDocuments(filter);
  
  // Получение заметок с применением фильтров, сортировки и пагинации
  const notes = await Note.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate({
      path: 'userId',
      select: 'username avatar'
    })
    .populate({
      path: 'shared.userId',
      select: 'username avatar'
    });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: notes,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * @desc    Получение заметки по ID
 * @route   GET /api/notes/:id
 * @access  Private
 */
const getNoteById = asyncHandler(async (req, res) => {
  // Проверка валидности ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки по ID
  const note = await Note.findById(req.params.id)
    .populate({
      path: 'userId',
      select: 'username avatar'
    })
    .populate({
      path: 'shared.userId',
      select: 'username avatar'
    })
    .populate({
      path: 'links',
      select: 'title'
    });
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка доступа к заметке
  const isOwner = note.userId._id.toString() === req.user._id.toString();
  const isShared = note.shared.some(share => 
    share.userId._id.toString() === req.user._id.toString()
  );
  
  if (!isOwner && !isShared) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('У вас нет доступа к этой заметке');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: note
  });
});

/**
 * @desc    Создание новой заметки
 * @route   POST /api/notes
 * @access  Private
 */
const createNote = asyncHandler(async (req, res) => {
  const { title, content, type, tags, parent, isFolder, position } = req.body;
  
  // Создание новой заметки
  const note = await Note.create({
    title,
    content: content || '',
    type,
    tags: tags || [],
    userId: req.user._id,
    parent,
    isFolder: isFolder || false,
    position: position || 0
  });
  
  if (!note) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Ошибка при создании заметки');
  }
  
  // Оповещение через WebSocket
  io.emit(`user:${req.user._id}:note-created`, { noteId: note._id });
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: note
  });
});

/**
 * @desc    Обновление заметки
 * @route   PUT /api/notes/:id
 * @access  Private
 */
const updateNote = asyncHandler(async (req, res) => {
  // Проверка валидности ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа
  const isOwner = note.userId.toString() === req.user._id.toString();
  const isEditor = note.shared.some(share => 
    share.userId.toString() === req.user._id.toString() && 
    share.role === NOTE_ACCESS_ROLES.EDITOR
  );
  
  if (!isOwner && !isEditor) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('У вас нет прав для редактирования этой заметки');
  }
  
  // Подготовка данных для обновления
  const updateData = {};
  
  // Поля, которые можно обновить
  const allowedFields = ['title', 'content', 'type', 'tags', 'links', 'images', 'parent', 'isFolder', 'position'];
  
  // Добавляем в updateData только те поля, которые пришли в запросе
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });
  
  // Обновляем дату изменения
  updateData.updatedAt = Date.now();
  
  // Обновление заметки
  const updatedNote = await Note.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  
  if (!updatedNote) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Ошибка при обновлении заметки');
  }
  
  // Оповещение через WebSocket
  io.to(req.params.id).emit('note:updated', { 
    noteId: updatedNote._id,
    updatedBy: req.user._id,
    updateData
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: updatedNote
  });
});

/**
 * @desc    Обновление контента заметки (отдельный эндпоинт для совместного редактирования)
 * @route   PATCH /api/notes/:id/content
 * @access  Private
 */
const updateNoteContent = asyncHandler(async (req, res) => {
  // Проверка валидности ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  const { content, cursorPosition } = req.body;
  
  if (content === undefined) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Контент заметки обязателен');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа
  const isOwner = note.userId.toString() === req.user._id.toString();
  const isEditor = note.shared.some(share => 
    share.userId.toString() === req.user._id.toString() && 
    share.role === NOTE_ACCESS_ROLES.EDITOR
  );
  
  if (!isOwner && !isEditor) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('У вас нет прав для редактирования этой заметки');
  }
  
  // Обновление только контента
  const updatedNote = await Note.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { 
        content,
        updatedAt: Date.now()
      }
    },
    { new: true }
  );
  
  if (!updatedNote) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Ошибка при обновлении контента заметки');
  }
  
  // Оповещение через WebSocket о изменении контента
  io.to(req.params.id).emit('note:content-updated', { 
    noteId: updatedNote._id,
    updatedBy: req.user._id,
    content,
    cursorPosition
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      _id: updatedNote._id,
      content: updatedNote.content,
      updatedAt: updatedNote.updatedAt
    }
  });
});

/**
 * @desc    Перемещение заметки в корзину (изменение статуса)
 * @route   PUT /api/notes/:id/trash
 * @access  Private
 */
const trashNote = asyncHandler(async (req, res) => {
  // Проверка валидности ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа (только владелец может отправить в корзину)
  if (note.userId.toString() !== req.user._id.toString()) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('Только владелец может перемещать заметки в корзину');
  }
  
  // Обновление статуса заметки
  const updatedNote = await Note.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { 
        status: NOTE_STATUS.TRASHED,
        updatedAt: Date.now()
      }
    },
    { new: true }
  );
  
  if (!updatedNote) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Ошибка при перемещении заметки в корзину');
  }
  
  // Оповещение через WebSocket
  io.to(req.params.id).emit('note:trashed', { 
    noteId: updatedNote._id,
    updatedBy: req.user._id
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Заметка перемещена в корзину',
    data: updatedNote
  });
});

/**
 * @desc    Восстановление заметки из корзины
 * @route   PUT /api/notes/:id/restore
 * @access  Private
 */
const restoreNote = asyncHandler(async (req, res) => {
  // Проверка валидности ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа (только владелец может восстановить)
  if (note.userId.toString() !== req.user._id.toString()) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('Только владелец может восстанавливать заметки');
  }
  
  // Проверка, что заметка в корзине
  if (note.status !== NOTE_STATUS.TRASHED) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Заметка не находится в корзине');
  }
  
  // Обновление статуса заметки
  const updatedNote = await Note.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { 
        status: NOTE_STATUS.ACTIVE,
        updatedAt: Date.now()
      }
    },
    { new: true }
  );
  
  if (!updatedNote) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Ошибка при восстановлении заметки');
  }
  
  // Оповещение через WebSocket
  io.to(req.params.id).emit('note:restored', { 
    noteId: updatedNote._id,
    updatedBy: req.user._id
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Заметка восстановлена',
    data: updatedNote
  });
});

/**
 * @desc    Полное удаление заметки
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
const deleteNote = asyncHandler(async (req, res) => {
  // Проверка валидности ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа (только владелец может удалить)
  if (note.userId.toString() !== req.user._id.toString()) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('Только владелец может удалять заметки');
  }
  
  // Удаление заметки
  await note.deleteOne();
  
  // Оповещение через WebSocket
  io.emit(`user:${req.user._id}:note-deleted`, { noteId: req.params.id });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Заметка успешно удалена',
    data: { id: req.params.id }
  });
});

/**
 * @desc    Предоставление доступа к заметке другому пользователю
 * @route   POST /api/notes/:id/share
 * @access  Private
 */
const shareNote = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  
  if (!userId) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('ID пользователя обязателен');
  }
  
  // Проверка роли
  if (role && !Object.values(NOTE_ACCESS_ROLES).includes(role)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Недопустимая роль');
  }
  
  // Проверка валидности ID заметки
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа (только владелец может предоставлять доступ)
  if (note.userId.toString() !== req.user._id.toString()) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('Только владелец может предоставлять доступ к заметке');
  }
  
  // Проверка, что пользователь не предоставляет доступ самому себе
  if (userId === req.user._id.toString()) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Нельзя предоставить доступ самому себе');
  }
  
  // Проверка существования пользователя, которому предоставляется доступ
  const userExists = await User.findById(userId);
  
  if (!userExists) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Пользователь, которому предоставляется доступ, не найден');
  }
  
  // Проверка, не предоставлен ли уже доступ
  const alreadyShared = note.shared.some(share => share.userId.toString() === userId);
  
  if (alreadyShared) {
    // Обновление роли, если заметка уже доступна пользователю
    await Note.updateOne(
      { 
        _id: req.params.id,
        'shared.userId': userId 
      },
      { 
        $set: { 
          'shared.$.role': role || NOTE_ACCESS_ROLES.VIEWER,
          updatedAt: Date.now()
        }
      }
    );
  } else {
    // Добавление нового пользователя к общему доступу
    await Note.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          shared: {
            userId,
            role: role || NOTE_ACCESS_ROLES.VIEWER,
            grantedAt: Date.now()
          }
        },
        $set: { updatedAt: Date.now() }
      }
    );
  }
  
  // Получение обновленной заметки
  const updatedNote = await Note.findById(req.params.id)
    .populate({
      path: 'userId',
      select: 'username avatar'
    })
    .populate({
      path: 'shared.userId',
      select: 'username avatar'
    });
  
  // Оповещение через WebSocket
  io.to(req.params.id).emit('note:shared', { 
    noteId: updatedNote._id,
    sharedWith: userId,
    role: role || NOTE_ACCESS_ROLES.VIEWER,
    sharedBy: req.user._id
  });
  
  // Также отправляем уведомление пользователю, которому предоставлен доступ
  io.to(userId).emit('note:shared-with-you', {
    noteId: updatedNote._id,
    noteTitle: updatedNote.title,
    sharedBy: req.user._id,
    role: role || NOTE_ACCESS_ROLES.VIEWER
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: alreadyShared ? 'Роль пользователя обновлена' : 'Доступ предоставлен',
    data: updatedNote
  });
});

/**
 * @desc    Отмена общего доступа к заметке для пользователя
 * @route   DELETE /api/notes/:id/share
 * @access  Private
 */
const unshareNote = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('ID пользователя обязателен');
  }
  
  // Проверка валидности ID заметки
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверный формат ID заметки');
  }
  
  // Получение заметки для проверки доступа
  const note = await Note.findById(req.params.id);
  
  if (!note) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Заметка не найдена');
  }
  
  // Проверка прав доступа (только владелец может отменять доступ)
  if (note.userId.toString() !== req.user._id.toString()) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('Только владелец может отменять доступ к заметке');
  }
  
  // Проверка, предоставлен ли доступ пользователю
  const isShared = note.shared.some(share => share.userId.toString() === userId);
  
  if (!isShared) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Пользователю не предоставлен доступ к этой заметке');
  }
  
  // Удаление пользователя из списка общего доступа
  await Note.findByIdAndUpdate(
    req.params.id,
    { 
      $pull: { shared: { userId } },
      $set: { updatedAt: Date.now() }
    }
  );
  
  // Получение обновленной заметки
  const updatedNote = await Note.findById(req.params.id)
    .populate({
      path: 'userId',
      select: 'username avatar'
    })
    .populate({
      path: 'shared.userId',
      select: 'username avatar'
    });
  
  // Оповещение через WebSocket
  io.to(req.params.id).emit('note:unshared', { 
    noteId: updatedNote._id,
    unsharedWith: userId,
    unsharedBy: req.user._id
  });
  
  // Также отправляем уведомление пользователю, у которого отозван доступ
  io.to(userId).emit('note:unshared-with-you', {
    noteId: updatedNote._id,
    noteTitle: updatedNote.title,
    unsharedBy: req.user._id
  });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Доступ отменен',
    data: updatedNote
  });
});

/**
 * @desc    Поиск заметок
 * @route   GET /api/notes/search
 * @access  Private
 */
const searchNotes = asyncHandler(async (req, res) => {
  const { query, tags, status = NOTE_STATUS.ACTIVE, page = 1, limit = 20 } = req.query;
  
  // Базовый фильтр - только заметки текущего пользователя или с общим доступом
  const filter = {
    $or: [
      { userId: req.user._id },
      { 'shared.userId': req.user._id }
    ],
    status
  };
  
  // Поиск по тексту
  if (query) {
    filter.$text = { $search: query };
  }
  
  // Фильтр по тегам
  if (tags) {
    const tagArray = tags.split(',');
    filter.tags = { $all: tagArray };
  }
  
  // Пагинация
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  
  // Получение общего количества найденных заметок
  const total = await Note.countDocuments(filter);
  
  // Расчет релевантности для поиска по тексту
  const searchOptions = query ? { score: { $meta: 'textScore' } } : {};
  const sortOptions = query ? { score: { $meta: 'textScore' } } : { updatedAt: -1 };
  
  // Получение заметок с применением фильтров, сортировки и пагинации
  const notes = await Note.find(filter, searchOptions)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .populate({
      path: 'userId',
      select: 'username avatar'
    });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: notes,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * @desc    Получение всех тегов пользователя
 * @route   GET /api/notes/tags
 * @access  Private
 */
const getUserTags = asyncHandler(async (req, res) => {
  // Получение всех заметок пользователя
  const userNotes = await Note.find({
    $or: [
      { userId: req.user._id },
      { 'shared.userId': req.user._id }
    ],
    status: NOTE_STATUS.ACTIVE
  });
  
  // Извлечение всех уникальных тегов
  const allTags = userNotes.reduce((tags, note) => {
    return [...tags, ...note.tags];
  }, []);
  
  // Подсчет количества заметок для каждого тега
  const tagCounts = allTags.reduce((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
  
  // Преобразование в массив объектов для удобства использования
  const uniqueTags = Object.keys(tagCounts).map(tag => ({
    name: tag,
    count: tagCounts[tag]
  }));
  
  // Сортировка по количеству заметок (по убыванию)
  uniqueTags.sort((a, b) => b.count - a.count);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: uniqueTags
  });
});

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  updateNoteContent,
  trashNote,
  restoreNote,
  deleteNote,
  shareNote,
  unshareNote,
  searchNotes,
  getUserTags
};