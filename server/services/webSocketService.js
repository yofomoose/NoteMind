/**
 * Сервис WebSocket для совместного редактирования
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Note = require('../models/note');
const { WS_EVENTS, NOTE_ACCESS_ROLES } = require('../../shared/constants');
const config = require('../config/default');
const logger = require('../utils/logger');

// Глобальный объект для доступа к io из других модулей
let io;

/**
 * Настройка WebSocket сервера
 * @param {Object} httpServer - HTTP сервер Express
 */
const setupWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.socket.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Middleware для аутентификации пользователей
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Аутентификация не выполнена'));
      }
      
      // Проверка JWT токена
      const decoded = jwt.verify(token, config.server.jwtSecret);
      
      // Поиск пользователя
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Пользователь не найден'));
      }
      
      // Сохранение данных пользователя в объекте сокета
      socket.user = {
        id: user._id.toString(),
        username: user.username,
        avatar: user.avatar
      };
      
      next();
    } catch (error) {
      logger.error(`WebSocket аутентификация: ${error.message}`);
      next(new Error('Ошибка аутентификации'));
    }
  });
  
  // Обработка подключений
  io.on(WS_EVENTS.CONNECT, (socket) => {
    logger.info(`WebSocket: Клиент подключен (userId: ${socket.user.id})`);
    
    // Присоединяем пользователя к его личному каналу
    socket.join(`user:${socket.user.id}`);
    
    // Обработка присоединения к комнате заметки
    socket.on(WS_EVENTS.JOIN_NOTE, async ({ noteId }) => {
      try {
        // Проверка доступа к заметке
        const note = await Note.findById(noteId);
        
        if (!note) {
          socket.emit(WS_EVENTS.ERROR, { message: 'Заметка не найдена' });
          return;
        }
        
        // Проверка, имеет ли пользователь доступ к заметке
        const isOwner = note.userId.toString() === socket.user.id;
        const isShared = note.shared.some(share => 
          share.userId.toString() === socket.user.id
        );
        
        if (!isOwner && !isShared) {
          socket.emit(WS_EVENTS.ERROR, { message: 'У вас нет доступа к этой заметке' });
          return;
        }
        
        // Присоединение к комнате заметки
        socket.join(noteId);
        
        // Уведомление всех в комнате о присоединении пользователя
        socket.to(noteId).emit(WS_EVENTS.USER_JOINED, {
          noteId,
          user: {
            id: socket.user.id,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        });
        
        logger.info(`WebSocket: Пользователь ${socket.user.id} присоединился к заметке ${noteId}`);
      } catch (error) {
        logger.error(`WebSocket JOIN_NOTE: ${error.message}`);
        socket.emit(WS_EVENTS.ERROR, { message: 'Ошибка при присоединении к заметке' });
      }
    });
    
    // Обработка покидания комнаты заметки
    socket.on(WS_EVENTS.LEAVE_NOTE, ({ noteId }) => {
      socket.leave(noteId);
      
      // Уведомление всех в комнате о том, что пользователь покинул заметку
      socket.to(noteId).emit(WS_EVENTS.USER_LEFT, {
        noteId,
        userId: socket.user.id
      });
      
      logger.info(`WebSocket: Пользователь ${socket.user.id} покинул заметку ${noteId}`);
    });
    
    // Обработка обновлений контента заметки
    socket.on(WS_EVENTS.NOTE_CONTENT_UPDATED, async ({ noteId, content, cursorPosition }) => {
      try {
        // Проверка, присоединен ли пользователь к комнате заметки
        if (!socket.rooms.has(noteId)) {
          socket.emit(WS_EVENTS.ERROR, { message: 'Вы не присоединены к этой заметке' });
          return;
        }
        
        // Проверка доступа к редактированию
        const note = await Note.findById(noteId);
        
        if (!note) {
          socket.emit(WS_EVENTS.ERROR, { message: 'Заметка не найдена' });
          return;
        }
        
        const isOwner = note.userId.toString() === socket.user.id;
        const isEditor = note.shared.some(share => 
          share.userId.toString() === socket.user.id && 
          share.role === NOTE_ACCESS_ROLES.EDITOR
        );
        
        if (!isOwner && !isEditor) {
          socket.emit(WS_EVENTS.ERROR, { message: 'У вас нет прав для редактирования этой заметки' });
          return;
        }
        
        // Обновление контента заметки в базе данных
        await Note.findByIdAndUpdate(
          noteId,
          { 
            $set: { 
              content,
              updatedAt: Date.now()
            }
          }
        );
        
        // Отправка обновлений остальным участникам
        socket.to(noteId).emit(WS_EVENTS.NOTE_CONTENT_UPDATED, {
          noteId,
          content,
          cursorPosition,
          updatedBy: socket.user.id
        });
      } catch (error) {
        logger.error(`WebSocket NOTE_CONTENT_UPDATED: ${error.message}`);
        socket.emit(WS_EVENTS.ERROR, { message: 'Ошибка при обновлении контента заметки' });
      }
    });
    
    // Обработка позиции курсора
    socket.on(WS_EVENTS.CURSOR_POSITION, ({ noteId, position }) => {
      // Проверка, присоединен ли пользователь к комнате заметки
      if (!socket.rooms.has(noteId)) {
        return;
      }
      
      // Отправка позиции курсора остальным участникам
      socket.to(noteId).emit(WS_EVENTS.CURSOR_POSITION, {
        noteId,
        userId: socket.user.id,
        position
      });
    });
    
    // Обработка запроса синхронизации
    socket.on(WS_EVENTS.SYNC_REQUEST, async ({ noteId }) => {
      try {
        // Проверка, присоединен ли пользователь к комнате заметки
        if (!socket.rooms.has(noteId)) {
          socket.emit(WS_EVENTS.ERROR, { message: 'Вы не присоединены к этой заметке' });
          return;
        }
        
        // Получение актуальной версии заметки
        const note = await Note.findById(noteId);
        
        if (!note) {
          socket.emit(WS_EVENTS.ERROR, { message: 'Заметка не найдена' });
          return;
        }
        
        // Отправка актуальной версии запрашивающему клиенту
        socket.emit(WS_EVENTS.SYNC_RESPONSE, {
          noteId,
          content: note.content,
          updatedAt: note.updatedAt
        });
      } catch (error) {
        logger.error(`WebSocket SYNC_REQUEST: ${error.message}`);
        socket.emit(WS_EVENTS.ERROR, { message: 'Ошибка при синхронизации заметки' });
      }
    });
    
    // Обработка отключения клиента
    socket.on(WS_EVENTS.DISCONNECT, () => {
      logger.info(`WebSocket: Клиент отключен (userId: ${socket.user.id})`);
      
      // Уведомление всех комнат, в которых был пользователь
      // Для этого нам нужно получить все комнаты, в которых был пользователь,
      // кроме его личного канала и стандартной комнаты
      const rooms = Array.from(socket.rooms).filter(room => 
        room !== socket.id && !room.startsWith('user:')
      );
      
      rooms.forEach(noteId => {
        socket.to(noteId).emit(WS_EVENTS.USER_LEFT, {
          noteId,
          userId: socket.user.id
        });
      });
    });
  });
  
  return io;
};

module.exports = {
  setupWebSocket,
  get io() {
    if (!io) {
      throw new Error('WebSocket сервер не инициализирован');
    }
    return io;
  }
};