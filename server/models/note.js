/**
 * Модель заметки
 */
const mongoose = require('mongoose');
const { NOTE_TYPES, NOTE_STATUS, NOTE_ACCESS_ROLES } = require('../../shared/constants');
const config = require('../config/default');

// Схема для отслеживания доступа к заметке
const NoteAccessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: Object.values(NOTE_ACCESS_ROLES),
    default: NOTE_ACCESS_ROLES.VIEWER
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
});

// Схема для изображений в заметке
const ImageSchema = new mongoose.Schema({
  src: {
    type: String,
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 200
  },
  rotation: {
    type: Number,
    default: 0
  },
  annotations: {
    type: Array,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Основная схема заметки
const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Пожалуйста, укажите заголовок заметки'],
    trim: true,
    maxlength: [config.noteSettings.maxTitleLength, `Заголовок не может превышать ${config.noteSettings.maxTitleLength} символов`]
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: Object.values(NOTE_TYPES),
    default: NOTE_TYPES.MARKDOWN
  },
  status: {
    type: String,
    enum: Object.values(NOTE_STATUS),
    default: NOTE_STATUS.ACTIVE
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= config.noteSettings.maxTagsPerNote;
      },
      message: `Заметка не может содержать более ${config.noteSettings.maxTagsPerNote} тегов`
    }
  },
  links: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  shared: [NoteAccessSchema],
  images: [ImageSchema],
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: null
  },
  isFolder: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Индексы для повышения производительности
NoteSchema.index({ userId: 1 });
NoteSchema.index({ tags: 1 });
NoteSchema.index({ title: 'text', content: 'text' });
NoteSchema.index({ 'shared.userId': 1 });

// Предобработка перед удалением - удаление связей
NoteSchema.pre('remove', async function(next) {
  // Удаление связей с удаляемой заметкой из других заметок
  await this.model('Note').updateMany(
    { links: this._id },
    { $pull: { links: this._id } }
  );
  
  next();
});

module.exports = mongoose.model('Note', NoteSchema);