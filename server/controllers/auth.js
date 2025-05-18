/**
 * Контроллер аутентификации
 */
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { HTTP_STATUS } = require('../../shared/constants');
const crypto = require('crypto');
const config = require('../config/default');

/**
 * @desc    Регистрация нового пользователя
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  
  // Проверка, существует ли пользователь с таким email
  const userExists = await User.findOne({ email });
  
  if (userExists) {
    res.status(HTTP_STATUS.CONFLICT);
    throw new Error('Пользователь с таким email уже существует');
  }
  
  // Проверка, существует ли пользователь с таким username
  const usernameExists = await User.findOne({ username });
  
  if (usernameExists) {
    res.status(HTTP_STATUS.CONFLICT);
    throw new Error('Пользователь с таким именем уже существует');
  }
  
  // Создание нового пользователя
  const user = await User.create({
    username,
    email,
    password
  });
  
  if (user) {
    // Генерация JWT токена
    const token = user.generateAuthToken();
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token
      }
    });
  } else {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Неверные данные пользователя');
  }
});

/**
 * @desc    Аутентификация пользователя и получение токена
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Проверка наличия email и пароля
  if (!email || !password) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Пожалуйста, укажите email и пароль');
  }
  
  // Поиск пользователя по email
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED);
    throw new Error('Неверный email или пароль');
  }
  
  // Проверка совпадения пароля
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    res.status(HTTP_STATUS.UNAUTHORIZED);
    throw new Error('Неверный email или пароль');
  }
  
  // Генерация JWT токена
  const token = user.generateAuthToken();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token
    }
  });
});

/**
 * @desc    Получение профиля текущего пользователя
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user уже доступен благодаря middleware protect
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
      avatar: user.avatar,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  });
});

/**
 * @desc    Запрос на сброс пароля
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Инструкции по сбросу пароля отправлены на ваш email'
    });
    return; // Не раскрываем информацию о существовании email
  }
  
  // Генерация токена для сброса пароля
  const resetToken = user.generateResetPasswordToken();
  
  await user.save({ validateBeforeSave: false });
  
  // Здесь должен быть код для отправки email с инструкциями по сбросу пароля
  // В реальном проекте использовать nodemailer или подобные сервисы
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Инструкции по сбросу пароля отправлены на ваш email',
    resetToken: resetToken // В реальном приложении это не отправляется клиенту, а только по email
  });
});

/**
 * @desc    Сброс пароля
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  // Получение и хеширование токена
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');
  
  // Поиск пользователя по токену
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Недействительный токен для сброса пароля');
  }
  
  // Установка нового пароля
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();
  
  // Генерация нового JWT токена
  const token = user.generateAuthToken();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Пароль успешно изменен',
    data: {
      token
    }
  });
});

/**
 * @desc    Обновление данных пользователя
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
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
      avatar: updatedUser.avatar,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role
    }
  });
});

/**
 * @desc    Изменение пароля
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Поиск пользователя с паролем
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Пользователь не найден');
  }
  
  // Проверка текущего пароля
  const isMatch = await user.matchPassword(currentPassword);
  
  if (!isMatch) {
    res.status(HTTP_STATUS.UNAUTHORIZED);
    throw new Error('Неверный текущий пароль');
  }
  
  // Установка нового пароля
  user.password = newPassword;
  await user.save();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Пароль успешно изменен'
  });
});

/**
 * @desc    Выход из системы (только на стороне клиента)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // JWT на стороне сервера нельзя аннулировать, 
  // но можно сообщить клиенту, что выход выполнен успешно
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Выход выполнен успешно'
  });
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  logout
};