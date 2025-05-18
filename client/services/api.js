/**
 * Настройка Axios и API-клиента
 */
import axios from 'axios';
import { API_ROUTES } from '../constants';

// Базовый URL для API
const API_URL = process.env.REACT_APP_API_URL || '';

// Создание экземпляра axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем токен из localStorage к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработка ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Если ошибка 401 Unauthorized, удаляем токен и перенаправляем на страницу входа
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * API для работы с аутентификацией
 */
export const authApi = {
  // Регистрация пользователя
  register: (userData) => {
    return api.post(API_ROUTES.AUTH.REGISTER, userData);
  },
  
  // Вход пользователя
  login: (credentials) => {
    return api.post(API_ROUTES.AUTH.LOGIN, credentials);
  },
  
  // Выход пользователя
  logout: () => {
    return api.post(API_ROUTES.AUTH.LOGOUT);
  },
  
  // Получение данных текущего пользователя
  getCurrentUser: () => {
    return api.get(API_ROUTES.AUTH.ME);
  },
  
  // Запрос на сброс пароля
  forgotPassword: (email) => {
    return api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
  },
  
  // Сброс пароля
  resetPassword: (resetToken, password) => {
    return api.put(`${API_ROUTES.AUTH.RESET_PASSWORD}/${resetToken}`, { password });
  },
  
  // Обновление профиля пользователя
  updateProfile: (userData) => {
    return api.put('/api/users/profile', userData);
  },
  
  // Изменение пароля
  changePassword: (passwords) => {
    return api.put('/api/auth/change-password', passwords);
  }
};

/**
 * API для работы с заметками
 */
export const noteApi = {
  // Получение списка заметок
  getNotes: (params) => {
    return api.get(API_ROUTES.NOTES.BASE, { params });
  },
  
  // Получение заметки по ID
  getNoteById: (noteId) => {
    return api.get(`/api/notes/${noteId}`);
  },
  
  // Создание новой заметки
  createNote: (noteData) => {
    return api.post(API_ROUTES.NOTES.BASE, noteData);
  },
  
  // Обновление заметки
  updateNote: (noteId, noteData) => {
    return api.put(`/api/notes/${noteId}`, noteData);
  },
  
  // Обновление контента заметки (для совместного редактирования)
  updateNoteContent: (noteId, content) => {
    return api.patch(`/api/notes/${noteId}/content`, { content });
  },
  
  // Перемещение заметки в корзину
  trashNote: (noteId) => {
    return api.put(`/api/notes/${noteId}/trash`);
  },
  
  // Восстановление заметки из корзины
  restoreNote: (noteId) => {
    return api.put(`/api/notes/${noteId}/restore`);
  },
  
  // Удаление заметки
  deleteNote: (noteId) => {
    return api.delete(`/api/notes/${noteId}`);
  },
  
  // Предоставление доступа к заметке
  shareNote: (noteId, userId, role) => {
    return api.post(`/api/notes/${noteId}/share`, { userId, role });
  },
  
  // Отмена доступа к заметке
  unshareNote: (noteId, userId) => {
    return api.delete(`/api/notes/${noteId}/share`, { data: { userId } });
  },
  
  // Поиск заметок
  searchNotes: (params) => {
    return api.get('/api/notes/search', { params });
  },
  
  // Получение тегов пользователя
  getUserTags: () => {
    return api.get('/api/notes/tags');
  }
};

/**
 * API для работы с пользователями
 */
export const userApi = {
  // Получение профиля пользователя
  getProfile: () => {
    return api.get('/api/users/profile');
  },
  
  // Обновление профиля пользователя
  updateProfile: (userData) => {
    return api.put('/api/users/profile', userData);
  },
  
  // Получение статистики пользователя
  getUserStats: () => {
    return api.get('/api/users/stats');
  },
  
  // Загрузка аватара
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return api.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Удаление аватара
  deleteAvatar: () => {
    return api.delete('/api/users/avatar');
  },
  
  // Поиск пользователей (для совместного доступа)
  searchUsers: (query) => {
    return api.get('/api/users/search', { params: { query } });
  },
  
  // Получение списка соавторов
  getCollaborators: () => {
    return api.get('/api/users/collaborators');
  }
};

/**
 * API для работы с файлами и изображениями
 */
export const fileApi = {
  // Загрузка изображения
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Удаление изображения
  deleteImage: (fileName) => {
    return api.delete(`/api/files/${fileName}`);
  },
  
  // Обработка изображения (изменение размера, поворот и т.д.)
  processImage: (imageData) => {
    return api.put('/api/files/process', imageData);
  }
};

// Экспорт экземпляра api по умолчанию
export default api;