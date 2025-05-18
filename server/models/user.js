/**
 * Модель пользователя
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/default');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Пожалуйста, укажите имя пользователя'],
    unique: true,
    trim: true,
    minlength: [3, 'Имя пользователя должно содержать минимум 3 символа'],
    maxlength: [30, 'Имя пользователя не может превышать 30 символов']
  },
  email: {
    type: String,
    required: [true, 'Пожалуйста, укажите email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, укажите корректный email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Пожалуйста, укажите пароль'],
    minlength: [6, 'Пароль должен содержать минимум 6 символов'],
    select: false // Не включать пароль в ответы по умолчанию
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'Имя не может превышать 50 символов']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Фамилия не может превышать 50 символов']
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Хеширование пароля перед сохранением
UserSchema.pre('save', async function(next) {
  // Хешируем пароль только если он был изменен
  if (!this.isModified('password')) {
    next();
  }
  
  // Генерация соли и хеширование пароля
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Метод для сравнения паролей
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Метод для генерации JWT
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id },
    config.server.jwtSecret,
    { expiresIn: config.server.jwtExpire }
  );
};

// Метод для генерации токена сброса пароля
UserSchema.methods.generateResetPasswordToken = function() {
  // Генерация случайного токена
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Хеширование токена и установка в поле resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Установка времени истечения токена (10 минут)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Виртуальное поле fullName
UserSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Включение виртуальных полей при преобразовании в JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);