/**
 * Модель пользователя
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Пожалуйста, укажите имя пользователя'],
    unique: true,
    trim: true,
    minlength: [3, 'Имя пользователя должно содержать не менее 3 символов'],
    maxlength: [30, 'Имя пользователя не должно превышать 30 символов']
  },
  email: {
    type: String,
    required: [true, 'Пожалуйста, укажите email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, укажите корректный email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Пожалуйста, укажите пароль'],
    minlength: [6, 'Пароль должен содержать не менее 6 символов'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: [500, 'Биография не должна превышать 500 символов']
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
  }
});

// Хэширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Создание JWT токена
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Проверка пароля
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);