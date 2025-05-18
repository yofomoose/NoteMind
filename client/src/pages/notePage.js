import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../contexts/NoteContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from '../components/sidebar/Sidebar';
import NoteEditor from '../components/editor/NoteEditor';
import Loader from '../components/common/Loader';
import './NotePage.css';

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { 
    fetchNote, 
    activeNote, 
    setActiveNote, 
    isLoading 
  } = useNotes();
  const { error } = useToast();
  
  // Загрузка заметки при монтировании компонента или изменении ID
  useEffect(() => {
    const loadNote = async () => {
      try {
        const note = await fetchNote(noteId);
        setActiveNote(note);
      } catch (err) {
        error('Ошибка при загрузке заметки');
        console.error(err);
        navigate('/');
      }
    };
    
    loadNote();
    
    // Очистка при размонтировании
    return () => {
      setActiveNote(null);
    };
  }, [noteId, fetchNote, setActiveNote, error, navigate]);
  
  return (
    <div className="note-page">
      <Sidebar />
      
      <main className="note-page-main">
        {isLoading || !activeNote ? (
          <div className="note-page-loading">
            <Loader />
          </div>
        ) : (
          <NoteEditor />
        )}
      </main>
    </div>
  );
};

export default NotePage;