import React, { useState, useEffect } from 'react';
import { useNotes } from '../../contexts/NoteContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../utils/dateFormat';
import Button from '../common/Button';
import './EditorSidebar.css';

const EditorSidebar = ({ note, onClose }) => {
  const { user } = useAuth();
  const { updateNote, shareNote, unshareNote } = useNotes();
  const { success, error } = useToast();
  
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Инициализация тегов из заметки
  useEffect(() => {
    if (note && note.tags) {
      setTags(note.tags);
    }
  }, [note]);
  
  // Добавление нового тега
  const addTag = async () => {
    if (!newTag.trim()) return;
    
    // Проверка, существует ли уже такой тег
    if (tags.includes(newTag.trim())) {
      error('Этот тег уже существует');
      return;
    }
    
    const updatedTags = [...tags, newTag.trim()];
    
    try {
      await updateNote(note._id, { tags: updatedTags });
      setTags(updatedTags);
      setNewTag('');
      success('Тег добавлен');
    } catch (err) {
      error('Ошибка при добавлении тега');
      console.error(err);
    }
  };
  
  // Удаление тега
  const removeTag = async (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    
    try {
      await updateNote(note._id, { tags: updatedTags });
      setTags(updatedTags);
      success('Тег удален');
    } catch (err) {
      error('Ошибка при удалении тега');
      console.error(err);
    }
  };
  
  // Поиск пользователей для совместного доступа
  const searchUsers = async (e) => {
    const query = e.target.value;
    setSearchUser(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // В реальном приложении здесь должен быть запрос к API
      // Для примера используем имитацию
      setTimeout(() => {
        setSearchResults([
          { _id: '1', username: 'user1', email: 'user1@example.com' },
          { _id: '2', username: 'user2', email: 'user2@example.com' }
        ].filter(u => 
          u.username.includes(query) || u.email.includes(query)
        ));
        setIsSearching(false);
      }, 500);
    } catch (err) {
      setIsSearching(false);
      error('Ошибка при поиске пользователей');
      console.error(err);
    }
  };
  
  // Предоставление доступа пользователю
  const handleShareWithUser = async (userId) => {
    try {
      await shareNote(note._id, userId, 'viewer');
      success('Доступ предоставлен');
      setSearchUser('');
      setSearchResults([]);
    } catch (err) {
      error('Ошибка при предоставлении доступа');
      console.error(err);
    }
  };
  
  // Отмена доступа пользователю
  const handleUnshareWithUser = async (userId) => {
    if (window.confirm('Вы уверены, что хотите отменить доступ для этого пользователя?')) {
      try {
        await unshareNote(note._id, userId);
        success('Доступ отменен');
      } catch (err) {
        error('Ошибка при отмене доступа');
        console.error(err);
      }
    }
  };
  
  // Изменение роли пользователя
  const handleChangeRole = async (userId, role) => {
    try {
      await shareNote(note._id, userId, role);
      success('Роль пользователя изменена');
    } catch (err) {
      error('Ошибка при изменении роли');
      console.error(err);
    }
  };
  
  if (!note) return null;
  
  return (
    <div className="editor-sidebar">
      <div className="editor-sidebar-header">
        <h3>Свойства заметки</h3>
        <button 
          className="editor-sidebar-close" 
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      
      <div className="editor-sidebar-content">
        <div className="editor-sidebar-section">
          <h4>Информация</h4>
          <div className="editor-sidebar-info">
            <div className="info-item">
              <span className="info-label">Создана:</span>
              <span className="info-value">{formatDateTime(note.createdAt)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Изменена:</span>
              <span className="info-value">{formatDateTime(note.updatedAt)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Статус:</span>
              <span className="info-value">{note.status === 'active' ? 'Активна' : 'В корзине'}</span>
            </div>
          </div>
        </div>
        
        <div className="editor-sidebar-section">
          <h4>Теги</h4>
          <div className="editor-sidebar-tags">
            {tags && tags.length > 0 ? (
              <div className="tag-list">
                {tags.map(tag => (
                  <div key={tag} className="tag">
                    <span className="tag-name">{tag}</span>
                    <button 
                      className="tag-remove" 
                      onClick={() => removeTag(tag)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">Нет тегов</p>
            )}
            
            <div className="add-tag">
              <input
                type="text"
                placeholder="Новый тег"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="add-tag-input"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button 
                variant="outline"
                size="sm"
                onClick={addTag}
              >
                Добавить
              </Button>
            </div>
          </div>
        </div>
        
        <div className="editor-sidebar-section">
          <h4>Общий доступ</h4>
          
          <div className="editor-sidebar-search">
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchUser}
              onChange={searchUsers}
              className="search-user-input"
            />
            
            {isSearching && (
              <div className="search-loading">Поиск...</div>
            )}
            
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div key={user._id} className="search-result-item">
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWithUser(user._id)}
                    >
                      Поделиться
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="shared-users">
            <h5>Доступ предоставлен</h5>
            
            {note.shared && note.shared.length > 0 ? (
              <div className="shared-users-list">
                <div className="shared-user owner">
                  <div className="user-info">
                    <div className="user-name">{user.username} (вы)</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-role">Владелец</div>
                </div>
                
                {note.shared.map(share => (
                  <div key={share.userId._id} className="shared-user">
                    <div className="user-info">
                      <div className="user-name">{share.userId.username}</div>
                      <div className="user-email">{share.userId.email}</div>
                    </div>
                    <div className="user-actions">
                      <select
                        value={share.role}
                        onChange={(e) => handleChangeRole(share.userId._id, e.target.value)}
                        className="role-select"
                      >
                        <option value="viewer">Просмотр</option>
                        <option value="editor">Редактирование</option>
                      </select>
                      <button 
                        className="unshare-btn"
                        onClick={() => handleUnshareWithUser(share.userId._id)}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">Нет пользователей с общим доступом</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorSidebar;