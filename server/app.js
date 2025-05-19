const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createServer } = require('http');
const connectDB = require('./config/db');
const { setupWebSocket } = require('./services/webSocketService');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Загрузка переменных окружения
dotenv.config();

// Подключение к базе данных
connectDB();

// Инициализация приложения Express
const app = express();
const httpServer = createServer(app);

// Настройка WebSocket
setupWebSocket(httpServer);

// Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Безопасность
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем для разработки, в продакшене настроить
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : 'http://localhost:3000',
  credentials: true,
}));

// Парсинг JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

// Маршруты API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/files', require('./routes/files'));

// Проверка работоспособности сервера
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Обработка ошибок
app.use(errorHandler);

// Порт сервера
const PORT = process.env.PORT || 5000;

// Запуск сервера
httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});