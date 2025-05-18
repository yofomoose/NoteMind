#!/bin/bash

# Скрипт для установки и запуска NoteMind
# Автоматически устанавливает все необходимые зависимости и запускает приложение

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_message() {
  echo -e "${GREEN}[NoteMind]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[NoteMind]${NC} $1"
}

print_error() {
  echo -e "${RED}[NoteMind]${NC} $1"
}

# Проверяем root права
check_root() {
  if [ "$EUID" -ne 0 ]; then
    print_warning "Скрипт запущен без прав администратора. Некоторые операции могут требовать sudo."
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_error "Установка прервана."
      exit 1
    fi
  fi
}

# Проверка и установка необходимых пакетов
check_dependencies() {
  print_message "Проверка необходимых зависимостей..."
  
  # Проверяем Docker
  if ! command -v docker &> /dev/null; then
    print_warning "Docker не установлен. Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_message "Docker установлен успешно."
  else
    print_message "Docker уже установлен."
  fi
  
  # Проверяем Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose не установлен. Установка Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_message "Docker Compose установлен успешно."
  else
    print_message "Docker Compose уже установлен."
  fi
  
  # Проверяем Git
  if ! command -v git &> /dev/null; then
    print_warning "Git не установлен. Установка Git..."
    sudo apt-get update
    sudo apt-get install -y git
    print_message "Git установлен успешно."
  else
    print_message "Git уже установлен."
  fi
  
  # Проверяем make
  if ! command -v make &> /dev/null; then
    print_warning "Make не установлен. Установка Make..."
    sudo apt-get update
    sudo apt-get install -y make
    print_message "Make установлен успешно."
  else
    print_message "Make уже установлен."
  fi
}

# Клонирование репозитория
clone_repository() {
  print_message "Клонирование репозитория NoteMind..."
  
  # Запрос URL репозитория
  read -p "Введите URL репозитория (оставьте пустым для использования значения по умолчанию): " repo_url
  repo_url=${repo_url:-"https://github.com/yourusername/notemind.git"}
  
  # Запрос директории для клонирования
  read -p "Введите директорию для установки (оставьте пустым для использования './notemind'): " install_dir
  install_dir=${install_dir:-"./notemind"}
  
  # Создаем директорию, если она не существует
  mkdir -p $(dirname "$install_dir")
  
  # Проверяем, существует ли директория и не пуста ли она
  if [ -d "$install_dir" ] && [ "$(ls -A "$install_dir" 2>/dev/null)" ]; then
    print_warning "Директория $install_dir уже существует и не пуста."
    read -p "Очистить директорию перед клонированием? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      print_message "Очистка директории $install_dir..."
      rm -rf "$install_dir"
    else
      print_error "Клонирование прервано. Выберите другую директорию."
      return 1
    fi
  fi
  
  # Клонирование репозитория
  print_message "Клонирование из $repo_url в $install_dir..."
  git clone "$repo_url" "$install_dir"
  
  if [ $? -ne 0 ]; then
    print_error "Не удалось клонировать репозиторий."
    return 1
  fi
  
  print_message "Репозиторий успешно клонирован."
  cd "$install_dir"
  return 0
}

# Настройка переменных окружения
setup_environment() {
  print_message "Настройка переменных окружения..."
  
  if [ -f .env ]; then
    print_warning "Файл .env уже существует."
    read -p "Перезаписать? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_message "Используется существующий файл .env."
      return 0
    fi
  fi
  
  if [ -f .env.example ]; then
    cp .env.example .env
    print_message "Файл .env создан из шаблона .env.example."
  else
    print_warning "Шаблон .env.example не найден. Создание пустого файла .env."
    touch .env
  fi
  
  # Запрос основных переменных окружения
  read -p "Введите секретный ключ JWT (оставьте пустым для генерации случайного): " jwt_secret
  jwt_secret=${jwt_secret:-$(openssl rand -hex 32)}
  
  # Запрос порта для API сервера
  read -p "Введите порт для API сервера (оставьте пустым для использования 5000): " api_port
  api_port=${api_port:-5000}
  
  # Запрос порта для веб-клиента
  read -p "Введите порт для веб-клиента (оставьте пустым для использования 3000): " client_port
  client_port=${client_port:-3000}
  
  # Запрос режима работы
  read -p "Выберите режим работы (development/production, оставьте пустым для development): " node_env
  node_env=${node_env:-development}
  
  # Запись переменных в файл .env
  echo "NODE_ENV=$node_env" > .env
  echo "PORT=$api_port" >> .env
  echo "JWT_SECRET=$jwt_secret" >> .env
  echo "JWT_EXPIRE=30d" >> .env
  echo "MONGO_URI=mongodb://mongodb:27017/notemind" >> .env
  echo "REDIS_HOST=redis" >> .env
  echo "REDIS_PORT=6379" >> .env
  echo "SOCKET_CORS_ORIGIN=http://localhost:$client_port" >> .env
  
  print_message "Настройка переменных окружения завершена."
  
  # Обновляем порты в docker-compose файлах, если они были изменены
  if [ "$api_port" != "5000" ]; then
    print_message "Обновление порта API в файлах docker-compose..."
    sed -i "s/\"5000:5000\"/\"$api_port:5000\"/g" docker-compose.yml
    sed -i "s/\"5000:5000\"/\"$api_port:5000\"/g" docker-compose.dev.yml
  fi
  
  if [ "$client_port" != "3000" ]; then
    print_message "Обновление порта клиента в файлах docker-compose..."
    sed -i "s/\"3000:80\"/\"$client_port:80\"/g" docker-compose.yml
    sed -i "s/\"3000:3000\"/\"$client_port:3000\"/g" docker-compose.dev.yml
  fi
}

# Запуск приложения
start_application() {
  print_message "Запуск приложения NoteMind..."
  
  # Запрос режима запуска
  read -p "Выберите режим запуска (dev/prod, оставьте пустым для dev): " launch_mode
  launch_mode=${launch_mode:-dev}
  
  # Запрос запуска в фоновом режиме
  read -p "Запустить в фоновом режиме? (y/n, оставьте пустым для y): " -n 1 -r detached_mode
  echo
  detached_mode=${detached_mode:-y}
  
  # Определение команды запуска
  if [[ "$launch_mode" == "prod" ]]; then
    if [[ "$detached_mode" =~ ^[Yy]$ ]]; then
      cmd="make prod-detach"
    else
      cmd="make prod"
    fi
  else
    if [[ "$detached_mode" =~ ^[Yy]$ ]]; then
      cmd="make dev-detach"
    else
      cmd="make dev"
    fi
  fi
  
  # Запуск приложения
  print_message "Выполнение команды: $cmd"
  $cmd
  
  if [ $? -ne 0 ]; then
    print_error "Не удалось запустить приложение."
    return 1
  fi
  
  # Вывод информации о доступе к приложению
  print_message "Приложение NoteMind успешно запущено!"
  print_message "Веб-интерфейс доступен по адресу: http://localhost:$client_port"
  print_message "API сервер доступен по адресу: http://localhost:$api_port"
  
  if [[ "$detached_mode" =~ ^[Yy]$ ]]; then
    print_message "Для просмотра логов используйте команду: make logs${launch_mode/#prod/}"
  fi
  
  return 0
}

# Основная функция установки и запуска
install_and_run() {
  print_message "Начало установки NoteMind..."
  
  # Проверяем root права
  check_root
  
  # Проверяем и устанавливаем зависимости
  check_dependencies
  
  # Клонируем репозиторий
  clone_repository
  if [ $? -ne 0 ]; then
    return 1
  fi
  
  # Настраиваем переменные окружения
  setup_environment
  
  # Запускаем приложение
  start_application
  if [ $? -ne 0 ]; then
    return 1
  fi
  
  print_message "Установка и запуск NoteMind завершены успешно!"
  return 0
}

# Запускаем основную функцию
install_and_run

# Проверяем результат выполнения
if [ $? -ne 0 ]; then
  print_error "Установка завершена с ошибками. Пожалуйста, проверьте логи."
  exit 1
fi

exit 0