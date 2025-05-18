/**
 * Общие типы и интерфейсы для клиента и сервера
 * Используем JSDoc для типизации в JavaScript
 */

/**
 * @typedef {Object} User
 * @property {string} id - Уникальный идентификатор пользователя
 * @property {string} username - Имя пользователя
 * @property {string} email - Email пользователя
 * @property {string} [avatar] - URL аватара пользователя (опционально)
 * @property {string} [firstName] - Имя пользователя (опционально)
 * @property {string} [lastName] - Фамилия пользователя (опционально)
 * @property {Date} createdAt - Дата создания пользователя
 * @property {Date} updatedAt - Дата последнего обновления пользователя
 */

/**
 * @typedef {Object} Note
 * @property {string} id - Уникальный идентификатор заметки
 * @property {string} title - Заголовок заметки
 * @property {string} content - Содержимое заметки
 * @property {string} type - Тип заметки (text, markdown, canvas, list, table)
 * @property {string} status - Статус заметки (active, archived, trashed)
 * @property {string} userId - ID пользователя, создавшего заметку
 * @property {string[]} [tags] - Теги заметки (опционально)
 * @property {string[]} [links] - ID связанных заметок (опционально)
 * @property {NoteAccess[]} [shared] - Информация о доступе к заметке (опционально)
 * @property {Image[]} [images] - Изображения в заметке (опционально)
 * @property {Date} createdAt - Дата создания заметки
 * @property {Date} updatedAt - Дата последнего обновления заметки
 */

/**
 * @typedef {Object} NoteAccess
 * @property {string} userId - ID пользователя, имеющего доступ
 * @property {string} role - Роль пользователя (owner, editor, viewer)
 * @property {Date} grantedAt - Дата предоставления доступа
 */

/**
 * @typedef {Object} Image
 * @property {string} id - Уникальный идентификатор изображения
 * @property {string} src - URL или Base64 изображения
 * @property {string} [title] - Название изображения (опционально)
 * @property {number} width - Ширина изображения
 * @property {number} height - Высота изображения
 * @property {number} [rotation] - Поворот изображения в градусах (опционально)
 * @property {Object[]} [annotations] - Аннотации на изображении (опционально)
 */

/**
 * @typedef {Object} Tag
 * @property {string} id - Уникальный идентификатор тега
 * @property {string} name - Название тега
 * @property {string} [color] - Цвет тега (опционально)
 * @property {string} userId - ID пользователя, создавшего тег
 */

/**
 * @typedef {Object} CursorPosition
 * @property {string} userId - ID пользователя
 * @property {number} x - Позиция X курсора
 * @property {number} y - Позиция Y курсора
 * @property {string} [noteId] - ID заметки, в которой находится курсор
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} [query] - Поисковый запрос
 * @property {string[]} [tags] - Фильтр по тегам
 * @property {string} [status] - Фильтр по статусу
 * @property {string} [type] - Фильтр по типу заметки
 * @property {string} [startDate] - Фильтр по дате (от)
 * @property {string} [endDate] - Фильтр по дате (до)
 * @property {number} [page] - Номер страницы
 * @property {number} [limit] - Количество элементов на странице
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Флаг успешности запроса
 * @property {number} statusCode - HTTP код состояния
 * @property {string} [message] - Сообщение (опционально)
 * @property {Object|Array} [data] - Данные ответа (опционально)
 * @property {Object} [error] - Объект ошибки (опционально)
 * @property {Object} [meta] - Метаданные для пагинации и др. (опционально)
 */

/**
 * @typedef {Object} WebSocketMessage
 * @property {string} type - Тип сообщения
 * @property {Object} [payload] - Данные сообщения (опционально)
 * @property {string} [noteId] - ID заметки, к которой относится сообщение (опционально)
 * @property {string} [userId] - ID пользователя, отправившего сообщение (опционально)
 * @property {Date} timestamp - Временная метка сообщения
 */

module.exports = {
  // Этот файл используется в основном для документации
};