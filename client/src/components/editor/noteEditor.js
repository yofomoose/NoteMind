import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../../contexts/NoteContext';
import { useToast } from '../../contexts/ToastContext';
import MarkdownEditor from './MarkdownEditor';
import EditorToolbar from './EditorToolbar';
import EditorSidebar from './EditorSidebar';
import Loader from '../common/Loader';
import './NoteEditor.css';

const NoteEditor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { 
    activeNote, 
    setActiveNote, 
    fetchNote, 
    updateNote, 
    updateNoteContent,
    isLoading,
    joinNote,
    leaveNote,
    connectedUsers
  } = useNotes();
  const { error, success } = useToast();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Загрузка заметки при монтировании компонента или изменении ID
  useEffect(() => {
    const loadNote = async () => {
      try {
        const note = await fetchNote(noteId);
        setActiveNote(note);
        setTitle(note.title || '');
        setContent(note.content || '');
      } catch (error) {
        console.error('Ошибка при загрузке заметки:', error);
        error('Не удалось загрузить заметку');
        navigate('/');
      }
    };
    
    loadNote();
    
    // Присоединение к комнате заметки для совместного редактирования
    joinNote(noteId);
    
    // Отсоединение при размонтировании
    return () => {
      leaveNote(noteId);
    };
  }, [noteId]);
  
  // Обновление заголовка
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };
  
  // Сохранение заголовка при потере фокуса
  const handleTitleBlur = async () => {
    if (activeNote && title !== activeNote.title) {
      try {
        setIsSaving(true);
        await updateNote(noteId, { title });
        setLastSaved(new Date());
        success('Заголовок сохранен');
      } catch (err) {
        error('Ошибка при сохранении заголовка');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // Обновление контента с задержкой для автосохранения
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
  }, []);
  
  // Автосохранение контента
  useEffect(() => {
    if (!activeNote || !content) return;
    
    const saveTimeout = setTimeout(async () => {
      if (content !== activeNote.content) {
        try {
          setIsSaving(true);
          await updateNoteContent(noteId, content);
          setLastSaved(new Date());
        } catch (err) {
          console.error('Ошибка при автосохранении:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [content, activeNote, noteId, updateNoteContent]);
  
  // Обработчик для кнопки переключения боковой панели
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  if (isLoading || !activeNote) {
    return (
      <div className="note-editor-container">
        <Loader />
      </div>
    );
  }
  
  return (
    <div className="note-editor-container">
      <EditorToolbar 
        note={activeNote}
        isSaving={isSaving}
        lastSaved={lastSaved}
        toggleSidebar={toggleSidebar}
        connectedUsers={connectedUsers}
      />
      
      <div className={`note-editor-content ${showSidebar ? 'with-sidebar' : ''}`}>
        <div className="note-editor-main">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Введите заголовок..."
            className="note-editor-title"
          />
          
          <MarkdownEditor 
            content={content} 
            onChange={handleContentChange} 
          />
        </div>
        
        {showSidebar && (
          <EditorSidebar 
            note={activeNote}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
};

export default NoteEditor;