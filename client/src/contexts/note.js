import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { WS_EVENTS } from '../constants';

// Создание контекста
const NoteContext = createContext();

// Хук для использования контекста
export const useNotes = () => {
  return useContext(NoteContext);
};

// Провайдер контекста
export const NoteProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [cursorPositions, setCursorPositions] = useState({});
  
  // Инициализация WebSocket подключения
  useEffect(() => {
    if (token && user) {
      const socketConnection = io('/', {
        auth: {
          token
        }
      });
      
      setSocket(socketConnection);
      
      // Очистка при размонтировании
      return () => {
        socketConnection.disconnect();
      };
    }
  }, [token, user]);
  
  // Настройка обработчиков WebSocket событий
  useEffect(() => {
    if (!socket) return;
    
    // Обработка ошибок
    socket.on(WS_EVENTS.ERROR, (data) => {
      console.error('WebSocket error:', data.message);
      setError(data.message);
    });
    
    // Обработка события присоединения пользователя к заметке
    socket.on(WS_EVENTS.USER_JOINED, (data) => {
      setConnectedUsers(prevUsers => {
        // Проверяем, нет ли уже этого пользователя в списке
        if (!prevUsers.some(user => user.id === data.user.id)) {
          return [...prevUsers, data.user];
        }
        return prevUsers;
      });
    });
    
    // Обработка события ухода пользователя из заметки
    socket.on(WS_EVENTS.USER_LEFT, (data) => {
      setConnectedUsers(prevUsers => 
        prevUsers.filter(user => user.id !== data.userId)
      );
      
      // Удаляем позицию курсора ушедшего пользователя
      setCursorPositions(prevPositions => {
        const newPositions = { ...prevPositions };
        delete newPositions[data.userId];
        return newPositions;
      });
    });
    
    // Обработка обновления контента заметки
    socket.on(WS_EVENTS.NOTE_CONTENT_UPDATED, (data) => {
      if (data.updatedBy !== user.id) {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note._id === data.noteId
              ? { ...note, content: data.content, updatedAt: new Date().toISOString() }
              : note
          )
        );
        
        if (activeNote && activeNote._id === data.noteId) {
          setActiveNote(prevNote => ({
            ...prevNote,
            content: data.content,
            updatedAt: new Date().toISOString()
          }));
        }
        
        // Обновляем позицию курсора пользователя
        if (data.cursorPosition) {
          setCursorPositions(prevPositions => ({
            ...prevPositions,
            [data.updatedBy]: data.cursorPosition
          }));
        }
      }
    });
    
    // Обработка обновления всей заметки
    socket.on(WS_EVENTS.NOTE_UPDATED, (data) => {
      if (data.updatedBy !== user.id) {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note._id === data.noteId
              ? { ...note, ...data.updateData, updatedAt: new Date().toISOString() }
              : note
          )
        );
        
        if (activeNote && activeNote._id === data.noteId) {
          setActiveNote(prevNote => ({
            ...prevNote,
            ...data.updateData,
            updatedAt: new Date().toISOString()
          }));
        }
      }
    });
    
    // Обработка перемещения заметки в корзину
    socket.on(WS_EVENTS.NOTE_TRASHED, (data) => {
      if (data.updatedBy !== user.id) {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note._id === data.noteId
              ? { ...note, status: 'trashed', updatedAt: new Date().toISOString() }
              : note
          )
        );
        
        if (activeNote && activeNote._id === data.noteId) {
          setActiveNote(prevNote => ({
            ...prevNote,
            status: 'trashed',
            updatedAt: new Date().toISOString()
          }));
        }
      }
    });
    
    // Обработка восстановления заметки из корзины
    socket.on(WS_EVENTS.NOTE_RESTORED, (data) => {
      if (data.updatedBy !== user.id) {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note._id === data.noteId
              ? { ...note, status: 'active', updatedAt: new Date().toISOString() }
              : note
          )
        );
        
        if (activeNote && activeNote._id === data.noteId) {
          setActiveNote(prevNote => ({
            ...prevNote,
            status: 'active',
            updatedAt: new Date().toISOString()
          }));
        }
      }
    });
    
    // Обработка удаления заметки
    socket.on(`user:${user.id}:note-deleted`, (data) => {
      setNotes(prevNotes =>
        prevNotes.filter(note => note._id !== data.noteId)
      );
      
      if (activeNote && activeNote._id === data.noteId) {
        setActiveNote(null);
      }
    });
    
    // Обработка создания новой заметки
    socket.on(`user:${user.id}:note-created`, (data) => {
      fetchNote(data.noteId).then(newNote => {
        setNotes(prevNotes => [newNote, ...prevNotes]);
      });
    });
    
    // Обработка позиции курсора
    socket.on(WS_EVENTS.CURSOR_POSITION, (data) => {
      setCursorPositions(prevPositions => ({
        ...prevPositions,
        [data.userId]: data.position
      }));
    });
    
    // Обработка ответа на запрос синхронизации
    socket.on(WS_EVENTS.SYNC_RESPONSE, (data) => {
      if (activeNote && activeNote._id === data.noteId) {
        setActiveNote(prevNote => ({
          ...prevNote,
          content: data.content,
          updatedAt: data.updatedAt
        }));
      }
    });
    
    return () => {
      // Отписываемся от всех событий при размонтировании
      socket.off(WS_EVENTS.ERROR);
      socket.off(WS_EVENTS.USER_JOINED);
      socket.off(WS_EVENTS.USER_LEFT);
      socket.off(WS_EVENTS.NOTE_CONTENT_UPDATED);
      socket.off(WS_EVENTS.NOTE_UPDATED);
      socket.off(WS_EVENTS.NOTE_TRASHED);
      socket.off(WS_EVENTS.NOTE_RESTORED);
      socket.off(`user:${user.id}:note-deleted`);
      socket.off(`user:${user.id}:note-created`);
      socket.off(WS_EVENTS.CURSOR_POSITION);
      socket.off(WS_EVENTS.SYNC_RESPONSE);
    };
  }, [socket, user, activeNote]);
  
  // Загрузка списка заметок
  const fetchNotes = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const { status, type, tag, parent, search, sortBy, sortDir, page, limit } = options;
      
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (type) queryParams.append('type', type);
      if (tag) queryParams.append('tag', tag);
      if (parent) queryParams.append('parent', parent);
      if (search) queryParams.append('search', search);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortDir) queryParams.append('sortDir', sortDir);
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      
      const response = await api.get(`/notes?${queryParams.toString()}`);
      setNotes(response.data.data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при загрузке заметок';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Получение заметки по ID
  const fetchNote = useCallback(async (noteId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/notes/${noteId}`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при загрузке заметки';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Создание новой заметки
  const createNote = useCallback(async (noteData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/notes', noteData);
      const newNote = response.data.data;
      setNotes(prevNotes => [newNote, ...prevNotes]);
      return newNote;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при создании заметки';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Обновление заметки
  const updateNote = useCallback(async (noteId, noteData) => {
    setError(null);
    try {
      const response = await api.put(`/notes/${noteId}`, noteData);
      const updatedNote = response.data.data;
      
      // Обновляем заметку в списке
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId ? updatedNote : note
        )
      );
      
      // Обновляем активную заметку, если обновляется она
      if (activeNote && activeNote._id === noteId) {
        setActiveNote(updatedNote);
      }
      
      return updatedNote;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при обновлении заметки';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeNote]);
  
  // Обновление контента заметки (для совместного редактирования)
  const updateNoteContent = useCallback(async (noteId, content, cursorPosition) => {
    setError(null);
    try {
      // Отправляем обновление через WebSocket
      if (socket) {
        socket.emit(WS_EVENTS.NOTE_CONTENT_UPDATED, {
          noteId,
          content,
          cursorPosition
        });
      }
      
      // Также отправляем через API для сохранения на сервере
      const response = await api.patch(`/notes/${noteId}/content`, { content });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при обновлении контента заметки';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [socket]);
  
  // Перемещение заметки в корзину
  const trashNote = useCallback(async (noteId) => {
    setError(null);
    try {
      const response = await api.put(`/notes/${noteId}/trash`);
      
      // Обновляем заметку в списке
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId ? { ...note, status: 'trashed' } : note
        )
      );
      
      // Обновляем активную заметку, если перемещается она
      if (activeNote && activeNote._id === noteId) {
        setActiveNote({ ...activeNote, status: 'trashed' });
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при перемещении заметки в корзину';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeNote]);
  
  // Восстановление заметки из корзины
  const restoreNote = useCallback(async (noteId) => {
    setError(null);
    try {
      const response = await api.put(`/notes/${noteId}/restore`);
      
      // Обновляем заметку в списке
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId ? { ...note, status: 'active' } : note
        )
      );
      
      // Обновляем активную заметку, если восстанавливается она
      if (activeNote && activeNote._id === noteId) {
        setActiveNote({ ...activeNote, status: 'active' });
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при восстановлении заметки';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeNote]);
  
  // Постоянное удаление заметки
  const deleteNote = useCallback(async (noteId) => {
    setError(null);
    try {
      await api.delete(`/notes/${noteId}`);
      
      // Удаляем заметку из списка
      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      // Если удаляем активную заметку, сбрасываем её
      if (activeNote && activeNote._id === noteId) {
        setActiveNote(null);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при удалении заметки';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeNote]);
  
  // Предоставление доступа к заметке другому пользователю
  const shareNote = useCallback(async (noteId, userId, role) => {
    setError(null);
    try {
      const response = await api.post(`/notes/${noteId}/share`, { userId, role });
      
      // Обновляем заметку в списке
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId ? response.data.data : note
        )
      );
      
      // Обновляем активную заметку, если обновляется она
      if (activeNote && activeNote._id === noteId) {
        setActiveNote(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при предоставлении доступа';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeNote]);
  
  // Отмена доступа к заметке
  const unshareNote = useCallback(async (noteId, userId) => {
    setError(null);
    try {
      const response = await api.delete(`/notes/${noteId}/share`, { data: { userId } });
      
      // Обновляем заметку в списке
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId ? response.data.data : note
        )
      );
      
      // Обновляем активную заметку, если обновляется она
      if (activeNote && activeNote._id === noteId) {
        setActiveNote(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при отмене доступа';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeNote]);
  
  // Поиск заметок
  const searchNotes = useCallback(async (query, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const { tags, status, page, limit } = options;
      
      const queryParams = new URLSearchParams();
      if (query) queryParams.append('query', query);
      if (tags) queryParams.append('tags', tags);
      if (status) queryParams.append('status', status);
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      
      const response = await api.get(`/notes/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при поиске заметок';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Получение всех тегов пользователя
  const getUserTags = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get('/notes/tags');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при получении тегов';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);
  
  // Присоединение к комнате заметки для совместного редактирования
  const joinNote = useCallback((noteId) => {
    if (socket) {
      // Очищаем список подключенных пользователей при переходе на новую заметку
      setConnectedUsers([]);
      setCursorPositions({});
      
      // Присоединяемся к комнате заметки
      socket.emit(WS_EVENTS.JOIN_NOTE, { noteId });
      
      // Запрашиваем синхронизацию для получения актуальной версии
      socket.emit(WS_EVENTS.SYNC_REQUEST, { noteId });
    }
  }, [socket]);
  
  // Покидание комнаты заметки
  const leaveNote = useCallback((noteId) => {
    if (socket) {
      socket.emit(WS_EVENTS.LEAVE_NOTE, { noteId });
    }
  }, [socket]);
  
  // Отправка позиции курсора
  const sendCursorPosition = useCallback((noteId, position) => {
    if (socket) {
      socket.emit(WS_EVENTS.CURSOR_POSITION, { noteId, position });
    }
  }, [socket]);
  
  const value = {
    notes,
    activeNote,
    setActiveNote,
    isLoading,
    error,
    connectedUsers,
    cursorPositions,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    updateNoteContent,
    trashNote,
    restoreNote,
    deleteNote,
    shareNote,
    unshareNote,
    searchNotes,
    getUserTags,
    joinNote,
    leaveNote,
    sendCursorPosition
  };
  
  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};