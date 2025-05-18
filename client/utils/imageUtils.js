/**
 * Утилиты для работы с изображениями
 */

/**
 * Предварительная загрузка изображения
 * @param {string} src - URL изображения
 * @returns {Promise<HTMLImageElement>} - Промис с загруженным изображением
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

/**
 * Сжатие изображения (изменение размера)
 * @param {File|Blob} file - Файл изображения
 * @param {Object} options - Опции сжатия
 * @param {number} options.maxWidth - Максимальная ширина (по умолчанию 1200)
 * @param {number} options.maxHeight - Максимальная высота (по умолчанию 1200)
 * @param {number} options.quality - Качество JPEG (0-1, по умолчанию 0.85)
 * @returns {Promise<Blob>} - Промис с сжатым изображением
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85
  } = options;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.src = readerEvent.target.result;
      
      img.onload = () => {
        // Расчет новых размеров с сохранением пропорций
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
        
        // Создание canvas для сжатия
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Преобразование в Blob
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      
      img.onerror = (error) => {
        reject(error);
      };
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Поворот изображения
 * @param {string} src - URL или Data URL изображения
 * @param {number} degrees - Угол поворота в градусах
 * @returns {Promise<string>} - Промис с URL измененного изображения
 */
export const rotateImage = async (src, degrees) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Расчет размеров с учетом поворота
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      // Поворот изображения
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // Возвращаем Data URL
      resolve(canvas.toDataURL());
    };
    
    img.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Обрезка изображения
 * @param {string} src - URL или Data URL изображения
 * @param {Object} cropArea - Область обрезки
 * @param {number} cropArea.x - Позиция X
 * @param {number} cropArea.y - Позиция Y
 * @param {number} cropArea.width - Ширина
 * @param {number} cropArea.height - Высота
 * @returns {Promise<string>} - Промис с URL обрезанного изображения
 */
export const cropImage = async (src, cropArea) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );
      
      // Возвращаем Data URL
      resolve(canvas.toDataURL());
    };
    
    img.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Преобразование Blob/File в Data URL
 * @param {Blob|File} blob - Blob или File для преобразования
 * @returns {Promise<string>} - Промис с Data URL
 */
export const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
};

/**
 * Преобразование Data URL в Blob
 * @param {string} dataURL - Data URL для преобразования
 * @returns {Blob} - Blob
 */
export const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Получение размеров изображения
 * @param {string} src - URL или Data URL изображения
 * @returns {Promise<{width: number, height: number}>} - Промис с размерами
 */
export const getImageDimensions = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};