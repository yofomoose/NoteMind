import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../../contexts/NoteContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../utils/dateFormat';
import Button from '../common/Button';
import './EditorToolbar.css';

const EditorToolbar = ({ note, isSaving, lastSaved, toggleSidebar, connectedUsers }) => {
  const navigate = useNavigate();
  const { trashNote, restoreNote, deleteNote } = useNotes();
  const { success, error } = useToast();
  
  // Обработчик возврата на главную страницу
  const handleBack = () => {
    navigate('/');
  };
  
  // Обработчик перемещения заметки в корзину
  const handleTrash = async () => {
    if (note.status === 'trashed') return;
    
    try {
      await trashNote(note._id);
      success('Заметка перемещена в корзину');
    } catch (err) {
      error('Ошибка при перемещении заметки в корзину');
      console.error(err);
    }
  };
  
  // Обработчик восстановления заметки из корзины
  const handleRestore = async () => {
    if (note.status !== 'trashed') return;
    
    try {
      await restoreNote(note._id);
      success('Заметка восстановлена');
    } catch (err) {
      error('Ошибка при восстановлении заметки');
      console.error(err);
    }
  };
  
  // Обработчик удаления заметки
  const handleDelete = async () => {
    if (note.status !== 'trashed') {
      error('Сначала переместите заметку в корзину');
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите удалить эту заметку навсегда?')) {
      try {
        await deleteNote(note._id);
        success('Заметка удалена');
        navigate('/');
      } catch (err) {
        error('Ошибка при удалении заметки');
        console.error(err);
      }
    }
  };
  
  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-left">
        <Button 
          variant="text" 
          size="sm" 
          onClick={handleBack}
          className="editor-toolbar-btn"
        >
          ← Назад
        </Button>
        
        <div className="editor-toolbar-status">
          {isSaving ? (
            <div className="editor-toolbar-saving">
              <span className="editor-toolbar-saving-indicator"></span>
              <span>Сохранение...</span>
            </div>
          ) : lastSaved ? (
            <div className="editor-toolbar-saved">
              Сохранено в {formatDateTime(lastSaved)}
            </div>
          ) : null}
        </div>
      </div>
      
      <div className="editor-toolbar-center">
        {connectedUsers && connectedUsers.length > 0 && (
          <div className="editor-toolbar-users">
            {connectedUsers.map(user => (
              <div key={user.id} className="editor-toolbar-user" title={user.username}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <div className="editor-toolbar-user-initial">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="editor-toolbar-right">
        {note.status === 'trashed' ? (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRestore}
              className="editor-toolbar-btn"
            >
              Восстановить
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleDelete}
              className="editor-toolbar-btn"
            >
              Удалить навсегда
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTrash}
            className="editor-toolbar-btn"
          >
            В корзину
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSidebar}
          className="editor-toolbar-btn"
        >
          Свойства
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;