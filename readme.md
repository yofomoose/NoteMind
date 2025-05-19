# NoteMind - Приложение для заметок с совместным редактированием

NoteMind - современное веб-приложение для создания и организации заметок с поддержкой связей между заметками (как в Obsidian), удобным редактированием (как в Notion) и возможностью совместной работы в реальном времени.

## Основные возможности

- Создание и редактирование заметок с поддержкой Markdown
- Древовидная структура и организация заметок
- Система связей между заметками и визуализация графа связей
- Совместное редактирование в реальном времени
- Редактирование изображений внутри приложения
- Поддержка тегов и фильтрация заметок
- Темная и светлая темы оформления
- Локальное хранение и синхронизация с облаком

## Технологический стек

### Фронтенд
- React
- React Router
- Slate.js / ProseMirror (для редактора)
- Socket.io-client (WebSockets)
- Fabric.js (для редактирования изображений)
- React-Markdown

### Бэкенд
- Node.js
- Express
- Socket.io
- Mongoose (MongoDB ODM)
- JWT для аутентификации
- Multer (загрузка файлов)

### База данных
- MongoDB
- Redis (опционально)

## Запуск с помощью Docker

### Требования
- Docker
- Docker Compose

### Запуск в режиме разработки

```bash
# Запуск с помощью Makefile
make dev

# Или напрямую с помощью Docker Compose
docker-compose -f docker-compose.dev.yml up
```

### Запуск в production режиме

```bash
# Запуск с помощью Makefile
make prod

# Или напрямую с помощью Docker Compose
docker-compose up
```

### Остановка контейнеров

```bash
# Для разработки
make dev-down

# Для production
make prod-down
```

### Другие полезные команды

```bash
# Просмотр логов
make logs

# Пересборка контейнеров
make rebuild

# Удаление всех данных
make clean

# Список всех доступных команд
make help
```

## Ручная установка

### Требования
- Node.js 18.x или выше
- MongoDB 5.x или выше
- npm 8.x или выше

### Установка

1. Клонировать репозиторий:
```bash
git clone https://github.com/yofomoose/NoteMind.git
cd notemind
```

2. Установить зависимости для клиента и сервера:
```bash
# Установка зависимостей для корневого проекта
npm install

# Установка зависимостей для клиента
cd client
npm install

# Установка зависимостей для сервера
cd ../server
npm install
```

3. Создать файл `.env` на основе `.env.example`

### Запуск в режиме разработки
```bash
# Запуск сервера и клиента одновременно из корневой директории
npm run dev

# Запуск только сервера
npm run server

# Запуск только клиента
npm run client
```

## Структура проекта

```
notemind/
│
├── client/                       # Фронтенд приложения
│   ├── public/                   # Публичные статические файлы
│   │   ├── index.html            # Главная HTML страница
│   │   └── favicon.ico           # Иконка приложения
│   │
│   ├── src/                      # Исходный код React
│   │   ├── assets/               # Изображения, шрифты и другие ресурсы
│   │   │
│   │   ├── components/           # Компоненты React
│   │   │   ├── common/           # Общие компоненты UI
│   │   │   ├── editor/           # Компоненты редактора заметок
│   │   │   └── sidebar/          # Компоненты боковой панели
│   │   │
│   │   ├── contexts/             # React контексты
│   │   ├── hooks/                # Пользовательские хуки React
│   │   ├── pages/                # Страницы приложения
│   │   ├── services/             # Сервисы для работы с API
│   │   ├── utils/                # Утилиты и вспомогательные функции
│   │   │
│   │   ├── App.js                # Основной компонент приложения
│   │   └── index.js              # Точка входа React
│   │
│   ├── Dockerfile                # Dockerfile для production
│   ├── Dockerfile.dev            # Dockerfile для разработки
│   └── package.json              # Зависимости для фронтенда
│
├── server/                       # Бэкенд приложения
│   ├── config/                   # Конфигурационные файлы
│   ├── controllers/              # Контроллеры для обработки запросов
│   ├── middleware/               # Промежуточное ПО Express
│   ├── models/                   # Модели MongoDB
│   ├── routes/                   # Маршруты API
│   ├── services/                 # Сервисы
│   ├── utils/                    # Утилиты сервера
│   │
│   ├── Dockerfile                # Dockerfile для production
│   ├── Dockerfile.dev            # Dockerfile для разработки
│   ├── app.js                    # Конфигурация приложения
│   ├── server.js                 # Точка входа сервера
│   └── package.json              # Зависимости для бэкенда
│
├── shared/                       # Общие ресурсы для фронтенда и бэкенда
│   ├── constants.js              # Общие константы
│   └── types.js                  # Общие типы данных
│
├── docker-compose.yml            # Docker Compose для production
├── docker-compose.dev.yml        # Docker Compose для разработки
├── Makefile                      # Makefile для управления проектом
├── .env.example                  # Пример конфигурации окружения
├── .gitignore                    # Игнорируемые Git файлы
├── package.json                  # Корневой package.json
└── README.md                     # Документация проекта
```

## Лицензия

MIT