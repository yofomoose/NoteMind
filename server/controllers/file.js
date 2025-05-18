/**
 * Контроллер для работы с файлами и изображениями
 */
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/default');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * @desc    Загрузка изображения
 * @route   POST /api/files/upload
 * @access  Private
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Пожалуйста, загрузите изображение');
  }
  
  // Создаем папку для изображений, если она не существует
  const imageDir = path.join(__dirname, '..', 'uploads', 'images');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  // Формирование имени файла
  const fileName = `image-${req.user._id}-${uuidv4()}${path.extname(req.file.originalname)}`;
  const filePath = path.join(imageDir, fileName);
  
  try {
    // Обработка изображения (оптимизация)
    await sharp(req.file.buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);
    
    // Получение информации о размерах изображения
    const metadata = await sharp(filePath).metadata();
    
    // URL для доступа к изображению
    const imageUrl = `/uploads/images/${fileName}`;
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        id: uuidv4(),
        src: imageUrl,
        title: req.file.originalname,
        width: metadata.width,
        height: metadata.height,
        size: fs.statSync(filePath).size,
        createdAt: Date.now()
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
 * @desc    Удаление изображения
 * @route   DELETE /api/files/:fileName
 * @access  Private
 */
const deleteImage = asyncHandler(async (req, res) => {
  const fileName = req.params.fileName;
  
  // Проверка, что файл принадлежит пользователю (по префиксу имени)
  if (!fileName.startsWith(`image-${req.user._id}`)) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('У вас нет прав для удаления этого изображения');
  }
  
  const filePath = path.join(__dirname, '..', 'uploads', 'images', fileName);
  
  // Проверка существования файла
  if (!fs.existsSync(filePath)) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Изображение не найдено');
  }
  
  // Удаление файла
  fs.unlinkSync(filePath);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Изображение успешно удалено'
  });
});

/**
 * @desc    Обработка изображения (изменение размера, поворот и т.д.)
 * @route   PUT /api/files/process
 * @access  Private
 */
const processImage = asyncHandler(async (req, res) => {
  const { src, width, height, rotation } = req.body;
  
  if (!src) {
    res.status(HTTP_STATUS.BAD_REQUEST);
    throw new Error('Исходное изображение обязательно');
  }
  
  // Извлечение имени файла из URL
  const fileName = path.basename(src);
  
  // Проверка, что файл принадлежит пользователю (по префиксу имени)
  if (!fileName.startsWith(`image-${req.user._id}`)) {
    res.status(HTTP_STATUS.FORBIDDEN);
    throw new Error('У вас нет прав для обработки этого изображения');
  }
  
  const filePath = path.join(__dirname, '..', 'uploads', 'images', fileName);
  
  // Проверка существования файла
  if (!fs.existsSync(filePath)) {
    res.status(HTTP_STATUS.NOT_FOUND);
    throw new Error('Изображение не найдено');
  }
  
  // Формирование нового имени файла
  const newFileName = `image-${req.user._id}-${uuidv4()}${path.extname(fileName)}`;
  const newFilePath = path.join(__dirname, '..', 'uploads', 'images', newFileName);
  
  try {
    // Применение операций к изображению
    let imageProcessor = sharp(filePath);
    
    // Изменение размера, если указаны параметры
    if (width && height) {
      imageProcessor = imageProcessor.resize(parseInt(width), parseInt(height));
    }
    
    // Поворот, если указан параметр
    if (rotation) {
      imageProcessor = imageProcessor.rotate(parseInt(rotation));
    }
    
    // Сохранение обработанного изображения
    await imageProcessor.toFile(newFilePath);
    
    // Получение информации о размерах нового изображения
    const metadata = await sharp(newFilePath).metadata();
    
    // URL для доступа к новому изображению
    const newImageUrl = `/uploads/images/${newFileName}`;
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        id: uuidv4(),
        src: newImageUrl,
        title: path.basename(fileName, path.extname(fileName)),
        width: metadata.width,
        height: metadata.height,
        size: fs.statSync(newFilePath).size,
        createdAt: Date.now()
      }
    });
  } catch (error) {
    // Удаляем новый файл в случае ошибки
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath);
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    throw new Error(`Ошибка при обработке изображения: ${error.message}`);
  }
});

module.exports = {
  uploadImage,
  deleteImage,
  processImage
};