import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../contexts/NoteContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from '../components/sidebar/Sidebar';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    notes, 
    fetchNotes, 
    createNote, 
    isLoading 
  } = useNotes();
  const { error } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  
  // Загрузка списка заметок при монтировании компонента
  useEffect(() => {
    const loadNotes = async () => {
      try {
        await fetchNotes();
      } catch (err) {
        error('Ошибка при загрузке заметок');
        console.error(err);
      }
    };
    
    loadNotes();
  }, [fetchNotes, error]);
  
  // Создание новой заметки
  const handleCreateNote = async () => {
    setIsCreating(true);
    try {
      const newNote = await createNote({
        title: 'Новая заметка',
        content: '',
        type: 'markdown'
      });
      navigate(`/notes/${newNote._id}`);
    } catch (err) {
      error('Ошибка при создании заметки');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="dashboard">
      <Sidebar />
      
      <main className="dashboard-main">
        {isLoading ? (
          <div className="dashboard-loading">
            <Loader />
          </div>
        ) : notes.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-content">
              <h2>Добро пожаловать в NoteMind!</h2>
              <p>У вас пока нет заметок. Создайте первую заметку, чтобы начать работу.</p>
              <Button 
                variant="primary" 
                onClick={handleCreateNote}
                isLoading={isCreating}
              >
                Создать заметку
              </Button>
            </div>
          </div>
        ) : (
          <div className="dashboard-welcome">
            <h1>Добро пожаловать в NoteMind!</h1>
            <p>Выберите заметку из списка слева или создайте новую заметку.</p>
            <Button 
              variant="primary" 
              onClick={handleCreateNote}
              isLoading={isCreating}
            >
              Создать заметку
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;