import React from 'react';
import ReactMarkdown from 'react-markdown';
import './MarkdownPreview.css';

const MarkdownPreview = ({ markdown }) => {
  return (
    <div className="markdown-preview">
      <ReactMarkdown>
        {markdown || '# Нет содержимого для отображения'}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;