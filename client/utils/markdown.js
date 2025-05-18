/**
 * Утилиты для работы с Markdown
 */

/**
 * Получение заголовка из содержимого заметки Markdown
 * @param {string} content - Содержимое заметки
 * @returns {string} - Заголовок заметки или пустая строка
 */
export const extractTitleFromMarkdown = (content) => {
  if (!content) return '';
  
  // Ищем первый заголовок (# Title)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // Если заголовок не найден, берем первую непустую строку
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      // Ограничиваем длину заголовка
      return trimmedLine.length > 50
        ? trimmedLine.substring(0, 50) + '...'
        : trimmedLine;
    }
  }
  
  return '';
};

/**
 * Очистка текста от Markdown-разметки
 * @param {string} markdownText - Текст с Markdown-разметкой
 * @returns {string} - Очищенный текст
 */
export const stripMarkdown = (markdownText) => {
  if (!markdownText) return '';
  
  // Удаляем заголовки
  let text = markdownText.replace(/^#+\s+/gm, '');
  
  // Удаляем жирный и курсивный текст
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');
  
  // Удаляем зачеркнутый текст
  text = text.replace(/~~(.*?)~~/g, '$1');
  
  // Удаляем ссылки, оставляя текст
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
  
  // Удаляем изображения
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '');
  
  // Удаляем блоки кода
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`(.*?)`/g, '$1');
  
  // Удаляем цитаты
  text = text.replace(/^\s*>\s*/gm, '');
  
  // Удаляем маркеры списков
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  
  // Удаляем горизонтальные линии
  text = text.replace(/^\s*[*-]\s*[*-]\s*[*-][-*\s]*$/gm, '');
  
  // Удаляем HTML-теги
  text = text.replace(/<[^>]*>/g, '');
  
  // Заменяем несколько переносов строк на один
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
};

/**
 * Получение превью для заметки
 * @param {string} content - Содержимое заметки
 * @param {number} length - Максимальная длина превью
 * @returns {string} - Превью заметки
 */
export const getMarkdownPreview = (content, length = 100) => {
  if (!content) return '';
  
  const plainText = stripMarkdown(content);
  
  if (plainText.length <= length) {
    return plainText;
  }
  
  return plainText.substring(0, length) + '...';
};

/**
 * Поиск всех тегов в тексте заметки
 * @param {string} content - Содержимое заметки
 * @returns {string[]} - Массив найденных тегов
 */
export const extractTagsFromMarkdown = (content) => {
  if (!content) return [];
  
  // Ищем все хэштеги вида #tag (с ограничениями по символам)
  const tagMatches = content.match(/#[a-zA-Zа-яА-Я0-9_-]+/g);
  
  if (!tagMatches) return [];
  
  // Убираем символ # и удаляем дубликаты
  return [...new Set(tagMatches.map(tag => tag.substring(1)))];
};

/**
 * Поиск ссылок на другие заметки в формате [[noteId]]
 * @param {string} content - Содержимое заметки
 * @returns {string[]} - Массив ID связанных заметок
 */
export const extractLinksFromMarkdown = (content) => {
  if (!content) return [];
  
  // Ищем все ссылки вида [[noteId]]
  const linkMatches = content.match(/\[\[([a-f0-9]{24})\]\]/g);
  
  if (!linkMatches) return [];
  
  // Извлекаем ID из ссылок и удаляем дубликаты
  return [...new Set(linkMatches.map(link => link.slice(2, -2)))];
};