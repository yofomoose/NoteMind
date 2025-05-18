/**
 * Общие константы для клиента и сервера
 */

// WebSocket события
const WS_EVENTS = {
  // События подключения
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // События заметок
  NOTE_CREATED: 'note:created',
  NOTE_UPDATED: 'note:updated',
  NOTE_DELETED: 'note:deleted',
  NOTE_CONTENT_UPDATED: 'note:content_updated',
  
  // События совместного редактирования
  JOIN_NOTE: 'join:note',
  LEAVE_NOTE: 'leave:note',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  
  // События для курсоров пользователей
  CURSOR_POSITION: 'cursor:position',
  
  // События синхронизации
  SYNC_REQUEST: 'sync:request',
  SYNC_RESPONSE: 'sync:response',
  
  // События ошибок
  ERROR: 'error'
};

// Константы для маршрутов API
const API_ROUTES = {
  // Маршруты аутентификации
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Маршруты для заметок
  NOTES: {
    BASE: '/api/notes',
    BY_ID: '/api/notes/:id',
    SHARED: '/api/notes/:id/share',
    UNSHARED: '/api/notes/:id/unshare',
    TAGS: '/api/notes/:id/tags',
    SEARCH: '/api/notes/search',
    TRASH: '/api/notes/trash',
    RESTORE: '/api/notes/:id/restore',
  },
  
  // Маршруты для пользователей
  USERS: {
    BASE: '/api/users',
    BY_ID: '/api/users/:id',
    PROFILE: '/api/users/profile',
    AVATAR: '/api/users/avatar',
  },
  
  // Маршруты для файлов и изображений
  FILES: {
    UPLOAD: '/api/files/upload',
    BY_ID: '/api/files/:id',
  },
};

// Типы заметок
const NOTE_TYPES = {
  TEXT: 'text',
  MARKDOWN: 'markdown',
  CANVAS: 'canvas',
  LIST: 'list',
  TABLE: 'table',
};

// Статусы заметок
const NOTE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  TRASHED: 'trashed',
};

// Роли пользователей для доступа к заметкам
const NOTE_ACCESS_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

// HTTP коды состояния
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Максимальное количество символов для заголовка заметки
const MAX_TITLE_LENGTH = 100;

module.exports = {
  WS_EVENTS,
  API_ROUTES,
  NOTE_TYPES,
  NOTE_STATUS,
  NOTE_ACCESS_ROLES,
  HTTP_STATUS,
  MAX_TITLE_LENGTH
};