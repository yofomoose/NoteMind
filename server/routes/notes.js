/**
 * Маршруты для работы с заметками
 */
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/noteController');
const { protect, checkNoteAccess } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(protect);

// Маршруты для получения заметок
router.get('/', getNotes);
router.get('/search', searchNotes);
router.get('/tags', getUserTags);
router.get('/:id', checkNoteAccess, getNoteById);

// Маршруты для создания и обновления заметок
router.post('/', createNote);
router.put('/:id', checkNoteAccess, updateNote);
router.patch('/:id/content', checkNoteAccess, updateNoteContent);

// Маршруты для управления корзиной
router.put('/:id/trash', checkNoteAccess, trashNote);
router.put('/:id/restore', checkNoteAccess, restoreNote);

// Маршруты для общего доступа
router.post('/:id/share', checkNoteAccess, shareNote);
router.delete('/:id/share', checkNoteAccess, unshareNote);

// Маршрут для удаления заметки
router.delete('/:id', checkNoteAccess, deleteNote);

module.exports = router;