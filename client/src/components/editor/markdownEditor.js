import React, { useState, useEffect, useCallback } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import MarkdownPreview from './MarkdownPreview';
import './MarkdownEditor.css';

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

// Преобразование текста Markdown в формат Slate
const markdownToSlate = (markdown) => {
  if (!markdown) return initialValue;
  
  return [
    {
      type: 'paragraph',
      children: [{ text: markdown }],
    },
  ];
};

// Преобразование формата Slate в текст Markdown
const slateToMarkdown = (nodes) => {
  if (!nodes || nodes.length === 0) return '';
  
  // В этой простой реализации просто извлекаем текст из узлов
  return nodes.map(node => {
    return node.children.map(child => child.text).join('');
  }).join('\n');
};

const MarkdownEditor = ({ content, onChange }) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [showPreview, setShowPreview] = useState(false);
  const [slateValue, setSlateValue] = useState(initialValue);
  
  // Обновление значения редактора при изменении props
  useEffect(() => {
    if (content !== undefined) {
      setSlateValue(markdownToSlate(content));
    }
  }, [content]);
  
  // Обработчик изменения в редакторе
  const handleChange = useCallback((newValue) => {
    setSlateValue(newValue);
    const markdownContent = slateToMarkdown(newValue);
    onChange(markdownContent);
  }, [onChange]);
  
  // Переключение между режимами редактирования и предпросмотра
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  return (
    <div className="markdown-editor">
      <div className="markdown-editor-toolbar">
        <button 
          className={`markdown-editor-mode-toggle ${!showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(false)}
        >
          Редактор
        </button>
        <button 
          className={`markdown-editor-mode-toggle ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(true)}
        >
          Предпросмотр
        </button>
      </div>
      
      <div className="markdown-editor-content">
        {showPreview ? (
          <MarkdownPreview markdown={content} />
        ) : (
          <Slate
            editor={editor}
            value={slateValue}
            onChange={handleChange}
          >
            <Editable
              className="markdown-editor-editable"
              placeholder="Начните писать..."
              spellCheck="true"
              autoFocus
            />
          </Slate>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;