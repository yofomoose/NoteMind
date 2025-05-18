import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotes } from '../../contexts/NoteContext';
import { formatRelativeDate } from '../../utils/dateFormat';
import { getMarkdownPreview } from '../../utils/markdown';
import Button from '../common/Button';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { notes, fetchNotes, createNote, activeNote, setActiveNote } = useNotes();
  const [filter, setFilter] = useState({ status: 'active', search: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Загрузка заметок при монтировании компонента
  useEffect(() => {
    loadNotes();
  }, []);
  
  // Загрузка заметок с учетом фильтра
  const loadNotes = async () => {
    setIsLoading(true);
    try {
      await fetchNotes(filter);
    } catch (error) {
      console.error('Ошибка при загрузке заметок:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик изменения фильтра
  const handleFilterChange = (newFilter) => {
    setFilter(prevFilter => ({ ...prevFilter, ...newFilter }));
  };
  
  // Применение фильтра при его изменении
  useEffect(() => {
    loadNotes();
  }, [filter]);
  
  // Создание новой заметки
  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Новая заметка',
        content: '',
        type: 'markdown'
      });
      
      // Переход к новой заметке
      setActiveNote(newNote);
      navigate(`/notes/${newNote._id}`);
    } catch (error) {
      console.error('Ошибка при создании заметки:', error);
    }
  };
  
  // Выбор заметки
  const handleSelectNote = (note) => {
    setActiveNote(note);
    navigate(`/notes/${note._id}`);
  };
  
  // Обработчик выхода из системы
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">NoteMind</h1>
        
        <div className="sidebar-actions">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleCreateNote}
            title="Создать новую заметку"
          >
            + Новая
          </Button>
        </div>
      </div>
      
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Поиск заметок..."
          value={filter.search}
          onChange={e => handleFilterChange({ search: e.target.value })}
          className="sidebar-search-input"
        />
      </div>
      
      <div className="sidebar-filter">
        <button
          className={`sidebar-filter-btn ${filter.status === 'active' ? 'active' : ''}`}
          onClick={() => handleFilterChange({ status: 'active' })}
        >
          Активные
        </button>
        <button
          className={`sidebar-filter-btn ${filter.status === 'trashed' ? 'active' : ''}`}
          onClick={() => handleFilterChange({ status: 'trashed' })}
        >
          Корзина
        </button>
      </div>
      
      <div className="sidebar-notes">
        {isLoading ? (
          <div className="sidebar-loading">Загрузка заметок...</div>
        ) : notes.length === 0 ? (
          <div className="sidebar-empty">
            {filter.status === 'active' ? (
              <>
                <p>У вас пока нет заметок</p>
                <Button variant="text" onClick={handleCreateNote}>
                  Создать первую заметку
                </Button>
              </>
            ) : (
              <p>Корзина пуста</p>
            )}
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note._id}
              className={`sidebar-note ${activeNote && activeNote._id === note._id ? 'active' : ''}`}
              onClick={() => handleSelectNote(note)}
            >
              <div className="sidebar-note-title">{note.title || 'Без названия'}</div>
              <div className="sidebar-note-preview">
                {getMarkdownPreview(note.content, 60)}
              </div>
              <div className="sidebar-note-date">
                {formatRelativeDate(note.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div className="sidebar-user-initials">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.username}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
        </div>
        
        <div className="sidebar-menu">
          <Button
            variant="text"
            size="sm"
            to="/settings"
            className="sidebar-menu-item"
          >
            Настройки
          </Button>
          <Button
            variant="text"
            size="sm"
            onClick={handleLogout}
            className="sidebar-menu-item"
          >
            Выйти
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;