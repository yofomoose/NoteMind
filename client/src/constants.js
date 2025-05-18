/**
 * Константы для клиентской части приложения
 */

// WebSocket события
export const WS_EVENTS = {
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
export const API_ROUTES = {
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
export const NOTE_TYPES = {
  TEXT: 'text',
  MARKDOWN: 'markdown',
  CANVAS: 'canvas',
  LIST: 'list',
  TABLE: 'table',
};

// Статусы заметок
export const NOTE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  TRASHED: 'trashed',
};

// Роли пользователей для доступа к заметкам
export const NOTE_ACCESS_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

// Цвета для тегов
export const TAG_COLORS = [
  { name: 'gray', value: '#6B7280' },
  { name: 'red', value: '#EF4444' },
  { name: 'yellow', value: '#F59E0B' },
  { name: 'green', value: '#10B981' },
  { name: 'blue', value: '#3B82F6' },
  { name: 'indigo', value: '#6366F1' },
  { name: 'purple', value: '#8B5CF6' },
  { name: 'pink', value: '#EC4899' },
];

// Начальное содержимое для новой заметки
export const DEFAULT_NOTE_CONTENT = `# Новая заметка

Это новая заметка. Вы можете начать писать прямо здесь!

## Форматирование

Вы можете использовать Markdown для форматирования:

- **Жирный текст**
- *Курсивный текст*
- ~~Зачеркнутый текст~~
- [Ссылки](https://example.com)

## Списки

- Элемент 1
- Элемент 2
  - Вложенный элемент
  
1. Нумерованный элемент 1
2. Нумерованный элемент 2

## Цитаты

> Это цитата.
> 
> Она может быть многострочной.

## Код

\`\`\`javascript
// Пример кода
function hello() {
  console.log('Привет, мир!');
}
\`\`\`

---

Приятного использования NoteMind!`;

// Начальное содержимое для новой заметки типа Canvas
export const DEFAULT_CANVAS_CONTENT = JSON.stringify({
  version: '1.0',
  objects: [],
  background: '#ffffff'
});

// Размеры для редактора изображений
export const IMAGE_EDITOR_SIZES = [
  { name: 'Маленький', width: 200, height: 150 },
  { name: 'Средний', width: 400, height: 300 },
  { name: 'Большой', width: 800, height: 600 },
  { name: 'Оригинальный', width: null, height: null }
];